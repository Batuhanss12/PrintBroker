import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Extend session types
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      role: string;
      firstName?: string | null;
      lastName?: string | null;
      profileImageUrl?: string | null;
    };
  }
}

// Simple fallback auth for development
export async function setupAuth(app: Express) {
  // Configure session
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    tableName: "sessions",
  });

  app.use(session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  console.log('Authentication system initialized with session storage');

  // Login route with role selection
  app.get("/api/login", (req, res) => {
    // Demo user creation for different roles
    const roleParam = req.query.role as string;
    const role = roleParam || 'customer'; // Default to customer
    
    // Create demo user based on role
    const demoUsers = {
      customer: {
        id: `customer_${Date.now()}`,
        email: 'demo.customer@matbixx.com',
        role: 'customer',
        firstName: 'Demo',
        lastName: 'Müşteri'
      },
      printer: {
        id: `printer_${Date.now()}`,
        email: 'demo.printer@matbixx.com', 
        role: 'printer',
        firstName: 'Demo',
        lastName: 'Firma'
      },
      admin: {
        id: `admin_${Date.now()}`,
        email: 'demo.admin@matbixx.com',
        role: 'admin', 
        firstName: 'Demo',
        lastName: 'Admin'
      }
    };

    const user = demoUsers[role as keyof typeof demoUsers] || demoUsers.customer;
    
    // Set session
    req.session.user = user;
    
    // Redirect based on role
    const redirectUrls = {
      customer: '/customer-dashboard',
      printer: '/printer-dashboard', 
      admin: '/admin-dashboard'
    };
    
    res.redirect(redirectUrls[role as keyof typeof redirectUrls] || '/customer-dashboard');
  });

  // Logout route
  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error('Session destroy error:', destroyErr);
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
      });
    });
  });
}

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  
  return res.status(401).json({ message: "Unauthorized" });
};