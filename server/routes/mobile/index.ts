import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware";
import { storage } from "../../storage";
import { z } from "zod";

// DirectPay API for GCash integration
import { directPayApi } from "../../directPayApi";

// Create mobile router for user-facing features
const router = Router();

// Test endpoint
router.get("/test", (req, res) => {
  res.json({ success: true, message: "Mobile API working" });
});

export default router;