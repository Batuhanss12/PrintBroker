import passport from "passport";
import type { Express } from "express";
import session from "express-session";

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

  try {
    const { Issuer } = await import("openid-client");

    // Get the current host
    const host = process.env.REPL_SLUG ? 
      `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER || 'replit'}.repl.co` : 
      'http://localhost:5000';

    // Discover OIDC issuer with error handling
    const issuer = await Issuer.discover('https://replit.com/.well-known/openid_configuration');

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

    passport.serializeUser((user, done) => {
      done(null, user);
    });

    passport.deserializeUser((user: any, done) => {
      done(null, user);
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

  app.get('/api/login', (req, res) => {
    try {
      // Create a mock user session for development
      const mockUser = {
        claims: {
          sub: 'dev-user-' + Date.now(),
          name: 'Development User',
          email: 'dev@example.com'
        }
      };

      // Use passport's login method
      req.logIn(mockUser, (err) => {
        if (err) {
          console.error('Mock login error:', err);
          return res.redirect('/?error=mock_login_failed');
        }

        const returnTo = req.query.returnTo as string || '/dashboard';
        res.redirect(returnTo);
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
  if (req.user && req.user.claims) {
    return next();
  }

  res.status(401).json({ message: "Unauthorized" });
}