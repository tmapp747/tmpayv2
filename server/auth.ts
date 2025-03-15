import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { casino747Api } from "./casino747Api";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Number of salt rounds for bcrypt hashing
const SALT_ROUNDS = 10;

/**
 * Hashes a password using bcrypt
 * In development mode, can be configured to use plaintext for easier testing
 */
export async function hashPassword(password: string) {
  // Check if we're in development mode and if plaintext passwords are allowed
  if (process.env.NODE_ENV !== "production" && process.env.ALLOW_PLAINTEXT_PASSWORDS === "true") {
    console.warn("WARNING: Using plaintext passwords in development mode");
    return password;
  }
  
  // Otherwise use proper bcrypt hashing even in development
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a supplied password with a stored password
 * Handles both bcrypt hashed passwords and plaintext passwords (for development)
 */
export async function comparePasswords(supplied: string, stored: string) {
  // If the stored password appears to be a bcrypt hash, use bcrypt.compare
  if (stored.startsWith('$2b$') || stored.startsWith('$2a$')) {
    return await bcrypt.compare(supplied, stored);
  }
  
  // Fallback for plaintext passwords (development only)
  if (process.env.NODE_ENV !== "production" && process.env.ALLOW_PLAINTEXT_PASSWORDS === "true") {
    return supplied === stored;
  }
  
  // If we're in production and the password doesn't look like a hash, always fail
  if (process.env.NODE_ENV === "production") {
    console.error("Plaintext password found in production environment");
    return false;
  }
  
  // Default comparison (should only reach here in non-production)
  return supplied === stored;
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || (process.env.NODE_ENV === "production" 
      ? randomBytes(32).toString('hex') // Generate a secure random secret in production
      : "casino747_dev_session_secret"),
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict' // Prevent CSRF
    }
  };
  
  // Log a warning if using default session secret in production
  if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
    console.warn("WARNING: Using auto-generated session secret in production. Set SESSION_SECRET env variable for persistent sessions.");
  }

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        // Remove password from the response
        const userResponse = { ...user } as Partial<SelectUser>;
        if (userResponse.password) {
          delete userResponse.password;
        }
        
        res.status(201).json({ success: true, user: userResponse, message: "User registered successfully" });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), async (req, res) => {
    try {
      // Get the authenticated user from request
      const user = req.user as SelectUser;
      
      // If the user has a casino username, try to fetch the hierarchy info
      if (user && user.casinoUsername) {
        // Determine if the user is an agent based on their stored user type
        const isAgent = user.casinoUserType === 'agent';
        
        try {
          // Fetch user hierarchy from casino API
          const hierarchyData = await casino747Api.getUserHierarchy(user.casinoUsername, isAgent);
          
          if (hierarchyData.hierarchy && hierarchyData.hierarchy.length >= 3) {
            // Get top manager (3rd element, index 2)
            const topManager = hierarchyData.hierarchy[2]?.username;
            
            // Find immediate manager by finding parent
            let immediateManager = '';
            
            // Find the immediate manager by matching parentClientId
            for (const agent of hierarchyData.hierarchy) {
              if (agent.clientId === hierarchyData.user.parentClientId) {
                immediateManager = agent.username;
                break;
              }
            }
            
            // Update user with hierarchy info from API
            await storage.updateUserHierarchyInfo(
              user.id, 
              topManager || user.topManager || "", 
              immediateManager || user.immediateManager || "", 
              user.casinoUserType || (isAgent ? 'agent' : 'player')
            );
            
            // Get updated user
            const updatedUser = await storage.getUser(user.id);
            if (updatedUser) {
              req.user = updatedUser;
            }
          }
        } catch (error) {
          console.error("Error fetching hierarchy data during login:", error);
          // Don't fail the login if we can't get hierarchy, just continue with existing data
        }
      }
      
      // Remove password from the response
      const userResponse = { ...req.user } as Partial<SelectUser>;
      if (userResponse.password) {
        delete userResponse.password;
      }
      
      res.status(200).json({ success: true, user: userResponse, message: "Login successful" });
    } catch (error) {
      console.error("Error in login endpoint:", error);
      res.status(500).json({ success: false, message: "Error processing login" });
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ success: true, message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    
    // Remove password from the response
    const userResponse = { ...req.user } as Partial<SelectUser>;
    if (userResponse.password) {
      delete userResponse.password;
    }
    
    res.json({ success: true, user: userResponse });
  });
}