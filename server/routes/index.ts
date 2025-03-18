import { Router } from "express";
import mobileRoutes from "./mobile";
import adminRoutes from "./admin";
import apiRoutes from "./api";

// Create main router
const router = Router();

// Register mobile routes (user features)
router.use('/mobile', mobileRoutes);

// Register admin routes (admin features)
router.use('/admin', adminRoutes);

// Register API routes (webhooks and callbacks)
router.use('/', apiRoutes);

export { router };