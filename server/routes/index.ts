import { Router } from "express";
import mobileRoutes from "./mobile";
import adminRoutes from "./admin";
import apiRoutes from "./api";

// Create main router
const router = Router();

// -----------------------------------------------------------
// Route Registration with Redirection for Legacy Endpoints
// -----------------------------------------------------------

// Register API routes for authentication and external APIs/webhooks
router.use('/', apiRoutes);

// Register user-facing mobile routes
// Important: Some client apps may still use the direct API paths
// so we expose both /mobile/endpoint and /endpoint patterns
router.use('/mobile', mobileRoutes);

// Mobile redirects - map legacy API routes to new mobile routes
router.use('/user', mobileRoutes); 
router.use('/transactions', mobileRoutes);
router.use('/payments', mobileRoutes);
router.use('/currencies', mobileRoutes);
router.use('/currency', mobileRoutes);

// Register admin routes
router.use('/admin', adminRoutes);

// Admin redirects - map legacy API routes to new admin routes
router.use('/agent', adminRoutes);

export { router };