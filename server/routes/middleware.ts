import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import type { User } from "@shared/schema";
import { SessionData } from "express-session";

// Extend SessionData interface to include userId
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

/**
 * Authentication middleware for protecting routes
 * Checks if user is authenticated via session or token
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // First check for session-based authentication
    if (req.session && req.session.userId) {
      console.log(`[AUTH MIDDLEWARE] Checking authentication for path: ${req.path}`);
      console.log("[AUTH MIDDLEWARE] User authenticated via session");
      
      // Validate that the user still exists in the database
      const user = await storage.getUser(req.session.userId as number);
      if (!user) {
        req.session.destroy((err) => {
          if (err) console.error("Error destroying session:", err);
        });
        return res.status(401).json({ success: false, message: "Authentication failed" });
      }
      
      console.log("[AUTH MIDDLEWARE] Session user validated successfully");
      req.user = user;
      return next();
    }
    
    // Then check for token-based authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    
    const token = authHeader.split(" ")[1];
    const user = await storage.getUserByAccessToken(token);
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    
    // Check if token is expired
    const isExpired = await storage.isTokenExpired(user.id);
    if (isExpired) {
      return res.status(401).json({ success: false, message: "Token expired" });
    }
    
    console.log("[AUTH MIDDLEWARE] User authenticated via token");
    req.user = user;
    next();
  } catch (error) {
    console.error("[AUTH MIDDLEWARE ERROR]", error);
    res.status(500).json({ success: false, message: "Authentication error" });
  }
}

/**
 * Role-based authentication middleware
 * Checks if authenticated user has one of the allowed roles
 * 
 * @param allowedRoles Array of roles that are allowed to access the route
 */
export function roleAuthMiddleware(allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // First authenticate the user
      await authMiddleware(req, res, () => {
        // Then check if user has the required role
        if (!req.user) {
          return res.status(401).json({ success: false, message: "Authentication required" });
        }
        
        const user = req.user as User;
        // Default to 'user' role if not specified
        const userType = user.userType || user.casinoUserType || 'user';
        const userRole = userType === 'admin' ? 'admin' : 'user';
        
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({ success: false, message: "Access forbidden" });
        }
        
        console.log(`[ROLE AUTH] User ${user.username} authorized with role: ${userRole}`);
        next();
      });
    } catch (error) {
      console.error("[ROLE AUTH ERROR]", error);
      res.status(500).json({ success: false, message: "Authorization error" });
    }
  };
}

// Add user type to Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}