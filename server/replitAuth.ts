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

// Enhanced authentication for development and production
export async function setupAuth(app: Express) {
  // Configure session with proper settings
  const sessionSecret = process.env.SESSION_SECRET || 'matbixx-development-secret-key-2024';

  let sessionStore;

  // Try to use PostgreSQL session store if available, fallback to memory store
  try {
    if (process.env.DATABASE_URL) {
      const pgStore = connectPg(session);
      sessionStore = new pgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
        tableName: "sessions",
      });
      console.log('✅ PostgreSQL session store initialized');
    } else {
      console.log('⚠️ Using memory session store (development only)');
    }
  } catch (error) {
    console.warn('Session store warning:', error);
  }

  app.use(session({
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
    name: 'matbixx.sid'
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Passport serialization
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  console.log('✅ Authentication system initialized with enhanced session management');
}

export const isAuthenticated = (req: any, res: any, next: any) => {
  // Enhanced session validation
  if (req.session && req.session.user && req.session.user.id) {
    // Session-based authentication
    req.user = {
      id: req.session.user.id,
      email: req.session.user.email,
      role: req.session.user.role,
      firstName: req.session.user.firstName,
      lastName: req.session.user.lastName,
      claims: {
        sub: req.session.user.id // Add claims.sub for compatibility
      }
    };

    console.log("Session auth successful for user:", req.session.user.id);
    return next();
  }

  // Use Passport authentication as fallback
  passport.authenticate('session', { session: false }, (err: any, user: any) => {
    if (err) {
      console.error('Authentication error:', err);
      return res.status(500).json({ message: 'Authentication error' });
    }

    if (!user) {
      console.log("Authentication failed - no user found");
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log("Passport auth successful for user:", user.id || user.claims?.sub);
    req.user = user;
    next();
  })(req, res, next);
};

// Role-based access control middleware
export const requireRole = (allowedRoles: string[]): RequestHandler => {
  return (req: any, res, next) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.session.user.role)) {
      return res.status(403).json({ 
        message: "Insufficient permissions",
        required: allowedRoles,
        current: req.session.user.role
      });
    }

    next();
  };
};

// Session health check
export const checkSession: RequestHandler = (req: any, res, next) => {
  if (req.session) {
    req.session.touch(); // Update session expiry
  }
  next();
};