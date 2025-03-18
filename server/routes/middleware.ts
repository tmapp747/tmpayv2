import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { User } from "@shared/schema";

/**
 * Authentication middleware for protecting routes
 * Checks if user is authenticated via session or token
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  console.log("[AUTH MIDDLEWARE] Checking authentication for path:", req.path);
  
  const sessionUserId = req.session.userId;
  const token = req.headers.authorization?.split(" ")[1];
  let user: User | undefined;
  
  // First check session authentication
  if (sessionUserId) {
    console.log("[AUTH MIDDLEWARE] User authenticated via session");
    user = await storage.getUser(sessionUserId);
    
    if (user) {
      console.log("[AUTH MIDDLEWARE] Session user validated successfully");
      req.user = user;
      return next();
    } else {
      console.log("[AUTH MIDDLEWARE] Session user no longer exists, clearing session");
      req.session.destroy(() => {});
    }
  }
  
  // Then check token authentication
  console.log("[AUTH MIDDLEWARE] No session authentication, checking for token");
  console.log("[AUTH MIDDLEWARE] Authorization header present:", !!token);
  
  if (token) {
    user = await storage.getUserByAccessToken(token);
    
    if (user) {
      console.log("[AUTH MIDDLEWARE] Token authentication successful");
      req.user = user;
      return next();
    }
  }
  
  // If no valid authentication found
  console.log("[AUTH MIDDLEWARE] Authentication failed");
  return res.status(401).json({
    success: false,
    message: "Authentication required"
  });
}

/**
 * Role-based authentication middleware
 * Checks if authenticated user has one of the allowed roles
 * 
 * @param allowedRoles Array of roles that are allowed to access the route
 */
export function roleAuthMiddleware(allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // First ensure user is authenticated
    await authMiddleware(req, res, (err?: any) => {
      if (err) return next(err);
      
      const user = req.user as User;
      
      // Admin users have access to everything
      if (user.isVip || allowedRoles.includes(user.casinoUserType || "")) {
        return next();
      }
      
      // Otherwise check if user has one of the allowed roles
      console.log("[ROLE AUTH] User does not have required role:", allowedRoles);
      return res.status(403).json({
        success: false,
        message: "Forbidden: Insufficient permissions"
      });
    });
  };
}