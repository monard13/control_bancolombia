import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import sharp from "sharp";
import { storage } from "./storage";
import { ocrService } from "./services/ocrService";
import { aiService } from "./services/aiService";
import { ObjectStorageService } from "./objectStorage";
import { insertTransactionSchema, transactionFilterSchema, loginSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

// Extend Express Session interface
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userRole?: 'admin' | 'user' | 'visitor';
  }
}

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

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
  
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(credentials.email);
      if (!user) {
        return res.status(401).json({ error: "Credenciales incorrectas. Intente de nuevo." });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(credentials.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Credenciales incorrectas. Intente de nuevo." });
      }
      
      // Store user information in session
      req.session.userId = user.id;
      req.session.userRole = user.role as 'admin' | 'user' | 'visitor';
      
      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      res.json({ 
        user: userWithoutPassword,
        message: "Login exitoso" 
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error('Error during login:', error);
        res.status(500).json({ error: "Error interno del servidor" });
      }
    }
  });

  // Register new user endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ error: "Ya existe un usuario con este correo electrónico" });
      }
      
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ error: "Ya existe un usuario con este nombre de usuario" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Send welcome email
      try {
        await sendWelcomeEmail(user.email, user.username);
      } catch (emailError) {
        console.log('Warning: Could not send welcome email:', emailError);
        // Continue with registration even if email fails
      }
      
      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ 
        user: userWithoutPassword,
        message: "Usuario registrado exitosamente" 
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error('Error during registration:', error);
        res.status(500).json({ error: "Error interno del servidor" });
      }
    }
  });

  // Create test users endpoint (for initial setup)
  app.post("/api/auth/setup", async (req, res) => {
    try {
      const testUsers = [
        {
          username: "admin",
          email: "admin@dominio.com",
          password: await bcrypt.hash("admin123", 10),
          role: "admin" as const
        },
        {
          username: "usuario",
          email: "usuario@dominio.com", 
          password: await bcrypt.hash("user123", 10),
          role: "user" as const
        },
        {
          username: "visitante",
          email: "visitante@dominio.com",
          password: await bcrypt.hash("guest123", 10),
          role: "visitor" as const
        }
      ];

      const createdUsers = [];
      for (const userData of testUsers) {
        // Check if user already exists
        const existingUser = await storage.getUserByEmail(userData.email);
        if (!existingUser) {
          const user = await storage.createUser(userData);
          const { password, ...userWithoutPassword } = user;
          createdUsers.push(userWithoutPassword);
        }
      }

      res.json({ 
        message: `${createdUsers.length} usuarios de prueba creados`,
        users: createdUsers 
      });
      
    } catch (error) {
      console.error('Error creating test users:', error);
      res.status(500).json({ error: "Error creando usuarios de prueba" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get transaction summary for dashboard
  app.get("/api/transactions/summary", requireAuth, async (req, res) => {
    try {
      const summary = await storage.getTransactionsSummary();
      res.json(summary);
    } catch (error) {
      console.error('Error fetching summary:', error);
      res.status(500).json({ error: "Failed to fetch summary" });
    }
  });

  // Get transactions with filters
  app.get("/api/transactions", requireAuth, async (req, res) => {
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
        type: filters.type === 'all' ? undefined : filters.type,
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
  app.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      
      // If there's a receiptUrl, normalize it to the proper object path
      if (transactionData.receiptUrl) {
        const objectStorageService = new ObjectStorageService();
        transactionData.receiptUrl = objectStorageService.normalizeObjectEntityPath(transactionData.receiptUrl);
      }
      
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
  app.put("/api/transactions/:id", requireAuth, async (req, res) => {
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
        console.error('Validation error updating transaction:', error.errors);
        res.status(400).json({ error: error.errors });
      } else {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: "Failed to update transaction" });
      }
    }
  });

  // Partial update transaction (for reconciliation status, etc.)
  app.patch("/api/transactions/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(id, updates);
      
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      console.error('Error updating transaction:', error);
      res.status(500).json({ error: "Failed to update transaction" });
    }
  });

  // Delete transaction
  app.delete("/api/transactions/:id", requireAuth, async (req, res) => {
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
  app.get("/api/transactions/:id", requireAuth, async (req, res) => {
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
  app.post("/api/receipts/upload", requireAuth, upload.single('receipt'), async (req, res) => {
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

      // Store the image in object storage for receipt keeping
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      
      // Upload to object storage using the presigned URL
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: imageBuffer,
        headers: {
          'Content-Type': 'image/jpeg',
        },
      });

      if (!uploadResponse.ok) {
        console.error('Failed to upload to object storage:', uploadResponse.statusText);
      }

      // Get the object path from the upload URL for later reference
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      // Extract text using OCR
      const ocrText = await ocrService.processImage(imageBuffer);
      
      if (!ocrText.trim()) {
        return res.status(400).json({ error: "No text could be extracted from the image" });
      }

      // Extract structured data using AI (with fallback)
      let extractedData;
      let aiAvailable = true;
      
      try {
        extractedData = await aiService.extractTransactionData(ocrText);
      } catch (aiError) {
        console.log('AI service unavailable, falling back to OCR-only mode:', aiError instanceof Error ? aiError.message : String(aiError));
        aiAvailable = false;
        
        // Fallback: provide basic structure with OCR text
        extractedData = {
          amount: null,
          description: ocrText.substring(0, 100), // First 100 chars as description
          category: 'EGRESO', // Default to expense for most receipts
          date: new Date().toISOString().split('T')[0],
          vendor: '',
          confidence: 0.5, // Medium confidence since it's OCR-only
          rawText: ocrText
        };
      }

      res.json({
        extractedData,
        ocrText,
        aiAvailable,
        receiptUrl: uploadResponse.ok ? objectPath : null,
        message: aiAvailable 
          ? "Receipt processed successfully with AI analysis"
          : "Receipt processed with OCR only - AI analysis unavailable (check OpenAI credits)"
      });

    } catch (error) {
      console.error('Error processing receipt:', error);
      res.status(500).json({ error: "Failed to process receipt" });
    }
  });

  // Serve receipt objects
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error('Error serving object:', error);
      return res.sendStatus(404);
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

// Email service function
async function sendWelcomeEmail(email: string, username: string) {
  // Configure email transporter (using Gmail as example)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'monard.aaron@gmail.com',
      pass: process.env.EMAIL_APP_PASSWORD || 'your-app-password-here'
    }
  });

  const mailOptions = {
    from: 'monard.aaron@gmail.com',
    to: email,
    subject: 'Bienvenido a FinanceTracker - Base Solution SAS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
          <h1>¡Bienvenido a FinanceTracker!</h1>
          <h2>BASE SOLUTION SAS</h2>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h3>Hola ${username},</h3>
          
          <p>Tu cuenta ha sido creada exitosamente en FinanceTracker.</p>
          
          <p><strong>Detalles de tu cuenta:</strong></p>
          <ul>
            <li><strong>Usuario:</strong> ${username}</li>
            <li><strong>Email:</strong> ${email}</li>
          </ul>
          
          <p>Ya puedes iniciar sesión en la aplicación con tus credenciales.</p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="https://${process.env.REPLIT_DEV_DOMAIN || 'your-app-domain.com'}" 
               style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Iniciar Sesión
            </a>
          </div>
          
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          
          <p>Saludos,<br>
          El equipo de Base Solution SAS</p>
        </div>
        
        <div style="background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p>&copy; 2025 Base Solution SAS. Todos los derechos reservados.</p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}
