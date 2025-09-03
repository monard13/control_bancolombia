import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

export class OCRService {
  private worker: Tesseract.Worker | null = null;
  private lastUseTime: number = 0;
  private isProcessing: boolean = false;
  private readonly workerTimeout: number = 30 * 60 * 1000; // 30 minutos

  async initialize(force: boolean = false) {
    const now = Date.now();
    const needsReinit = force || 
                       !this.worker || 
                       (now - this.lastUseTime > this.workerTimeout);

    if (needsReinit) {
      await this.cleanup();
      
      this.worker = await createWorker('spa+eng', 1, {
        logger: m => {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}% - ${m.status}`);
        }
      });

      this.lastUseTime = now;
      console.log('OCR worker initialized');
    }
  }

  async processImage(imageBuffer: Buffer): Promise<string> {
    if (this.isProcessing) {
      throw new Error('OCR worker is busy processing another image');
    }

    try {
      this.isProcessing = true;
      await this.initialize();
      
      if (!this.worker) {
        throw new Error('OCR worker not initialized');
      }

      console.log('Pre-processing image for OCR...');
      const processedBuffer = await this.preprocessImage(imageBuffer);

      console.log('Starting OCR text extraction...');
      const { data: { text } } = await this.worker.recognize(processedBuffer);
      
      const cleanText = this.cleanupText(text);
      console.log(`OCR completed. Extracted ${cleanText.length} characters`);
      
      this.lastUseTime = Date.now();
      return cleanText;

    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error('Failed to extract text from image');
    } finally {
      this.isProcessing = false;
    }
  }

  private async preprocessImage(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .grayscale()
        .normalize()
        .sharpen()
        .median(3) // Reduce noise
        .linear(1.5, -0.2) // Increase contrast
        .threshold(128) // Convert to binary
        .toBuffer();
    } catch (error) {
      console.error('Image preprocessing error:', error);
      throw new Error('Failed to preprocess image for OCR');
    }
  }

  private cleanupText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/[^\x20-\x7E\xA0-\xFF]/g, '') // Remove non-printable characters
      .replace(/[^\S\r\n]+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  async cleanup() {
    if (this.worker) {
      try {
        await this.worker.terminate();
        console.log('OCR worker terminated');
      } catch (error) {
        console.error('Error terminating OCR worker:', error);
      } finally {
        this.worker = null;
      }
    }
  }
}

export const ocrService = new OCRService();
