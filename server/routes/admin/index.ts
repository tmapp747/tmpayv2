import { Router, Request, Response } from "express";
import { roleAuthMiddleware } from "../middleware";
import { storage } from "../../storage";
import { z } from "zod";

// Create admin router for administrative features
const router = Router();

// Test endpoint
router.get("/test", roleAuthMiddleware(['admin']), (req, res) => {
  res.json({ success: true, message: "Admin API working" });
});

export default router;