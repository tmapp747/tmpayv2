import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { pool } from "./db";
import pgSession from "connect-pg-simple";
import { insertUserSchema } from "../shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Failed to hash password");
  }
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  if (!supplied || !stored) return false;
  
  // Check if password is stored as hash or plaintext
  const isHashed = stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$');
  
  try {
    if (isHashed) {
      // Password is hashed, use bcrypt.compare
      return await bcrypt.compare(supplied, stored);
    } else {
      // Password is stored in plaintext, do direct comparison
      console.log('Doing plaintext password comparison');
      return supplied === stored;
    }
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

/**
 * Check if a password is hashed (starts with the bcrypt identifier $2a$, $2b$, or $2y$)
 * This is used for automatic migration of plaintext passwords to bcrypt hashes
 */
export function isPasswordHashed(password: string): boolean {
  return password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('$2y$');
}

export function setupAuth(app: Express) {
  // Use PostgreSQL for session storage to maintain sessions across restarts
  const PgStore = pgSession(session);
  const pgSessionStore = new PgStore({
    pool,
    tableName: 'session',
    createTableIfMissing: true,
    pruneSessionInterval: 60 * 15 // Prune expired sessions every 15 minutes
  });

  // Configure session with longer expiry and rolling sessions
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    rolling: true, // Extends expiry on active use
    store: pgSessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup authentication middleware with detailed logging
  app.use((req, res, next) => {
    const authPath = req.path.startsWith('/api') && !req.path.startsWith('/api/auth/');
    if (authPath) {
      console.log('[AUTH MIDDLEWARE] Checking authentication for path:', req.path);
      
      // Skip auth for public endpoints
      if (req.path === '/api/health' || req.path === '/api/version') {
        return next();
      }
      
      // Check session authentication
      if (req.isAuthenticated()) {
        console.log('[AUTH MIDDLEWARE] User authenticated via session');
        
        // Validate user exists in database to handle deleted sessions
        if (req.user && req.user.id) {
          console.log('[AUTH MIDDLEWARE] Session user validated successfully');
          return next();
        } else {
          console.log('[AUTH MIDDLEWARE] Session user validation failed');
          return res.status(401).json({
            success: false,
            message: "Authentication required. Please log in again."
          });
        }
      }
      
      // If no session, check if token auth provided
      console.log('[AUTH MIDDLEWARE] No session authentication, checking for token');
      const hasAuthHeader = !!req.headers.authorization;
      console.log('[AUTH MIDDLEWARE] Authorization header present:', hasAuthHeader);
      
      // Skip token auth for this implementation as we're using sessions
      // But allow extension for future enhancements
      
      // Check public endpoints that bypass auth
      const publicPaths = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/verify-username',
        '/api/login',
        '/api/register',
        '/api/health',
        '/api/version'
      ];
      
      if (publicPaths.includes(req.path)) {
        return next();
      }
      
      // Otherwise, authentication failed
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in again."
      });
    }
    
    // Non-API paths or auth paths don't require authentication middleware
    return next();
  });

  // Passport local strategy for username/password authentication
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Case-insensitive username lookup
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log(`[AUTH] Login attempt for non-existent user: ${username}`);
          return done(null, false, { message: 'Invalid credentials' });
        }

        const isValid = await comparePasswords(password, user.password);
        if (!isValid) {
          console.log(`[AUTH] Failed password attempt for user: ${username}`);
          return done(null, false, { message: 'Invalid credentials' });
        }

        console.log(`[AUTH] Successful login for user: ${username}`);
        return done(null, user);
      } catch (error) {
        console.error(`[AUTH] Error during authentication for ${username}:`, error);
        return done(error);
      }
    })
  );

  // Serialize only user ID to session
  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  // Deserialize user from database on each request
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (user) {
        // Update last login time on successful session retrieval
        await storage.updateUserLastLogin(id);
      }
      done(null, user || false);
    } catch (error) {
      console.error(`[AUTH] Error deserializing user ${id}:`, error);
      done(error);
    }
  });

  // Auth endpoints
  app.post("/api/register", async (req, res, next) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(data.username);

      if (existingUser) {
        return res.status(400).json({ success: false, message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(data.password);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword
      });

      req.login(user, (err) => {
        if (err) return next(err);
        const userResponse = { ...user } as Partial<SelectUser>;
        delete userResponse.password;
        res.status(201).json({ success: true, user: userResponse });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    const userResponse = { ...req.user } as Partial<SelectUser>;
    delete userResponse.password;
    
    // Record login IP
    if (req.user && req.user.id) {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      storage.updateUserLastLogin(req.user.id, typeof ip === 'string' ? ip : undefined);
    }
    
    res.json({ success: true, user: userResponse });
  });

  app.post("/api/logout", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.json({ success: true, message: 'Not logged in' });
    }
    
    req.logout((err) => {
      if (err) return next(err);
      res.json({ success: true });
    });
  });

  app.get("/api/user/info", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log('[USER INFO] User not authenticated');
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required. Please log in again." 
      });
    }
    
    console.log('[USER INFO] Retrieved user from session:', req.user?.username, '(ID:', req.user?.id, ')');
    const userResponse = { ...req.user } as Partial<SelectUser>;
    delete userResponse.password;
    res.json({ success: true, user: userResponse });
  });
  
  // Session refresh endpoint to provide a way to extend sessions
  app.post("/api/refresh-token", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required. Please log in again." 
      });
    }
    
    // User is already authenticated, send back user info to refresh the client state
    const userResponse = { ...req.user } as Partial<SelectUser>;
    delete userResponse.password;
    
    // Update session expiry by modifying the cookie
    if (req.session.cookie) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }
    
    // Force session save to update the expiry
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.status(500).json({ 
          success: false, 
          message: "Session refresh failed" 
        });
      }
      
      res.json({ 
        success: true, 
        message: "Session refreshed successfully",
        user: userResponse
      });
    });
  });
}