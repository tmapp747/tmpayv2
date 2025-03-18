import { Router, Request, Response } from "express";
import { storage } from "../../storage";
import { casino747Api } from "../../casino747Api";
import { directPayApi } from "../../directPayApi";

// Create API router for webhooks and callbacks
const router = Router();

// Test endpoint
router.get("/test", (req, res) => {
  res.json({ success: true, message: "API router working" });
});

export default router;