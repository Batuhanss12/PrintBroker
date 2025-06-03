import passport from "passport";
import type { Express } from "express";
import session from "express-session";

// Extend session types
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      role: string;
      claims: {
        sub: string;
        email: string;
        role: string;
      };
    };
  }
}

export async function setupAuth(app: Express) {
  // Configure session first
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key-12345',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Always use fallback auth in development
  if (!process.env.REPLIT_CLIENT_ID || !process.env.REPLIT_CLIENT_SECRET) {
    console.log('Missing Replit auth credentials, using fallback authentication');
    setupFallbackAuth(app);
    return;
  }

  try {
    const { Issuer } = await import("openid-client");

    // Get the current host
    const host = process.env.REPL_SLUG ? 
      `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER || 'replit'}.repl.co` : 
      'http://localhost:5000';

    // Try to discover OIDC issuer with better error handling
    let issuer;
    try {
      issuer = await Issuer.discover('https://replit.com/.well-known/openid_configuration');
    } catch (discoverError) {
      console.log('OIDC discovery failed, using fallback auth');
      setupFallbackAuth(app);
      return;
    }

    const client = new issuer.Client({
      client_id: process.env.REPLIT_CLIENT_ID || 'default-client-id',
      client_secret: process.env.REPLIT_CLIENT_SECRET || 'default-client-secret',
      redirect_uris: [`${host}/api/auth/callback`],
      response_types: ['code'],
    });

    // Use passport-openidconnect strategy instead
    const { Strategy: OpenIDConnectStrategy } = await import('passport-openidconnect');
    
    passport.use('oidc', new OpenIDConnectStrategy({
      issuer: 'https://replit.com',
      authorizationURL: 'https://replit.com/auth/oauth2/authorize',
      tokenURL: 'https://replit.com/auth/oauth2/token',
      userInfoURL: 'https://replit.com/auth/oauth2/userinfo',
      clientID: process.env.REPLIT_CLIENT_ID || 'default-client-id',
      clientSecret: process.env.REPLIT_CLIENT_SECRET || 'default-client-secret',
      callbackURL: `${host}/api/auth/callback`,
      scope: ['openid', 'profile', 'email']
    }, (tokenSet: any, userinfo: any, done: any) => {
      try {
        return done(null, { ...userinfo, claims: userinfo });
      } catch (error) {
        console.error('OIDC strategy error:', error);
        return done(error, null);
      }
    }));

    passport.serializeUser((user: any, done) => {
      try {
        // Store only essential user data in session
        const sessionData = {
          id: user.claims?.sub || user.id,
          email: user.claims?.email || user.email,
          name: user.claims?.name || user.name,
          claims: user.claims || user
        };
        done(null, sessionData);
      } catch (error) {
        console.error('Serialize user error:', error);
        done(error, null);
      }
    });

    passport.deserializeUser((sessionData: any, done) => {
      try {
        done(null, sessionData);
      } catch (error) {
        console.error('Deserialize user error:', error);
        done(error, null);
      }
    });

    // Auth routes with better error handling
    app.get('/api/login', (req, res, next) => {
      try {
        const returnTo = req.query.returnTo as string;
        if (returnTo) {
          req.session.returnTo = returnTo;
        }

        passport.authenticate('oidc', {
          scope: 'openid profile email'
        })(req, res, next);
      } catch (error) {
        console.error('Login route error:', error);
        res.redirect('/login-error');
      }
    });

    app.get('/api/auth/callback', (req, res, next) => {
      passport.authenticate('oidc', { 
        failureRedirect: '/login-failed' 
      }, (err, user) => {
        if (err) {
          console.error('Auth callback error:', err);
          return res.redirect('/login-error');
        }

        if (!user) {
          return res.redirect('/login-failed');
        }

        req.logIn(user, (loginErr) => {
          if (loginErr) {
            console.error('Login error:', loginErr);
            return res.redirect('/login-error');
          }

          const returnTo = req.session?.returnTo || '/dashboard';
          delete req.session?.returnTo;
          res.redirect(returnTo);
        });
      })(req, res, next);
    });

    app.get('/api/logout', (req, res) => {
      req.logout((err) => {
        if (err) {
          console.error('Logout error:', err);
        }
        res.redirect('/');
      });
    });

    // Error handling routes
    app.get('/login-error', (req, res) => {
      res.redirect('/?error=auth_error');
    });

    app.get('/login-failed', (req, res) => {
      res.redirect('/?error=auth_failed');
    });

  } catch (error) {
    console.error('Auth setup error:', error);
    // Setup fallback authentication for development
    setupFallbackAuth(app);
  }
}

function setupFallbackAuth(app: Express) {
  console.log('Using fallback authentication for development');

  app.get('/api/login', async (req, res) => {
    try {
      const role = req.query.role as string || 'customer';
      const userId = 'dev-user-' + Date.now();
      
      // Create a mock user in the database
      const { storage } = await import('./storage');
      
      const mockUser = await storage.upsertUser({
        id: userId,
        email: `dev-${role}-${Date.now()}@example.com`,
        firstName: 'Development',
        lastName: 'User',
        role: role as 'customer' | 'printer' | 'admin',
        creditBalance: '1000.00',
        companyName: role === 'printer' ? 'Dev Matbaa' : undefined,
        phone: '+90 555 123 4567',
        companyAddress: 'Development Address',
        isActive: true,
        subscriptionStatus: role === 'printer' ? 'active' : undefined
      });

      // Direct session setup without passport
      req.session.user = {
        id: userId,
        email: mockUser.email,
        role: mockUser.role,
        claims: {
          sub: userId,
          email: mockUser.email,
          role: mockUser.role
        }
      };

      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.redirect('/?error=session_failed');
        }
        res.redirect('/');
      });
    } catch (error) {
      console.error('Fallback auth error:', error);
      res.redirect('/?error=fallback_auth_error');
    }
  });

  app.get('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) console.error('Logout error:', err);
      res.redirect('/');
    });
  });
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.session?.user) {
    return next();
  }

  res.status(401).json({ message: "Unauthorized" });
}