import { Router, Request, Response, NextFunction } from "express";
import mobileRoutes from "./mobile";
import adminRoutes from "./admin";
import apiRoutes from "./api";

// Create main router
const router = Router();

// Debug middleware to log route access
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`Route accessed: ${req.method} ${req.originalUrl}`);
  next();
});

// -----------------------------------------------------------
// Route Registration with Redirection for Legacy Endpoints
// -----------------------------------------------------------

// Register user-facing mobile routes for direct mobile path pattern
router.use('/mobile', mobileRoutes);

// Important: Many client functions access /api/user/info directly
// Make sure these paths still work by mapping them to the appropriate modules

// Direct mappings - these maintain backward compatibility with existing client code 
// Anything under /api/user/ goes to mobile routes
router.use('/user', mobileRoutes);

// Transactions endpoints go to mobile routes
router.use('/transactions', mobileRoutes);

// Payment endpoints go to mobile routes
router.use('/payments', mobileRoutes);

// Currency endpoints go to mobile routes
router.use('/currencies', mobileRoutes);
router.use('/currency', mobileRoutes);

// Admin routes
router.use('/admin', adminRoutes);

// Agent endpoints (admin functionality)
router.use('/agent', adminRoutes);

// API routes for authentication and webhooks - must be last to avoid overriding other routes
router.use('/', apiRoutes);

// Catch-all to help debug missing routes
router.use('*', (req: Request, res: Response) => {
  console.log(`Unhandled route: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: "API endpoint not found" });
});

export { router };