import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

export class OCRService {
  private worker: Tesseract.Worker | null = null;

  async initialize() {
    if (!this.worker) {
      this.worker = await createWorker();
      await this.worker.loadLanguage('spa+eng');
      await this.worker.initialize('spa+eng');
    }
  }

  async processImage(imageBuffer: Buffer): Promise<string> {
    await this.initialize();
    
    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    try {
      // Preprocess image for better OCR results
      const processedBuffer = await sharp(imageBuffer)
        .grayscale()
        .normalize()
        .sharpen()
        .toBuffer();

      const { data: { text } } = await this.worker.recognize(processedBuffer);
      return text.trim();
    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export const ocrService = new OCRService();
