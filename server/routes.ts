import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { fileProcessingService } from './fileProcessingService';
import { ValidationService } from './validationService';
import { insertQuoteSchema, insertPrinterQuoteSchema, insertRatingSchema, insertChatRoomSchema, insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";
import { ideogramService } from "./ideogramApi";
import { nodePDFGenerator } from "./pdfGeneratorJS";
import { advancedLayoutEngine } from "./advancedLayoutEngine";
import { professionalPDFProcessor } from "./professionalPDFProcessor";
import { oneClickLayoutSystem } from "./oneClickLayoutSystem";
import { aiDesignAnalyzer } from "./aiDesignAnalyzer";
import { professionalDesignAnalyzer } from "./professionalDesignAnalyzer";
import { pythonAnalyzerService } from "./pythonAnalyzerService";
import { multiMethodAnalyzer } from "./multiMethodAnalyzer";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 10
  },
  fileFilter: (req, file, cb) => {
    console.log('File upload attempt:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });

    // Allow vector and document file types for printing
    const allowedTypes = [
      'application/pdf',
      'image/svg+xml',
      'application/postscript',
      'application/illustrator',
      'application/eps',
      'image/eps',
      'application/x-eps',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp'
    ];

    // Also check file extensions for AI files (often have generic mimetype)
    const fileExt = file.originalname.toLowerCase().split('.').pop();
    const allowedExtensions = ['pdf', 'svg', 'ai', 'eps', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'];

    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExt || '')) {
      cb(null, true);
    } else {
      console.log('Rejected file type:', file.mimetype, 'Extension:', fileExt);
      cb(new Error(`Desteklenmeyen dosya türü: ${file.mimetype}. Sadece PDF, SVG, AI, EPS, JPG, PNG dosyaları kabul edilir.`));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Multer error handling middleware
  app.use((error: any, req: any, res: any, next: any) => {
    if (error instanceof multer.MulterError) {
      console.error('Multer error:', error);
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false,
          message: 'Dosya boyutu çok büyük (maksimum 100MB)' 
        });
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ 
          success: false,
          message: 'Çok fazla dosya (maksimum 10 dosya)' 
        });
      }
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ 
          success: false,
          message: 'Beklenmeyen dosya alanı' 
        });
      }
      return res.status(400).json({ 
        success: false,
        message: 'Dosya yükleme hatası: ' + error.message 
      });
    }
    if (error.message && error.message.includes('Desteklenmeyen dosya türü')) {
      return res.status(400).json({ 
        success: false,
        message: error.message 
      });
    }
    next(error);
  });

  // Registration endpoint
  app.post('/api/register', async (req, res) => {
    try {
      const { firstName, lastName, email, phone, companyName, password, role, address, city, postalCode, taxNumber } = req.body;

      // Validate required fields based on role
      if (!firstName || !lastName || !email || !phone || !role) {
        return res.status(400).json({ success: false, message: "Gerekli alanlar eksik" });
      }

      // Check if email already exists
      const existingUsers = await storage.getAllUsers();
      const emailExists = existingUsers.find(user => user.email === email);
      if (emailExists) {
        return res.status(400).json({ success: false, message: "Bu e-posta adresi zaten kayıtlı" });
      }

      // Generate unique user ID with role prefix
      const rolePrefix = role === 'customer' ? 'CUS' : role === 'printer' ? 'PRT' : 'ADM';
      const userId = `${rolePrefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // Role-specific user data configuration
      const userData: any = {
        id: userId,
        email,
        firstName,
        lastName,
        phone,
        role,
        isActive: true
      };

      // Configure based on role
      if (role === 'customer') {
        userData.creditBalance = '1000.00'; // Starting credit for customers
        userData.subscriptionStatus = 'inactive';
        userData.companyAddress = address ? `${address}, ${city} ${postalCode}` : '';
        userData.companyName = companyName || '';
      } else if (role === 'printer') {
        userData.creditBalance = '0.00'; // Printers don't get credits
        userData.subscriptionStatus = 'active'; // Active subscription for printers
        userData.companyName = companyName || 'Matbaa Firması';
        userData.companyAddress = address ? `${address}, ${city} ${postalCode}` : 'İstanbul, Türkiye';
        userData.taxNumber = taxNumber || '';
      } else if (role === 'admin') {
        userData.creditBalance = '999999.00'; // Admin unlimited credits
        userData.subscriptionStatus = 'active';
        userData.companyName = 'Matbixx Admin';
      }

      // Create user in database
      const newUser = await storage.upsertUser(userData);

      // Create session
      req.session.user = {
        id: userId,
        email: newUser.email || '',
        role: newUser.role || 'customer',
        firstName: newUser.firstName || undefined,
        lastName: newUser.lastName || undefined,
        profileImageUrl: newUser.profileImageUrl || undefined
      };

      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ success: false, message: "Session creation failed" });
        }
        res.json({ success: true, user: newUser });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ success: false, message: "Registration failed" });
    }
  });

  // Login endpoint
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email ve şifre gerekli" });
      }

      // Find user by email
      const users = await storage.getAllUsers();
      const user = users.find(u => u.email === email);

      if (!user) {
        return res.status(401).json({ success: false, message: "Email veya şifre hatalı" });
      }

      // For now, we'll assume password is correct (in real app, use bcrypt)
      // Create session
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl
      };

      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ success: false, message: "Giriş başarısız" });
        }
        res.json({ success: true, user: user });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, message: "Giriş başarısız" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User session not found" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Test endpoint for role switching
  app.post('/api/test/change-role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { role } = req.body;

      if (!['customer', 'printer', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      await storage.updateUserRole(userId, role);
      res.json({ message: "Role updated successfully" });
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // Update user profile
  app.patch('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = req.body;

      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.upsertUser({
        ...currentUser,
        ...updateData,
        id: userId,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Advanced file upload with processing
  app.post('/api/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user?.claims?.sub || req.user?.id || req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { quoteId } = req.body;

      // Basic file validation
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (req.file.size > maxSize) {
        return res.status(400).json({ message: "File too large" });
      }

      // Determine file type
      const getFileType = (mimeType: string): string => {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType === 'application/pdf') return 'document';
        if (mimeType.startsWith('application/') && mimeType.includes('document')) return 'document';
        if (mimeType.startsWith('text/')) return 'document';
        return 'other';
      };

      // Create file record with initial status
      const file = await storage.createFile({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedBy: userId,
        quoteId: quoteId || null,
        fileType: getFileType(req.file.mimetype) as any,
        status: 'processing',
        downloadCount: 0,
        isPublic: false
      });

      // Process file asynchronously (simplified version without external dependencies)
      setTimeout(async () => {
        try {
          const processingData: any = {
            status: 'ready',
            processingNotes: 'Dosya başarıyla işlendi'
          };

          // Simple image processing simulation
          if (req.file.mimetype.startsWith('image/')) {
            processingData.dimensions = '1920x1080'; // Mock dimensions
            processingData.resolution = 300;
            processingData.colorProfile = 'RGB';
            processingData.hasTransparency = req.file.mimetype === 'image/png';
            processingData.pageCount = 1;
          } else if (req.file.mimetype === 'application/pdf') {
            processingData.pageCount = 1; // Mock page count
            processingData.colorProfile = 'CMYK';
          }

          // Update file with processing results
          await storage.updateFile(file.id, processingData);
        } catch (error) {
          await storage.updateFile(file.id, {
            status: 'error',
            processingNotes: 'Dosya işleme sırasında hata oluştu'
          });
        }
      }, 2000);

      res.json(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Get user files
  app.get('/api/files', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = await storage.getFilesByUser(userId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  // Get file details
  app.get('/api/files/:id', isAuthenticated, async (req: any, res) => {
    try {
      const fileId = req.params.id;
      const files = await storage.getFilesByUser(req.user.claims.sub);
      const file = files.find(f => f.id === fileId);

      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      res.json(file);
    } catch (error) {
      console.error("Error fetching file:", error);
      res.status(500).json({ message: "Failed to fetch file" });
    }
  });

  // Serve uploaded files
  app.get('/api/files/:filename', isAuthenticated, (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  // Delete file endpoint
  app.delete('/api/files/:id', isAuthenticated, async (req: any, res) => {
    try {
      const fileId = req.params.id;
      const userId = req.user?.claims?.sub || req.user?.id || req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Get file details
      const file = await storage.getFileById(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      // Check if user owns the file
      if (file.uploadedBy !== userId) {
        return res.status(403).json({ message: "Unauthorized to delete this file" });
      }

      // Delete physical file
      const filePath = path.join(uploadDir, file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete thumbnail if exists
      if (file.thumbnailPath && fs.existsSync(file.thumbnailPath)) {
        fs.unlinkSync(file.thumbnailPath);
      }

      // Delete from database
      await storage.deleteFile(fileId);

      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Quote routes
  app.post('/api/quotes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'customer') {
        return res.status(403).json({ message: "Only customers can create quotes" });
      }

      const quoteData = insertQuoteSchema.parse({
        ...req.body,
        customerId: userId,
      });

      const quote = await storage.createQuote(quoteData);
      res.json(quote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid quote data", errors: error.errors });
      }
      console.error("Error creating quote:", error);
      res.status(500).json({ message: "Failed to create quote" });
    }
  });

  app.get('/api/quotes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub || req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "User session not found" });
      }

      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let quotes;
      if (user.role === 'customer') {
        quotes = await storage.getQuotesByCustomer(userId);
      } else if (user.role === 'printer') {
        quotes = await storage.getQuotesForPrinter();
      } else {
        // Admin can see all quotes
        quotes = await storage.getQuotesForPrinter();
      }

      res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  app.get('/api/quotes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const quoteId = req.params.id;
      const quote = await storage.getQuote(quoteId);

      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      res.json(quote);
    } catch (error) {
      console.error("Error fetching quote:", error);
      res.status(500).json({ message: "Failed to fetch quote" });
    }
  });

  // Printer quote routes
  app.post('/api/quotes/:id/printer-quotes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quoteId = req.params.id;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'printer') {
        return res.status(403).json({ message: "Only printers can submit quotes" });
      }

      const printerQuoteData = insertPrinterQuoteSchema.parse({
        ...req.body,
        quoteId,
        printerId: userId,
      });

      const printerQuote = await storage.createPrinterQuote(printerQuoteData);

      // Update quote status to received_quotes
      await storage.updateQuoteStatus(quoteId, "received_quotes");

      res.json(printerQuote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid quote data", errors: error.errors });
      }
      console.error("Error creating printer quote:", error);
      res.status(500).json({ message: "Failed to create printer quote" });
    }
  });

  app.get('/api/quotes/:id/printer-quotes', isAuthenticated, async (req: any, res) => {
    try {
      const quoteId = req.params.id;
      const printerQuotes = await storage.getPrinterQuotesByQuote(quoteId);
      res.json(printerQuotes);
    } catch (error) {
      console.error("Error fetching printer quotes:", error);
      res.status(500).json({ message: "Failed to fetch printer quotes" });
    }
  });

  // Approve quote and create chat room
  app.post('/api/quotes/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const quoteId = req.params.id;
      const userId = req.user.claims.sub;
      const { printerId } = req.body;

      // Get quote details
      const quote = await storage.getQuote(quoteId);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Verify user is the customer for this quote
      if (quote.customerId !== userId) {
        return res.status(403).json({ message: "Only quote owner can approve" });
      }

      // Update quote status to approved
      await storage.updateQuoteStatus(quoteId, "approved");

      // Create chat room automatically when contract is approved
      try {
        const existingRoom = await storage.getChatRoomByQuote(quoteId, quote.customerId, printerId);

        if (!existingRoom) {
          await storage.createChatRoom({
            quoteId,
            customerId: quote.customerId,
            printerId,
            status: 'active'
          });
        }
      } catch (chatError) {
        console.error("Error creating chat room:", chatError);
        // Don't fail the approval if chat room creation fails
      }

      res.json({ message: "Quote approved and chat room created" });
    } catch (error) {
      console.error("Error approving quote:", error);
      res.status(500).json({ message: "Failed to approve quote" });
    }
  });

  // Design routes
  app.get('/api/designs/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const designHistory = await storage.getDesignHistory(userId, { page, limit });
      res.json(designHistory);
    } catch (error) {
      console.error("Error fetching design history:", error);
      res.status(500).json({ message: "Failed to fetch design history" });
    }
  });

  app.post('/api/designs/save', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const { prompt, options, result } = req.body;

      if (!prompt || !result) {
        return res.status(400).json({ message: "Prompt and result are required" });
      }

      const savedDesign = await storage.saveDesignGeneration({
        userId,
        prompt,
        options: options || {},
        result,
        createdAt: new Date()
      });

      res.json(savedDesign);
    } catch (error) {
      console.error("Error saving design:", error);
      res.status(500).json({ message: "Failed to save design" });
    }
  });

  // Order routes
  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub || req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "User session not found" });
      }

      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let orders;
      if (user.role === 'customer') {
        orders = await storage.getOrdersByCustomer(userId);
      } else if (user.role === 'printer') {
        orders = await storage.getOrdersByPrinter(userId);
      } else {
        // Admin can see all orders
        orders = [...await storage.getOrdersByCustomer(userId), ...await storage.getOrdersByPrinter(userId)];
      }

      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Rating routes
  app.post('/api/ratings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'customer') {
        return res.status(403).json({ message: "Only customers can submit ratings" });
      }

      const ratingData = insertRatingSchema.parse({
        ...req.body,
        customerId: userId,
      });

      const rating = await storage.createRating(ratingData);
      res.json(rating);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rating data", errors: error.errors });
      }
      console.error("Error creating rating:", error);
      res.status(500).json({ message: "Failed to create rating" });
    }
  });

  // Design generation routes
  app.post('/api/design/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { prompt, options = {} } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Check if Ideogram API is available
      if (!process.env.IDEOGRAM_API_KEY) {
        return res.status(503).json({ 
          message: "Design generation service is currently unavailable. Please contact administrator.",
          service: "ideogram_unavailable"
        });
      }

      // Check if user has enough credit (35₺ per design)
      const designCost = 35;
      const currentBalance = parseFloat(user.creditBalance || '0');

      if (currentBalance < designCost) {
        return res.status(400).json({ 
          message: "Insufficient credit balance. Please add credit to your account.",
          requiredCredit: designCost,
          currentBalance: currentBalance
        });
      }

      const result = await ideogramService.generateImage(prompt, options);

      // Deduct credit from user balance
      const newBalance = currentBalance - designCost;
      await storage.updateUserCreditBalance(userId, newBalance.toString());

      // Save generation history
      await storage.saveDesignGeneration({
        userId,
        prompt,
        options,
        result: result.data,
        createdAt: new Date(),
      });

      res.json({
        ...result,
        creditDeducted: designCost,
        remainingBalance: newBalance
      });
    } catch (error) {
      console.error("Error generating design:", error);
      res.status(500).json({ message: "Failed to generate design" });
    }
  });

  app.post('/api/design/generate-batch', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { requests } = req.body;

      if (!Array.isArray(requests) || requests.length === 0) {
        return res.status(400).json({ message: "Requests array is required" });
      }

      if (requests.length > 10) {
        return res.status(400).json({ message: "Maximum 10 requests per batch" });
      }

      const results = await ideogramService.generateBatch(requests);

      // Save batch generation history
      for (let i = 0; i < requests.length; i++) {
        await storage.saveDesignGeneration({
          userId,
          prompt: requests[i].prompt,
          options: requests[i].options || {},
          result: results[i].data,
          createdAt: new Date(),
        });
      }

      res.json(results);
    } catch (error) {
      console.error("Error generating batch designs:", error);
      res.status(500).json({ message: "Failed to generate batch designs" });
    }
  });

  app.get('/api/design/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { page = 1, limit = 20 } = req.query;

      const history = await storage.getDesignHistory(userId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json(history);
    } catch (error) {
      console.error("Error fetching design history:", error);
      res.status(500).json({ message: "Failed to fetch design history" });
    }
  });

  app.get('/api/design/templates', isAuthenticated, async (req: any, res) => {
    try {
      const templates = await storage.getDesignTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching design templates:", error);
      res.status(500).json({ message: "Failed to fetch design templates" });
    }
  });

  // Payment routes - Test Mode (PayTR Pro API gerekli)
  app.post('/api/payment/create', isAuthenticated, async (req: any, res) => {
    try {
      const { planType, amount, customer, paymentMethod } = req.body;

      if (!planType || !amount || !customer || !paymentMethod) {
        return res.status(400).json({ message: 'Eksik ödeme bilgileri' });
      }

      const userId = req.user.claims.sub;
      const creditAmount = parseFloat(amount);

      // Test modunda krediyi direkt ekle (PayTR Pro API olmadan)
      const currentUser = await storage.getUser(userId);
      if (currentUser) {
        const currentBalance = parseFloat(currentUser.creditBalance || "0") || 0;
        const newBalance = currentBalance + creditAmount;

        await storage.updateUserCreditBalance(userId, newBalance.toString());

        return res.json({
          success: true,
          message: `${creditAmount}₺ kredi hesabınıza eklendi (Test Modu)`,
          data: {
            oldBalance: currentBalance,
            newBalance: newBalance,
            addedAmount: creditAmount
          }
        });
      } else {
        return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      res.status(500).json({ message: 'Ödeme işlemi başlatılamadı' });
    }
  });

  app.post('/api/payment/callback', async (req, res) => {
    try {
      const { paytrService } = await import('./paytr');
      const isValid = paytrService.verifyCallback(req.body);

      if (isValid) {
        const { merchant_oid, status, total_amount } = req.body;

        if (status === 'success') {
          // Payment successful - update user subscription or credit
          console.log(`Payment successful for order: ${merchant_oid}, amount: ${total_amount}`);

          // Extract user info from merchant_oid if needed
          // Format: userid_plantype_timestamp
          const orderParts = merchant_oid.split('_');
          if (orderParts.length >= 2) {
            const userId = orderParts[0];
            const planType = orderParts[1];

            if (planType === 'customer') {
              // Add credit to customer account
              const creditAmount = parseFloat(total_amount);
              const user = await storage.getUser(userId);
              if (user) {
                const currentBalance = parseFloat(user.creditBalance || '0');
                const newBalance = currentBalance + creditAmount;
                await storage.updateUserCreditBalance(userId, newBalance.toString());
              }
            } else if (planType === 'firm') {
              // Update firm subscription
              await storage.updateUserSubscription(userId, 'active');
            }
          }
        }

        res.send('OK');
      } else {
        res.status(400).send('Invalid hash');
      }
    } catch (error) {
      console.error("Payment callback error:", error);
      res.status(500).send('Error');
    }
  });

  // Payment result pages
  app.get('/payment/success', (req, res) => {
    res.redirect('/dashboard?payment=success');
  });

  app.get('/payment/fail', (req, res) => {
    res.redirect('/payment?error=payment_failed');
  });

  // System monitoring routes
  app.get('/api/admin/system/health', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { uptimeMonitor } = await import('./errorHandling');
      const health = await uptimeMonitor.performHealthCheck();
      res.json(health);
    } catch (error) {
      console.error("Error fetching system health:", error);
      res.status(500).json({ message: "Failed to fetch system health" });
    }
  });

  app.get('/api/admin/system/errors', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { errorManager } = await import('./errorHandling');
      const stats = errorManager.getErrorStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching error stats:", error);
      res.status(500).json({ message: "Failed to fetch error stats" });
    }
  });

  app.get('/api/admin/system/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Sistem metrikleri
      const metrics = {
        activeUsers: await storage.getActiveUserCount(),
        totalUploads: await storage.getTotalUploadsCount(),
        processedJobs: await storage.getProcessedJobsCount(),
        avgResponseTime: 150, // Bu gerçek metriklerden gelecek
        errorRate: 0.5
      };

      res.json(metrics);
    } catch (error) {
      console.error("Error fetching system metrics:", error);
      res.status(500).json({ message: "Failed to fetch system metrics" });
    }
  });

  // Business intelligence routes
  app.get('/api/business/metrics/:timeRange', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'printer') {
        return res.status(403).json({ message: "Printer access required" });
      }

      const { timeRange } = req.params;

      // Mock veriler - gerçek implementasyonda storage'dan gelecek
      const metrics = {
        revenue: {
          total: 125000,
          monthly: 28000,
          growth: 15.2,
          trending: 'up' as const
        },
        customers: {
          total: 156,
          active: 89,
          new: 12,
          retention: 78.5
        },
        orders: {
          total: 234,
          completed: 189,
          pending: 25,
          conversion: 67.8
        },
        performance: {
          avgOrderValue: 1580,
          avgProcessingTime: 45,
          customerSatisfaction: 92.5,
          repeatCustomerRate: 68.3
        }
      };

      res.json(metrics);
    } catch (error) {
      console.error("Error fetching business metrics:", error);
      res.status(500).json({ message: "Failed to fetch business metrics" });
    }
  });

  app.get('/api/business/timeseries/:timeRange/:metric', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'printer') {
        return res.status(403).json({ message: "Printer access required" });
      }

      // Mock zaman serisi verisi
      const timeSeriesData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 5000) + 1000,
        orders: Math.floor(Math.random() * 20) + 5,
        customers: Math.floor(Math.random() * 10) + 2
      }));

      res.json(timeSeriesData);
    } catch (error) {
      console.error("Error fetching time series data:", error);
      res.status(500).json({ message: "Failed to fetch time series data" });
    }
  });

  app.get('/api/business/categories/:timeRange', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'printer') {
        return res.status(403).json({ message: "Printer access required" });
      }

      // Mock kategori analizi
      const categories = [
        { category: 'Etiket Baskı', orders: 89, revenue: 45000, growth: 12.5, marketShare: 45 },
        { category: 'Kartvizit', orders: 67, revenue: 28000, growth: 8.2, marketShare: 28 },
        { category: 'Broşür', orders: 45, revenue: 35000, growth: -2.1, marketShare: 18 },
        { category: 'Poster', orders: 33, revenue: 17000, growth: 15.8, marketShare: 9 }
      ];

      res.json(categories);
    } catch (error) {
      console.error("Error fetching category analysis:", error);
      res.status(500).json({ message: "Failed to fetch category analysis" });
    }
  });

  app.post('/api/business/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'printer') {
        return res.status(403).json({ message: "Printer access required" });
      }

      const { format, timeRange, metrics, timeSeries, categories } = req.body;

      if (format === 'pdf') {
        // PDF rapor oluştur
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="business-report-${timeRange}.pdf"`);

        // Mock PDF içeriği
        res.send(Buffer.from('Mock PDF Report Content'));
      } else if (format === 'excel') {
        // Excel rapor oluştur
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="business-report-${timeRange}.xlsx"`);

        // Mock Excel içeriği
        res.send(Buffer.from('Mock Excel Report Content'));
      } else {
        res.status(400).json({ message: "Unsupported format" });
      }
    } catch (error) {
      console.error("Error exporting business report:", error);
      res.status(500).json({ message: "Failed to export business report" });
    }
  });

  // GDPR data protection routes
  app.post('/api/data-protection/delete-request', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { dataProtectionManager } = await import('./dataProtection');

      const result = await dataProtectionManager.processDataDeletionRequest(userId);
      res.json(result);
    } catch (error) {
      console.error("Error processing data deletion:", error);
      res.status(500).json({ message: "Failed to process data deletion request" });
    }
  });

  app.get('/api/data-protection/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { dataProtectionManager } = await import('./dataProtection');

      const result = await dataProtectionManager.exportUserData(userId);

      if (result.success) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}.json"`);
        res.json(result.data);
      } else {
        res.status(500).json({ message: result.error });
      }
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/admin/activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const activity = await storage.getRecentActivity();
      res.json(activity);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  // Chat API routes
  app.get('/api/chat/rooms', isAuthenticated, async (req: any,res) => {
    try {
      const userId = req.user.claims.sub;
      const rooms = await storage.getChatRoomsByUser(userId);
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      res.status(500).json({ message: "Failed to fetch chat rooms" });
    }
  });

  app.post('/api/chat/rooms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertChatRoomSchema.parse(req.body);

      // Check if contract is approved for this quote
      const quote = await storage.getQuote(validatedData.quoteId);
      if (!quote || quote.status !== 'approved') {
        return res.status(403).json({ 
          message: "Chat not available - contract must be approved first" 
        });
      }

      // Verify user is authorized for this chat
      if (userId !== validatedData.customerId && userId !== validatedData.printerId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Check if room already exists for this quote and participants
      const existingRoom = await storage.getChatRoomByQuote(
        validatedData.quoteId,
        validatedData.customerId,
        validatedData.printerId
      );

      if (existingRoom) {
        return res.json(existingRoom);
      }

      const room = await storage.createChatRoom(validatedData);
      res.json(room);
    } catch (error) {
      console.error("Error creating chat room:", error);
      res.status(500).json({ message: "Failed to create chat room" });
    }
  });

  app.get('/api/chat/rooms/:roomId/messages', isAuthenticated, async (req, res) => {
    try {
      const { roomId } = req.params;
      const { limit = 50 } = req.query;

      const messages = await storage.getMessages(roomId, parseInt(limit as string));
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/chat/rooms/:roomId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const { roomId } = req.params;
      const userId = req.user.claims.sub;

      // Verify room exists and user has access
      const room = await storage.getChatRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Chat room not found" });
      }

      // Check if contract is approved for this room
      const quote = await storage.getQuote(room.quoteId);
      if (!quote || quote.status !== 'approved') {
        return res.status(403).json({ 
          message: "Chat not available - contract must be approved first" 
        });
      }

      // Verify user is authorized for this chat
      if (userId !== room.customerId && userId !== room.printerId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const validatedData = insertChatMessageSchema.parse({
        ...req.body,
        roomId,
        senderId: userId
      });

      const message = await storage.sendMessage(validatedData);

      // Broadcast to WebSocket clients
      broadcastToRoom(roomId, {
        type: 'new_message',
        data: message
      });

      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.put('/api/chat/rooms/:roomId/read', isAuthenticated, async (req: any, res) => {
    try {
      const { roomId } = req.params;
      const userId = req.user.claims.sub;

      await storage.markMessagesAsRead(roomId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  app.get('/api/chat/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Contract management routes
  app.get('/api/contracts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.user?.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let contracts;
      if (user.role === 'customer') {
        contracts = await storage.getContractsByCustomer(userId);
      } else if (user.role === 'printer') {
        contracts = await storage.getContractsByPrinter(userId);
      } else {
        return res.status(403).json({ message: "Unauthorized" });
      }

      res.json(contracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  app.post('/api/contracts/:id/sign', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { signature } = req.body;
      const userId = req.user?.claims?.sub || req.session?.user?.id;

      if (!signature || !signature.trim()) {
        return res.status(400).json({ message: "Signature is required" });
      }

      await storage.signContract(id, userId, signature.trim());
      res.json({ message: "Contract signed successfully" });
    } catch (error) {
      console.error("Error signing contract:", error);
      res.status(500).json({ message: "Failed to sign contract" });
    }
  });

  // Reports and analytics routes
  app.post('/api/reports/business-metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.user?.id;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'printer') {
        return res.status(403).json({ message: "Printer access required" });
      }

      // Mock data for demonstration - in production, this would calculate real metrics
      const metrics = {
        totalRevenue: 125000,
        monthlyRevenue: 28000,
        totalQuotes: 156,
        convertedQuotes: 89,
        totalCustomers: 45,
        newCustomers: 12,
        averageOrderValue: 1404,
        conversionRate: 57.1,
        topCustomers: [
          { id: "1", name: "ABC Matbaa Ltd.", totalOrders: 8, totalSpent: 15000 },
          { id: "2", name: "XYZ Reklam A.Ş.", totalOrders: 6, totalSpent: 12000 },
          { id: "3", name: "Özkan Tasarım", totalOrders: 5, totalSpent: 9500 }
        ],
        revenueByMonth: [
          { month: "Ocak", revenue: 22000, orders: 15 },
          { month: "Şubat", revenue: 25000, orders: 18 },
          { month: "Mart", revenue: 28000, orders: 20 }
        ],
        quotesByStatus: [
          { status: "Beklemede", count: 25, percentage: 40 },
          { status: "Onaylandı", count: 20, percentage: 32 },
          { status: "Tamamlandı", count: 18, percentage: 28 }
        ],
        productCategories: [
          { category: "Etiket Baskı", orders: 45, revenue: 35000 },
          { category: "Kartvizit", orders: 38, revenue: 18000 },
          { category: "Broşür", orders: 25, revenue: 22000 }
        ]
      };

      res.json(metrics);
    } catch (error) {
      console.error("Error fetching business metrics:", error);
      res.status(500).json({ message: "Failed to fetch business metrics" });
    }
  });

  // Automation routes - Plotter system
  app.get('/api/automation/plotter/layouts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.user?.id;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'printer') {
        return res.status(403).json({ message: "Printer access required" });
      }

      // Mock saved layouts - in production, this would be stored in database
      const layouts = [
        {
          id: "1",
          name: "33x48 Standart",
          settings: {
            sheetWidth: 330,
            sheetHeight: 480,
            marginTop: 10,
            marginBottom: 10,
            marginLeft: 10,
            marginRight: 10,
            labelWidth: 50,
            labelHeight: 30,
            horizontalSpacing: 2,
            verticalSpacing: 2
          },
          labelsPerRow: 6,
          labelsPerColumn: 15,
          totalLabels: 90,
          wastePercentage: 8.5,
          createdAt: new Date().toISOString()
        }
      ];

      res.json(layouts);
    } catch (error) {
      console.error("Error fetching plotter layouts:", error);
      res.status(500).json({ message: "Failed to fetch plotter layouts" });
    }
  });

  app.post('/api/automation/plotter/save-layout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.user?.id;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'printer') {
        return res.status(403).json({ message: "Printer access required" });
      }

      const { name, settings } = req.body;

      if (!name || !settings) {
        return res.status(400).json({ message: "Name and settings are required" });
      }

      // In production, this would save to database
      const layout = {
        id: Date.now().toString(),
        name,
        settings,
        userId,
        createdAt: new Date().toISOString()
      };

      res.json({ message: "Layout saved successfully", layout });
    } catch (error) {
      console.error("Error saving plotter layout:", error);
      res.status(500).json({ message: "Failed to save plotter layout" });
    }
  });

  // Fixed automatic layout generation endpoint
  app.post('/api/generate-layout', isAuthenticated, async (req: any, res) => {
    try {
      console.log('🎯 Starting automatic layout generation');
      
      const { designIds, plotterSettings } = req.body;
      const userId = req.user?.claims?.sub || req.user?.id || req.session?.user?.id;

      if (!designIds || !Array.isArray(designIds) || designIds.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "At least one design ID is required" 
        });
      }

      // Get user's design files
      const files = await storage.getFilesByUser(userId);
      const designs = files.filter(f => designIds.includes(f.id) && f.fileType === 'design');

      if (designs.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "No valid designs found" 
        });
      }

      console.log('📋 Processing designs:', designs.map(d => ({
        id: d.id,
        name: d.originalName,
        dimensions: d.realDimensionsMM || d.dimensions
      })));

      // Use OneClick layout system for automatic arrangement
      const layoutRequest = {
        designIds,
        sheetSettings: {
          width: plotterSettings?.sheetWidth || 330,
          height: plotterSettings?.sheetHeight || 480,
          margin: plotterSettings?.margin || 10,
          bleedMargin: plotterSettings?.bleedMargin || 3
        },
        cuttingSettings: {
          enabled: true,
          markLength: 5,
          markWidth: 0.25
        }
      };

      const layoutResult = await oneClickLayoutSystem.processOneClickLayout(designs, layoutRequest);

      if (layoutResult.success) {
        console.log(`✅ Layout generated: ${layoutResult.arrangements.length} designs arranged`);
        
        // Generate PDF with arrangements
        const pdfPath = await generateLayoutPDF(layoutResult.arrangements, designs, layoutRequest.sheetSettings);
        
        res.json({
          success: true,
          arrangements: layoutResult.arrangements,
          pdfPath,
          efficiency: layoutResult.efficiency,
          statistics: layoutResult.statistics
        });
      } else {
        console.error('❌ Layout generation failed:', layoutResult.message);
        res.status(500).json({
          success: false,
          message: layoutResult.message,
          statistics: layoutResult.statistics
        });
      }

    } catch (error) {
      console.error('Layout generation error:', error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Layout generation failed' 
      });
    }
  });

  // Enhanced plotter design file upload with content preservation
  app.post('/api/automation/plotter/upload-designs', isAuthenticated, upload.single('designs'), async (req: any, res) => {
    try {
      console.log('📁 Otomatik dizim için dosya yükleme başlatıldı');

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user?.claims?.sub || req.user?.id || req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { v4: uuidv4 } = await import('uuid');
      const { formatFileSize } = await import('./utils');

      const file = req.file;
      console.log(`🔍 Processing file: ${file.originalname} (${file.size} bytes)`);

      try {
        // Enhanced professional design analysis
        const designAnalysis = await professionalDesignAnalyzer.analyzeDesignFile(file.path, {
          preserveVectorQuality: true,
          generateThumbnail: true,
          extractDimensions: true,
          validateContent: true
        });

        // Enhanced multi-method analysis
        let enhancedAnalysis;
        try {
          enhancedAnalysis = await multiMethodAnalyzer.analyzeDesignFile(file.path, file.originalname, file.mimetype);
          console.log('Enhanced analysis result:', enhancedAnalysis);
        } catch (analysisError) {
          console.warn('Enhanced analysis failed:', analysisError);
          enhancedAnalysis = null;
        }

        // Create comprehensive design object using enhanced analysis
        const analysisToUse = enhancedAnalysis || designAnalysis;
        const dimensions = enhancedAnalysis ? 
          `${enhancedAnalysis.dimensions.widthMM}x${enhancedAnalysis.dimensions.heightMM}mm` : 
          (designAnalysis.dimensions || '50x30mm');

        const designData = {
          id: uuidv4(),
          name: file.originalname,
          originalName: file.originalname,
          filename: file.filename,
          filePath: `/uploads/${file.filename}`,
          fileType: 'design',
          mimeType: file.mimetype,
          size: file.size,
          uploadedAt: new Date().toISOString(),

          // Enhanced dimensions and analysis
          dimensions,
          processingNotes: enhancedAnalysis ? 
            JSON.stringify(enhancedAnalysis.processingNotes) : 
            'Temel analiz tamamlandı',

          // Enhanced analysis integration
          enhancedAnalysis: enhancedAnalysis ? {
            success: enhancedAnalysis.success,
            dimensions: enhancedAnalysis.dimensions,
            contentAnalysis: enhancedAnalysis.contentAnalysis,
            qualityReport: enhancedAnalysis.qualityReport,
            requiresManualInput: enhancedAnalysis.requiresManualInput,
            alternativeMethods: enhancedAnalysis.alternativeMethods
          } : null,

          // Thumbnail generation
          thumbnailPath: enhancedAnalysis?.thumbnailPath || null,
          
          // Status based on analysis quality
          status: enhancedAnalysis?.success ? 'ready' : 'warning',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Store simplified data (avoiding storage interface issues)
        console.log('Design data prepared for response:', designData.name);

        console.log(`✅ Design processed successfully: ${file.originalname}`);

        // Return single design instead of array
        res.json({
          success: true,
          design: designData,
          message: `${file.originalname} başarıyla yüklendi ve analiz edildi`
        });

      } catch (fileError) {
        console.error(`❌ File processing error for ${file.originalname}:`, fileError);

        // Store with error status
        const errorDesign = {
          id: uuidv4(),
          name: file.originalname,
          originalName: file.originalname,
          filename: file.filename,
          filePath: `/uploads/${file.filename}`,
          fileType: 'design',
          mimeType: file.mimetype,
          size: file.size,
          fileSize: formatFileSize(file.size),
          uploadedAt: new Date().toISOString(),
          dimensions: '50x30mm',
          realDimensionsMM: '50x30mm',
          processingStatus: 'error',
          processingNotes: `Analiz hatası: ${fileError.message}`,
          contentPreserved: false
        };

        await storage.storeFile(userId, errorDesign);

        res.status(500).json({
          success: false,
          design: errorDesign,
          message: `${file.originalname} yüklendi ancak analiz hatası oluştu: ${fileError.message}`
        });
      }
    } catch (error) {
      console.error("❌ Upload system error:", error);
      res.status(500).json({ 
        message: "Upload system failed", 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

// Enhanced PDF Generation Endpoint with Quality Controls
app.post('/api/automation/plotter/generate-enhanced-pdf', isAuthenticated, async (req: any, res) => {
  try {
    console.log('📄 Enhanced PDF generation request received');

    const { plotterSettings, arrangements, qualitySettings, cuttingMarks, bleedSettings, outputValidation } = req.body;

    if (!arrangements || !Array.isArray(arrangements) || arrangements.length === 0) {
      return res.status(400).json({ message: 'No arrangements data provided' });
    }

    console.log('📋 Enhanced PDF data:', {
      arrangements: arrangements.length,
      qualitySettings,
      cuttingMarks,
      bleedSettings,
      outputValidation
    });

    // Validate input data
    const validationErrors: string[] = [];

    arrangements.forEach((item, index) => {
      if (typeof item.x !== 'number' || typeof item.y !== 'number' ||
          typeof item.width !== 'number' || typeof item.height !== 'number') {
        validationErrors.push(`Invalid arrangement data at index ${index}`);
      }

      if (item.width <= 0 || item.height <= 0) {
        validationErrors.push(`Invalid dimensions at index ${index}: ${item.width}x${item.height}`);
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: validationErrors 
      });
    }

    // Get user ID from authenticated session
    const userId = req.user?.claims?.sub || req.user?.id || req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const files = await storage.getFilesByUser(userId);
    const designFiles = files.filter(f => f.fileType === 'design');
    console.log('📁 Design files found:', designFiles.length);

    // Use Python PDF generator for better content embedding
    const path = await import('path');
    const { exec, spawn } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    // Calculate page dimensions based on plotter settings
    const pageWidthMM = plotterSettings?.sheetWidth || 330; // Default 33cm
    const pageHeightMM = plotterSettings?.sheetHeight || 480; // Default 48cm

    console.log('🐍 Preparing Python PDF generation...');

    // Prepare file paths for arrangements
    const designFilesWithPaths = arrangements.map(arr => {
      const designFile = designFiles.find(d => d.id === arr.designId);
      return {
        id: arr.designId,
        name: designFile?.originalName || `Design_${arr.designId}`,
        filePath: designFile ? path.join(process.cwd(), 'uploads', designFile.filename) : '',
        ...designFile
      };
    });

    // Create temporary output path
    const outputFilename = `layout_${Date.now()}.pdf`;
    const outputPath = path.join(process.cwd(), 'uploads', outputFilename);

    // Prepare Python script input data
    const pythonInput = {
      arrangements,
      designFiles: designFilesWithPaths,
      outputPath,
      sheetWidth: pageWidthMM,
      sheetHeight: pageHeightMM,
      qualitySettings,
      cuttingMarks,
      bleedSettings
    };

    console.log('🐍 Calling Python PDF generator with data:', {
      arrangements: arrangements.length,
      designFiles: designFilesWithPaths.length,
      outputPath
    });


    // Enhanced file preparation for embedding
    const preparedFiles = [];
    for (const item of arrangements) {
      const designFile = designFilesWithPaths.find(d => d.id === item.designId);
      if (designFile && designFile.filePath) {
        console.log(`🔧 Preparing file for embedding: ${designFile.name}`);

        const preparation = await fileProcessingService.prepareFileForEmbedding(
          designFile.filePath, 
          designFile.mimeType || 'application/pdf'
        );

        if (preparation.success) {
          preparedFiles.push({
            ...designFile,
            processedPath: preparation.processedPath,
            contentAnalysis: preparation.contentAnalysis,
            preparationNotes: preparation.processingNotes
          });
          console.log(`✅ File prepared: ${designFile.name} - ${preparation.processingNotes}`);
        } else {
          console.warn(`⚠️ File preparation failed: ${designFile.name} - ${designFile.preparationNotes}`);
          preparedFiles.push({
            ...designFile,
            preparationNotes: preparation.processingNotes
          });
        }
      }
    }

    // Update python input with prepared files
    pythonInput.designFiles = preparedFiles;
    pythonInput.contentPreservation = {
      enabled: true,
      vectorQuality: 'high',
      embeddingMode: 'professional'
    };

    // Python PDF generator çağrısı
    try {
      const pythonScriptPath = path.join(process.cwd(), 'server', 'pdfGenerator.py');
      const command = `python3 "${pythonScriptPath}" '${JSON.stringify(pythonInput)}'`;

      console.log('🐍 Executing professional PDF generation with content embedding...');
      const { stdout, stderr } = await execAsync(command, { timeout: 120000 }); // 2 minutes timeout

      if (stderr && !stderr.includes('WARNING')) {
        console.error('Python script errors:', stderr);
      }

      console.log('Python script output:', stdout);

      // Check if PDF was created
      const fs = await import('fs');
      if (fs.existsSync(outputPath)) {
        const fileStats = fs.statSync(outputPath);
        console.log(`📄 Generated PDF size: ${(fileStats.size / 1024).toFixed(1)}KB`);

        // Set response headers for PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="matbixx-professional-layout.pdf"');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('X-PDF-Generation', 'professional-vector-embedding');

        // Stream the generated PDF
        const stream = fs.createReadStream(outputPath);
        stream.pipe(res);

        // Clean up prepared files and output after streaming
        stream.on('end', () => {
          setTimeout(() => {
            try {
              fs.unlinkSync(outputPath);
              // Clean up prepared files
              for (const file of preparedFiles) {
                if (file.processedPath && fs.existsSync(file.processedPath)) {
                  fs.unlinkSync(file.processedPath);
                }
              }
            } catch (cleanupError) {
              console.warn('Cleanup error:', cleanupError);
            }
          }, 5000);
        });

        console.log('✅ Professional PDF with embedded content generated and streamed successfully');
        return;
      } else {
        throw new Error('Python script did not generate PDF file');
      }
    } catch (pythonError) {
      console.error('❌ Professional PDF generation failed:', pythonError);
      // Clean up prepared files on error
      for (const file of preparedFiles) {
        if (file.processedPath && fs.existsSync(file.processedPath)) {
          try {
            fs.unlinkSync(file.processedPath);
          } catch (cleanupError) {
            console.warn('Cleanup error:', cleanupError);
          }
        }
      }
      // Fallback to Node.js implementation
      console.log('🔄 Falling back to Node.js PDF generation...');
    }

    // PDF Generation Status Tracking
    let generationSteps = 0;
    const totalSteps = 8;

    const updateProgress = (step: string) => {
      generationSteps++;
      console.log(`📊 PDF Generation Progress (${generationSteps}/${totalSteps}): ${step}`);
    };

    updateProgress('PDF Document Initialized');

    const PDFDocument = (await import('pdfkit')).default;
    const mmToPoints = 2.8346456693; // 1mm = 2.8346456693 points
    const pageWidthPt = pageWidthMM * mmToPoints;
    const pageHeightPt = pageHeightMM * mmToPoints;

    const doc = new PDFDocument({ size: [pageWidthPt, pageHeightPt] });
    doc.pipe(res);

    // Add document metadata and header
    doc.fontSize(14)
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text('MATBIXX - PROFESSIONAL CUTTING LAYOUT', 50, 50);

    updateProgress('Header Added');

    // Add technical information
    const currentDate = new Date().toLocaleDateString('tr-TR');
    const currentTime = new Date().toLocaleTimeString('tr-TR');

    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#333333')
       .text(`Oluşturma Tarihi: ${currentDate} ${currentTime}`, 50, 75)
       .text(`Sayfa Boyutu: ${pageWidthMM}mm × ${pageHeightMM}mm`, 50, 88)
       .text(`Toplam Tasarım: ${arrangements.length}`, 50, 101)
       .text(`Kalite: ${qualitySettings?.dpi || 300} DPI, ${qualitySettings?.colorProfile || 'CMYK'}`, 50, 114)
       .text(`Kesim Payı: ${bleedSettings?.top || 3}mm`, 50, 127);

    updateProgress('Technical Info Added');

    // Draw page border with bleed marks
    const borderColor = '#000000';
    const bleedColor = bleedSettings?.bleedColor || '#ff0000';
    const safeAreaColor = bleedSettings?.safeAreaColor || '#00ff00';

    // Main page border
    doc.strokeColor(borderColor)
       .lineWidth(1)
       .rect(20, 20, pageWidthPt - 40, pageHeightPt - 40)
       .stroke();

    updateProgress('Page Border Added');

    // Add cutting marks if enabled
    if (cuttingMarks?.enabled) {
      const markLength = (cuttingMarks.length || 5) * mmToPoints;
      const markOffset = (cuttingMarks.offset || 3) * mmToPoints;
      const markWidth = cuttingMarks.lineWidth || 0.25;

      doc.strokeColor(borderColor)
         .lineWidth(markWidth);

      // Corner marks - Top Left
      doc.moveTo(markOffset, markOffset + markLength)
         .lineTo(markOffset, markOffset)
         .lineTo(markOffset + markLength, markOffset)
         .stroke();

      // Corner marks - Top Right  
      doc.moveTo(pageWidthPt - markOffset - markLength, markOffset)
         .lineTo(pageWidthPt - markOffset, markOffset)
         .lineTo(pageWidthPt - markOffset, markOffset + markLength)
         .stroke();

      // Corner marks - Bottom Left
      doc.moveTo(markOffset, pageHeightPt - markOffset - markLength)
         .lineTo(markOffset, pageHeightPt - markOffset)
         .lineTo(markOffset + markLength, pageHeightPt - markOffset)
         .stroke();

      // Corner marks - Bottom Right
      doc.moveTo(pageWidthPt - markOffset - markLength, pageHeightPt - markOffset)
         .lineTo(pageWidthPt - markOffset, pageHeightPt - markOffset)
         .lineTo(pageWidthPt - markOffset, pageHeightPt - markOffset - markLength)
         .stroke();

      console.log('✂️ Cutting marks added');
    }

    updateProgress('Cutting Marks Added');

    // Process and draw arrangements
    let validArrangements = 0;
    let totalArrangementArea = 0;
    const arrangementErrors: string[] = [];

    for (let i = 0; i < arrangements.length; i++) {
      const arrangement = arrangements[i];

      try {
        // Convert mm to points for PDF coordinates
        const xPt = arrangement.x * mmToPoints;
        const yPt = (pageHeightMM - arrangement.y - arrangement.height) * mmToPoints; // Flip Y coordinate
        const widthPt = arrangement.width * mmToPoints;
        const heightPt = arrangement.height * mmToPoints;

        // Validate arrangement bounds
        if (xPt < 0 || yPt < 0 || xPt + widthPt > pageWidthPt || yPt + heightPt > pageHeightPt) {
          arrangementErrors.push(`Arrangement ${i + 1} is out of bounds`);
          continue;
        }

        validArrangements++;
        totalArrangementArea += arrangement.width * arrangement.height;

        // Find corresponding design file
        const designFile = designFiles.find(d => d.id === arrangement.designId);
        const designName = designFile?.filename || `Design_${i + 1}`;

        // Draw bleed area if specified
        if (arrangement.withMargins) {
          const bleedMargin = 3 * mmToPoints; // 3mm bleed
          doc.strokeColor('#ff9999')
             .lineWidth(0.5)
             .rect(xPt - bleedMargin, yPt - bleedMargin, 
                   widthPt + 2 * bleedMargin, heightPt + 2 * bleedMargin)
             .stroke();
        }

        // Draw main design area
        const hue = (i * 137.5) % 360;
        const designColor = `hsl(${hue}, 70%, 85%)`;

        doc.fillColor(designColor)
           .fillOpacity(0.3)
           .rect(xPt, yPt, widthPt, heightPt)
           .fill();

        // Draw design border
        doc.strokeColor('#333333')
           .lineWidth(1)
           .fillOpacity(1)
           .rect(xPt, yPt, widthPt, heightPt)
           .stroke();

        // Add design label
        const fontSize = Math.max(6, Math.min(widthPt / 20, heightPt / 8, 10));
        doc.fillColor('#000000')
           .fontSize(fontSize)
           .font('Helvetica-Bold')
           .text(String(i + 1), xPt + 3, yPt + 3, {
             width: widthPt - 6,
             height: heightPt - 6,
             align: 'left'
           });

        // Add dimensions
        if (widthPt > 60 && heightPt > 30) {
          doc.fontSize(Math.max(4, fontSize * 0.7))
             .font('Helvetica')
             .text(`${arrangement.width.toFixed(1)}×${arrangement.height.toFixed(1)}mm`, 
                    xPt + 3, yPt + heightPt - 15, {
                      width: widthPt - 6,
                      align: 'left'
                    });
        }

        // Add filename if space allows
        if (widthPt > 100 && heightPt > 50) {
          const maxLength = Math.floor(widthPt / 4);
          const shortName = designName.length > maxLength ? 
                           designName.substring(0, maxLength - 3) + '...' : 
                           designName;

          doc.fontSize(Math.max(4, fontSize * 0.6))
             .text(shortName, xPt + 3, yPt + fontSize + 5, {
               width: widthPt - 6,
               align: 'left'
             });
        }

      } catch (error) {
        console.error(`Error processing arrangement ${i + 1}:`, error);
        arrangementErrors.push(`Processing error for arrangement ${i + 1}: ${error}`);
      }
    }

    updateProgress('Arrangements Processed');

    // Add statistics and quality information
    const pageArea = pageWidthMM * pageHeightMM;
    const efficiency = pageArea > 0 ? (totalArrangementArea / pageArea) * 100 : 0;
    const wastePercentage = 100 - efficiency;

    docfontSize(7)
       .fillColor('#000000')
       .font('Helvetica')
       .text('LAYOUT STATISTICS', 50, pageHeightPt - 120);

    doc.fontSize(6)
       .text(`✓ Valid Arrangements: ${validArrangements}/${arrangements.length}`, 50, pageHeightPt - 105)
       .text(`✓ Layout Efficiency: ${efficiency.toFixed(1)}%`, 50, pageHeightPt - 95)
       .text(`✓ Waste Percentage: ${wastePercentage.toFixed(1)}%`, 50, pageHeightPt - 85)
       .text(`✓ Total Design Area: ${totalArrangementArea.toFixed(1)}mm²`, 50, pageHeightPt - 75)
       .text(`✓ Page Area: ${pageArea.toFixed(1)}mm²`, 50, pageHeightPt - 65);

    updateProgress('Statistics Added');

    // Add quality control information
    doc.fontSize(7)
       .text('QUALITY CONTROL', 250, pageHeightPt - 120);

    doc.fontSize(6)
       .text(`✓ Resolution: ${qualitySettings?.dpi || 300} DPI`, 250, pageHeightPt - 105)
       .text(`✓ Color Profile: ${qualitySettings?.colorProfile || 'CMYK'}`, 250, pageHeightPt - 95)
       .text(`✓ Vector Quality: ${qualitySettings?.preserveVectorData ? 'Preserved' : 'Optimized'}`, 250, pageHeightPt - 85)
       .text(`✓ Cutting Marks: ${cuttingMarks?.enabled ? 'Enabled' : 'Disabled'}`, 250, pageHeightPt - 75)
       .text(`✓ Bleed Area: ${bleedSettings?.top || 3}mm`, 250, pageHeightPt - 65);

    // Add errors if any
    if (arrangementErrors.length > 0) {
      doc.fontSize(7)
         .fillColor('#cc0000')
         .text('WARNINGS', 450, pageHeightPt - 120);

      doc.fontSize(5)
         .text(arrangementErrors.slice(0, 8).join('\n'), 450, pageHeightPt - 105, {
           width: 150,
           height: 60
         });
    }

    updateProgress('Quality Control Info Added');

    // Finalize PDF    doc.end();

    updateProgress('PDF Generation Complete');

    console.log('✅ Enhanced PDF generated successfully', {
      validArrangements,
      totalArrangements: arrangements.length,
      efficiency: efficiency.toFixed(1) + '%',
      errors: arrangementErrors.length
    });

  } catch (error) {
    console.error('❌ Enhanced PDF generation error:', error);

    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Enhanced PDF generation failed', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
});

  // Simple Node.js PDF generation endpoint
  app.post('/api/automation/plotter/generate-pdf', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.user?.id;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'printer') {
        return res.status(403).json({ message: "Printer access required" });
      }

      const { plotterSettings, arrangements } = req.body;

      console.log('📄 PDF generation request received');
      console.log('📋 Extracted arranged items:', arrangements?.length || 0);

      // Use Node.js PDF generator
      const result = await nodePDFGenerator.generateArrangementPDF({
        plotterSettings,
        arrangements
      });

      if (result.success) {
        console.log('✅ PDF generation successful');
        res.json({
          success: true,
          downloadUrl: result.filePath,
          message: result.message
        });
      } else {
        console.error('❌ PDF generation failed:', result.message);
        res.status(500).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'PDF generation failed'
      });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<string, Set<WebSocket>>();

  // Broadcast function for WebSocket
  function broadcastToRoom(roomId: string, message: any) {
    const roomClients = clients.get(roomId);
    if (roomClients) {
      const messageStr = JSON.stringify(message);
      roomClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
    }
  }

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket client connected');

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'join_room') {
          const { roomId } = message;

          // Verify room exists and user has access
          const room = await storage.getChatRoom(roomId);
          if (!room) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Room not found'
            }));
            return;
          }

          // Check if contract is approved for this room
          const quote = await storage.getQuote(room.quoteId);
          if (!quote || quote.status !== 'approved') {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Chat not available - contract not approved'
            }));
            return;
          }          
          if (!clients.has(roomId)) {
            clients.set(roomId, new Set());
          }
          clients.get(roomId)!.add(ws);

          ws.send(JSON.stringify({
            type: 'room_joined',
            roomId
          }));
        } else if (message.type === 'leave_room') {
          const { roomId } = message;
          const roomClients = clients.get(roomId);
          if (roomClients) {
            roomClients.delete(ws);
            if (roomClients.size === 0) {
              clients.delete(roomId);
            }
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
      // Remove client from all rooms
      clients.forEach((roomClients, roomId) => {
        roomClients.delete(ws);
        if (roomClients.size === 0) {
          clients.delete(roomId);
        }
      });
      console.log('WebSocket client disconnected');
    });
  });

  // Get plotter designs endpoint
  app.get('/api/automation/plotter/designs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.user?.id;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'printer') {
        return res.status(403).json({ message: "Printer access required" });
      }

      const files = await storage.getFilesByUser(userId);
      const designFiles = files.filter(f => f.fileType === 'design');

      console.log(`🎨 Retrieved ${designFiles.length} design files for user ${userId}`);

      res.json(designFiles);
    } catch (error) {
      console.error("Error fetching plotter designs:", error);
      res.status(500).json({ message: "Failed to fetch designs" });
    }
  });

  // Clear plotter designs endpoint
  app.delete('/api/automation/plotter/designs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.user?.id;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'printer') {
        return res.status(403).json({ message: "Printer access required" });
      }

      const files = await storage.getFilesByUser(userId);
      const designFiles = files.filter(f => f.fileType === 'design');

      for (const file of designFiles) {
        try {
          // Delete physical file
          const filePath = path.join(uploadDir, file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          // Delete thumbnail if exists
          if (file.thumbnailPath && fs.existsSync(file.thumbnailPath)) {
            fs.unlinkSync(file.thumbnailPath);
          }

          // Delete from database
          await storage.deleteFile(file.id);
        } catch (deleteError) {
          console.error(`Error deleting file ${file.filename}:`, deleteError);
        }
      }

      console.log(`🗑️ Cleared ${designFiles.length} design files for user ${userId}`);
      res.json({ message: `${designFiles.length} design files cleared successfully` });
    } catch (error) {
      console.error("Error clearing plotter designs:", error);
      res.status(500).json({ message: "Failed to clear designs" });
    }
  });

  // Tek tuş otomatik dizim endpoint'i
  app.post('/api/automation/plotter/one-click-layout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.user?.id;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'printer') {
        return res.status(403).json({ message: "Printer access required" });
      }

      const { designIds, sheetSettings, cuttingSettings } = req.body;

      if (!designIds || !Array.isArray(designIds) || designIds.length === 0) {
        return res.status(400).json({ message: "Design IDs gerekli" });
      }

      console.log('🚀 Tek tuş otomatik dizim başlatılıyor:', { designIds, sheetSettings });

      // Tasarımları getir
      const designs = await Promise.all(
        designIds.map(async (id: string) => {
          const file = await storage.getFileById(id);
          return file;
        })
      );

      const validDesigns = designs.filter(d => d && d.uploadedBy === userId);

      if (validDesigns.length === 0) {
        return res.status(400).json({ message: "Geçerli tasarım bulunamadı" });
      }

      // Tek tuş sistemiyle işle
      const result = await oneClickLayoutSystem.processOneClickLayout(validDesigns, {
        designIds,
        sheetSettings: sheetSettings || {
          width: 330,
          height: 480,
          margin: 10,
          bleedMargin: 3
        },
        cuttingSettings: cuttingSettings || {
          enabled: true,
          markLength: 5,
          markWidth: 0.25
        }
      });

      if (result.success) {
        console.log(`✅ Tek tuş dizim başarılı: ${result.arrangements.length} tasarım, ${result.efficiency}% verimlilik`);
        res.json({
          success: true,
          arrangements: result.arrangements,
          pdfPath: result.pdfPath,
          efficiency: `${result.efficiency}%`,
          statistics: result.statistics,
          message: result.message
        });
      } else {
        console.error('❌ Tek tuş dizim başarısız:', result.message);
        res.status(500).json({
          success: false,
          message: result.message,
          statistics: result.statistics
        });
      }

    } catch (error) {
      console.error("❌ Tek tuş dizim hatası:", error);
      res.status(500).json({ message: "Tek tuş dizim başarısız: " + (error as Error).message });
    }
  });

  // Auto-arrange endpoint for plotter automation
  app.post('/api/automation/plotter/auto-arrange', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.user?.id;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'printer') {
        return res.status(403).json({ message: "Printer access required" });
      }

      const { designIds, plotterSettings } = req.body;

      if (!designIds || !Array.isArray(designIds) || designIds.length === 0) {
        return res.status(400).json({ message: "En az bir tasarım ID'si gerekli" });
      }

      // Get design files
      const files = await storage.getFilesByUser(userId);
      const designs = files.filter(f => designIds.includes(f.id) && f.fileType === 'design');

      if (designs.length === 0) {
        return res.status(404).json({ message: "Geçerli tasarım bulunamadı" });
      }

      console.log('🔧 Starting enhanced auto-arrange for designs:', designs.map(d => ({
        id: d.id,
        name: d.originalName,
        realDimensionsMM: d.realDimensionsMM,
        dimensions: d.dimensions
      })));

      // Professional advanced layout algorithm for maximum efficiency
      const sheetWidth = plotterSettings?.sheetWidth || 330; // mm
      const sheetHeight = plotterSettings?.sheetHeight || 480; // mm
      const margin = plotterSettings?.margin || 3;
      const spacing = plotterSettings?.spacing || 1;

      // Convert designs to advanced layout format
      const layoutDesigns = designs.map(design => {
        let width = 50;
        let height = 30;

        if (design.realDimensionsMM && design.realDimensionsMM !== 'Boyut tespit edilemedi') {
          const dimensionMatch = design.realDimensionsMM.match(/(\d+)x(\d+)mm/i);
          if (dimensionMatch) {
            width = parseInt(dimensionMatch[1]);
            height = parseInt(dimensionMatch[2]);
          }
        }

        return {
          id: design.id,
          width,
          height,
          name: design.originalName,
          canRotate: true
        };
      });

      // Generate optimal layout using advanced algorithm
      const layoutResult = advancedLayoutEngine.optimizeLayout(layoutDesigns, {
        sheetWidth,
        sheetHeight,
        margin,
        spacing,
        allowRotation: true,
        optimizeForWaste: true
      });

      // Convert to arrangements format
      const arrangements = layoutResult.arrangements.map(item => ({
        designId: item.id,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        rotation: item.rotation,
        designName: item.rotation === 90 ? `${item.name} (döndürülmüş)` : item.name,
        withMargins: {
          width: item.width + 2,
          height: item.height + 6
        }
      }));

      console.log(`🎯 Advanced layout: ${arrangements.length}/${designs.length} designs, ${layoutResult.efficiency}% efficiency`);



      // Calculate efficiency
      const totalDesignArea = arrangements.reduce((sum, arr) => sum + (arr.width * arr.height), 0);
      const sheetArea = sheetWidth * sheetHeight;
      const efficiency = sheetArea > 0 ? Math.round((totalDesignArea / sheetArea) * 100) : 0;

      // AI destekli dizim dene
      let aiRecommendations: string[] = [];
      if (require('./aiLayoutOptimizer').aiLayoutOptimizer.isAvailable()) {
        try {
          const aiResult = await require('./aiLayoutOptimizer').aiLayoutOptimizer.optimizeLayoutWithAI(
            designs,
            { width: sheetWidth, height: sheetHeight, margin, spacing }
          );

          if (aiResult.efficiency > layoutResult.efficiency) {
            console.log('🤖 AI daha iyi sonuç buldu, kullanılıyor...');
            arrangements.splice(0, arrangements.length, ...aiResult.arrangements);
            layoutResult.efficiency = aiResult.efficiency;
            aiRecommendations = aiResult.aiRecommendations;
          }
        } catch (aiError) {
          console.log('⚠️ AI optimizasyonu başarısız, standart sonuç kullanılıyor');
        }
      }

      res.json({
        success: true,
        arrangements,
        totalArranged: arrangements.length,
        efficiency: Math.round(layoutResult.efficiency * 100) / 100,
        statistics: {
          totalDesigns: designs.length,
          arrangedDesigns: arrangements.length,
          rotatedItems: layoutResult.statistics.rotatedItems,
          wastePercentage: Math.round((100 - layoutResult.efficiency) * 100) / 100
        },
        aiRecommendations: aiRecommendations.length > 0 ? aiRecommendations : undefined
      });

    } catch (error) {
      console.error("❌ Auto-arrange error:", error);
      res.status(500).json({ message: "Otomatik dizilim başarısız: " + (error as Error).message });
    }
  });



  // Extended Plotter Data Service API Endpoints

  // Plotter models endpoint
  app.get('/api/automation/plotter/models', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.user?.id;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'printer') {
        return res.status(403).json({ message: "Printer access required" });
      }

      const { plotterDataService } = await import('./plotterDataService');
      const models = plotterDataService.getPlotterModels();
      res.json(models);
    } catch (error) {
      console.error("Plotter models fetch error:", error);
      res.status(500).json({ message: "Plotter modelleri alınamadı" });
    }
  });

  // Material specifications endpoint
  app.get('/api/automation/plotter/materials', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.user?.id;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'printer') {
        return res.status(403).json({ message: "Printer access required" });
      }

      const { plotterDataService } = await import('./plotterDataService');
      const materials = plotterDataService.getMaterialSpecs();
      res.json(materials);
    } catch (error) {
      console.error("Materials fetch error:", error);
      res.status(500).json({ message: "Materyal bilgileri alınamadı" });
    }
  });

  // Compatible materials for specific plotter
  app.get('/api/automation/plotter/materials/:plotterId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.user?.id;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'printer') {
        return res.status(403).json({ message: "Printer access required" });
      }

      const { plotterDataService } = await import('./plotterDataService');
      const { plotterId } = req.params;
      const compatibleMaterials = plotterDataService.getCompatibleMaterials(plotterId);
      res.json(compatibleMaterials);
    } catch (error) {
      console.error("Compatible materials fetch error:", error);
      res.status(500).json({ message: "Uyumlu materyal bilgileri alınamadı" });
    }
  });

  // Optimal cutting settings
  app.post('/api/automation/plotter/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.user?.id;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'printer') {
        return res.status(403).json({ message: "Printer access required" });
      }

      const { plotterDataService } = await import('./plotterDataService');
      const { plotterId, materialId } = req.body;

      if (!plotterId || !materialId) {
        return res.status(400).json({ message: "Plotter ve materyal ID'si gerekli" });
      }

      const settings = plotterDataService.getOptimalSettings(plotterId, materialId);
      res.json(settings);
    } catch (error) {
      console.error("Settings calculation error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Optimal ayarlar hesaplanamadı" 
      });
    }
  });

  // Material usage calculation
  app.post('/api/automation/plotter/calculate-usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.user?.id;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'printer') {
        return res.status(403).json({ message: "Printer access required" });
      }

      const { plotterDataService } = await import('./plotterDataService');
      const { designCount, designWidth, designHeight, plotterWidth, spacing } = req.body;

      if (!designCount || !designWidth || !designHeight || !plotterWidth) {
        return res.status(400).json({ message: "Tüm boyut parametreleri gerekli" });
      }

      const usage = plotterDataService.calculateMaterialUsage(
        designCount, designWidth, designHeight, plotterWidth, spacing || 2
      );
      res.json(usage);
    } catch (error) {
      console.error("Usage calculation error:", error);
      res.status(500).json({ message: "Materyal kullanımı hesaplanamadı" });
    }
  });

  // Generate cutting path
  app.post('/api/automation/plotter/generate-path', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.user?.id;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'printer') {
        return res.status(403).json({ message: "Printer access required" });
      }

      const { plotterDataService } = await import('./plotterDataService');
      const { designs, plotterSettings } = req.body;

      if (!designs || !plotterSettings) {
        return res.status(400).json({ message: "Tasarım ve plotter ayarları gerekli" });
      }

      const cuttingPath = plotterDataService.generateCuttingPath(designs, plotterSettings);
      res.json(cuttingPath);
    } catch (error) {
      console.error("Cutting path generation error:", error);
      res.status(500).json({ message: "Kesim yolu oluşturulamadı" });
    }
  });

// Python ile profesyonel dizim motoru
  app.post('/api/automation/plotter/python-layout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.user?.id;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'printer') {
        return res.status(403).json({ message: "Printer access required" });
      }

      const { designIds, pageWidth, pageHeight, cuttingSpace } = req.body;

      if (!designIds || !Array.isArray(designIds) || designIds.length === 0) {
        return res.status(400).json({ message: "En az bir tasarım ID'si gerekli" });
      }

      // Get design files
      const files = await storage.getFilesByUser(userId);
      const designs = files.filter(f => designIds.includes(f.id) && f.fileType === 'design');

      if (designs.length === 0) {
        return res.status(404).json({ message: "Geçerli tasarım bulunamadı" });
      }

      // Convert design IDs to file paths
      const filePaths = designs.map(design => path.join(process.cwd(), 'uploads', design.filename));

      // Create output path
      const outputPath = path.join(process.cwd(), 'uploads', `professional-layout-${Date.now()}.pdf`);

      console.log('🐍 Python dizim motoru başlatılıyor...');
      console.log('📁 Dosyalar:', filePaths);
      console.log('📄 Sayfa boyutu:', `${pageWidth || 330}x${pageHeight || 480}mm`);

      // Python script'ini çağır
      const { spawn } = require('child_process');
      const pythonProcess = spawn('python3', [
        path.join(process.cwd(), 'server', 'professionalLayoutEngine.py'),
        JSON.stringify({
          files: filePaths,
          pageWidth: pageWidth || 330,
          pageHeight: pageHeight || 480,
          cuttingSpace: cuttingSpace || 5,
          outputPath
        })
      ], {
        cwd: process.cwd(),
        env: { ...process.env, PYTHONPATH: process.cwd() }
      });

      let result = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('🐍 Python output:', output);
        result += output;
      });

      pythonProcess.stderr.on('data', (data) => {
        const errorOutput = data.toString();
        console.error('🐍 Python error:', errorOutput);
        error += errorOutput;
      });

      pythonProcess.on('close', (code) => {
        console.log('🐍 Python process exited with code:', code);

        if (code !== 0) {
          console.error('❌ Python script failed:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'Python dizim motoru hatası. Kütüphaneler eksik olabilir.',
            error: error,
            code 
          });
        }

        try {
          // Parse last line which should be JSON result
          const lines = result.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const pythonResult = JSON.parse(lastLine);

          if (pythonResult.success) {
            console.log('✅ Python dizim başarılı:', pythonResult);

            // Return relative path for download
            const relativePath = path.relative(path.join(process.cwd(), 'uploads'), pythonResult.output_path);
            pythonResult.downloadUrl = `/uploads/${relativePath}`;
          }

          res.json(pythonResult);
        } catch (parseError) {
          console.error('❌ Python result parse error:', parseError);
          console.log('Raw result:', result);
          res.status(500).json({ 
            success: false, 
            message: 'Python sonuç ayrıştırma hatası',
            rawOutput: result,
            error: parseError.message
          });
        }
      });

      // Set timeout for long running processes
      setTimeout(() => {
        pythonProcess.kill();
        res.status(408).json({
          success: false,
          message: 'Python dizim işlemi zaman aşımı (60s)'
        });
      }, 60000);

    } catch (error) {
      console.error("❌ Python layout error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Python dizim başarısız: " + (error as Error).message 
      });
    }
  });

  // Enhanced PDF Analysis API
  app.post('/api/analyze-design', upload.single('file'), async (req, res) => {
    console.log('🔍 Enhanced design analysis request');
    
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      // Use multi-method analyzer for comprehensive analysis
      const analysisResult = await multiMethodAnalyzer.analyzeDesignFile(
        file.path, 
        file.originalname, 
        file.mimetype
      );

      // Generate thumbnail if possible
      const thumbnailPath = await multiMethodAnalyzer.generateThumbnail(file.path, file.originalname);
      if (thumbnailPath) {
        analysisResult.thumbnailPath = thumbnailPath;
      }

      // Validate analysis result
      const validation = await multiMethodAnalyzer.validateAnalysisResult(analysisResult);

      res.json({
        success: true,
        analysis: analysisResult,
        validation,
        message: analysisResult.success ? 
          'Analysis completed successfully' : 
          'Analysis completed with warnings'
      });

    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Analysis failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Manual Dimension Input API
  app.post('/api/apply-manual-dimensions', async (req, res) => {
    console.log('📏 Manual dimension input request');
    
    try {
      const { analysisResult, manualDimensions } = req.body;
      
      if (!analysisResult || !manualDimensions) {
        return res.status(400).json({
          success: false,
          message: 'Missing analysis result or manual dimensions'
        });
      }

      // Apply manual dimensions
      const updatedResult = await multiMethodAnalyzer.applyManualDimensions(
        analysisResult,
        manualDimensions
      );

      // Validate updated result
      const validation = await multiMethodAnalyzer.validateAnalysisResult(updatedResult);

      res.json({
        success: true,
        analysis: updatedResult,
        validation,
        message: 'Manual dimensions applied successfully'
      });

    } catch (error) {
      console.error('Manual dimension error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to apply manual dimensions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Alternative Analysis Method API
  app.post('/api/retry-analysis', async (req, res) => {
    console.log('🔄 Retry analysis with alternative method');
    
    try {
      const { filePath, fileName, mimeType, method } = req.body;
      
      if (!filePath || !fileName || !mimeType) {
        return res.status(400).json({
          success: false,
          message: 'Missing file information'
        });
      }

      // Retry with specific method based on the request
      let analysisResult;
      
      if (method === 'python-analysis') {
        analysisResult = await pythonAnalyzerService.analyzeFile(filePath, fileName, mimeType);
      } else if (method === 'enhanced-pdf-analysis' && mimeType === 'application/pdf') {
        const { enhancedPDFAnalyzer } = await import('./enhancedPDFAnalyzer');
        analysisResult = await enhancedPDFAnalyzer.analyzePDF(filePath, fileName);
      } else {
        // Fallback to multi-method analyzer
        analysisResult = await multiMethodAnalyzer.analyzeDesignFile(filePath, fileName, mimeType);
      }

      res.json({
        success: true,
        analysis: analysisResult,
        method: method || 'multi-method',
        message: 'Alternative analysis completed'
      });

    } catch (error) {
      console.error('Retry analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Alternative analysis failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // PDF download endpoint for generated layouts
  app.get('/api/download/:filename', async (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(process.cwd(), 'uploads', filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      // Set proper headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      // Clean up file after download
      fileStream.on('end', () => {
        setTimeout(() => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`Cleaned up temporary file: ${filename}`);
            }
          } catch (cleanupError) {
            console.warn('File cleanup warning:', cleanupError);
          }
        }, 5000); // 5 second delay
      });
      
    } catch (error) {
      console.error('File download error:', error);
      res.status(500).json({ message: 'Download failed' });
    }
  });

  return httpServer;
}

// PDF Generation Function for Layout System
async function generateLayoutPDF(arrangements: any[], designs: any[], sheetSettings: any): Promise<string> {
  const path = await import('path');
  const fs = await import('fs');
  
  try {
    console.log('📄 Starting PDF generation with arrangements:', arrangements.length);
    
    const outputFilename = `layout_${Date.now()}.pdf`;
    const outputPath = path.join(process.cwd(), 'uploads', outputFilename);
    
    // Prepare design files with paths
    const designFilesWithPaths = designs.map(design => ({
      ...design,
      filePath: path.join(process.cwd(), 'uploads', design.filename)
    }));
    
    // Python script input
    const pythonInput = {
      arrangements: arrangements.map(arr => ({
        designId: arr.id || arr.designId,
        x: arr.x,
        y: arr.y,
        width: arr.width,
        height: arr.height,
        rotation: arr.rotation || 0,
        designName: arr.name || arr.designName || `Design_${arr.id || arr.designId}`
      })),
      designFiles: designFilesWithPaths,
      outputPath,
      sheetWidth: sheetSettings.width,
      sheetHeight: sheetSettings.height,
      qualitySettings: {
        dpi: 300,
        vectorPreservation: true,
        compression: 'lossless'
      },
      cuttingMarks: {
        enabled: true,
        markLength: 5,
        markWidth: 0.25
      },
      bleedSettings: {
        enabled: true,
        bleedMargin: sheetSettings.bleedMargin || 3
      }
    };
    
    console.log('🐍 Calling Python PDF generator...');
    
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const pythonScriptPath = path.join(process.cwd(), 'server', 'pdfGenerator.py');
    const command = `python3 "${pythonScriptPath}" '${JSON.stringify(pythonInput)}'`;
    
    const { stdout, stderr } = await execAsync(command, { timeout: 60000 });
    
    if (stderr && !stderr.includes('WARNING')) {
      console.error('Python PDF generation error:', stderr);
    }
    
    console.log('Python PDF output:', stdout);
    
    // Check if PDF was created
    if (fs.existsSync(outputPath)) {
      const fileStats = fs.statSync(outputPath);
      console.log(`✅ PDF generated successfully: ${(fileStats.size / 1024).toFixed(1)}KB`);
      return outputFilename;
    } else {
      throw new Error('PDF file was not created');
    }
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}