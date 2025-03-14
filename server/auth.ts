import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { casino747Api } from "./casino747Api";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
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