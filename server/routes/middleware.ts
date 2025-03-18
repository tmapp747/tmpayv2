/**
 * Middleware functions for Express routes
 * 
 * This module provides centralized authentication and authorization middleware
 * for route protection across the application.
 */

import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { User } from "@shared/schema";

  interface SessionData {
    userId?: number;
  }

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Authentication middleware for protecting routes
 * Checks if user is authenticated via session or token
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  console.log(`[AUTH MIDDLEWARE] Checking authentication for path: ${req.path}`);
  try {
    // Check for session-based authentication first
    if (req.session && req.session.userId) {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        req.user = user;
        return next();
      }
    }
    
    // If no session, check for token-based authentication
    console.log('[AUTH MIDDLEWARE] No session authentication, checking for token');
    const authHeader = req.headers.authorization;
    console.log('[AUTH MIDDLEWARE] Authorization header present:', !!authHeader);
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await storage.getUserByAccessToken(token);
      
      if (user && !(await storage.isTokenExpired(user.id))) {
        req.user = user;
        return next();
      }
    }
    
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  } catch (error) {
    console.error('[AUTH MIDDLEWARE] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
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
      // First ensure the user is authenticated
      await authMiddleware(req, res, async () => {
        // If req.user exists, the user is authenticated
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required',
          });
        }
        
        // Check if user has one of the allowed roles
        if (!allowedRoles.includes(req.user.role)) {
          console.log(`[ROLE AUTH] User ${req.user.username} with role ${req.user.role} doesn't have permission. Allowed roles: ${allowedRoles.join(', ')}`);
          return res.status(403).json({
            success: false,
            message: 'Access denied. Insufficient permissions.',
          });
        }
        
        // Check if user is in good standing (not suspended)
        if (req.user.status === 'suspended') {
          return res.status(403).json({
            success: false, 
            message: 'Account suspended. Please contact support.',
            reason: req.user.statusReason
          });
        }
        
        // User has the required role, proceed
        next();
      });
    } catch (error) {
      console.error('[ROLE AUTH] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
}