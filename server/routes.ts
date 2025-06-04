import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertQuoteSchema, insertPrinterQuoteSchema, insertRatingSchema, insertChatRoomSchema, insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";
import { ideogramService } from "./ideogramApi";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types for printing
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/postscript',
      'image/svg+xml',
      'application/zip',
      'application/x-rar-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, AI, SVG, ZIP, and RAR files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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

      const userId = req.user.claims.sub;
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
      const userId = req.user?.id || req.user?.claims?.sub;
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
      const userId = req.user?.id || req.user?.claims?.sub;
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
  app.get('/api/chat/rooms', isAuthenticated, async (req: any, res) => {
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

  return httpServer;
}
