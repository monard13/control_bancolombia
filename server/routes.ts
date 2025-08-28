import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import sharp from "sharp";
import { storage } from "./storage";
import { ocrService } from "./services/ocrService";
import { aiService } from "./services/aiService";
import { ObjectStorageService } from "./objectStorage";
import { insertTransactionSchema, transactionFilterSchema } from "@shared/schema";
import { z } from "zod";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and PDF files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get transaction summary for dashboard
  app.get("/api/transactions/summary", async (req, res) => {
    try {
      const summary = await storage.getTransactionsSummary();
      res.json(summary);
    } catch (error) {
      console.error('Error fetching summary:', error);
      res.status(500).json({ error: "Failed to fetch summary" });
    }
  });

  // Get transactions with filters
  app.get("/api/transactions", async (req, res) => {
    try {
      const filters = transactionFilterSchema.parse(req.query);
      const limit = parseInt(req.query.limit as string) || 25;
      const offset = parseInt(req.query.offset as string) || 0;

      // Convert period to date range
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      const now = new Date();

      if (filters.period) {
        switch (filters.period) {
          case 'week':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'quarter':
            startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        }
        endDate = now;
      }

      if (filters.startDate) startDate = new Date(filters.startDate);
      if (filters.endDate) endDate = new Date(filters.endDate);

      const transactions = await storage.getTransactions({
        type: filters.type,
        category: filters.category,
        search: filters.search,
        startDate,
        endDate,
        limit,
        offset,
      });

      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Create new transaction
  app.post("/api/transactions", async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: "Failed to create transaction" });
      }
    }
  });

  // Update transaction
  app.put("/api/transactions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(id, updates);
      
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: "Failed to update transaction" });
      }
    }
  });

  // Delete transaction
  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTransaction(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  });

  // Get single transaction
  app.get("/api/transactions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const transaction = await storage.getTransaction(id);
      
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({ error: "Failed to fetch transaction" });
    }
  });

  // Upload and process receipt
  app.post("/api/receipts/upload", upload.single('receipt'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      let imageBuffer = req.file.buffer;

      // Convert PDF to image if needed (simplified - in production would need pdf-poppler)
      if (req.file.mimetype === 'application/pdf') {
        return res.status(400).json({ error: "PDF processing not implemented yet" });
      }

      // Ensure image is in a format that OCR can process
      imageBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 90 })
        .toBuffer();

      // Store the image (optional - for receipt keeping)
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      
      // Upload to object storage (simplified - in production would use presigned URL)
      // For now, just process the image directly

      // Extract text using OCR
      const ocrText = await ocrService.processImage(imageBuffer);
      
      if (!ocrText.trim()) {
        return res.status(400).json({ error: "No text could be extracted from the image" });
      }

      // Extract structured data using AI
      const extractedData = await aiService.extractTransactionData(ocrText);

      res.json({
        extractedData,
        ocrText,
        message: "Receipt processed successfully"
      });

    } catch (error) {
      console.error('Error processing receipt:', error);
      res.status(500).json({ error: "Failed to process receipt" });
    }
  });

  // Object storage upload endpoint
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error('Error getting upload URL:', error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
