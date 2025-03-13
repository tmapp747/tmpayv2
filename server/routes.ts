import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  generateQrCodeSchema, 
  insertTransactionSchema, 
  insertQrPaymentSchema,
  updateBalanceSchema,
  verifyPaymentSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { randomUUID } from "crypto";

// Mock DirectPay and Casino 747 API functions for development
// In production, these would be actual API calls to the external services
async function directPayGenerateQRCode(amount: number, reference: string, username: string) {
  // This would be a real API call to DirectPay
  console.log(`DirectPay: Generating QR code for ${amount} with reference ${reference}`);
  
  // Generate a mock QR code URL and direct pay reference
  const directPayReference = `DP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const qrCodeData = `https://directpay.example/payment/747casino/${username}?amount=${amount}&ref=${reference}`;
  
  return {
    qrCodeData,
    directPayReference,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
  };
}

async function casino747PrepareTopup(casinoId: string, amount: number, reference: string) {
  // This would be a real API call to the 747 Casino API
  console.log(`Casino747: Preparing topup for casino ID ${casinoId} with amount ${amount} and reference ${reference}`);
  
  return {
    success: true,
    casinoReference: `C747-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  };
}

async function casino747CompleteTopup(casinoId: string, amount: number, reference: string) {
  // This would be a real API call to the 747 Casino API
  console.log(`Casino747: Completing topup for casino ID ${casinoId} with amount ${amount} and reference ${reference}`);
  
  return {
    success: true,
    newBalance: amount, // In real implementation, would return the updated balance
    transactionId: `TXN${Math.floor(Math.random() * 10000000)}`
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth and user management routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Don't send the password to the client
      const { password: _, ...userWithoutPassword } = user;
      
      return res.json({ 
        user: userWithoutPassword,
        message: "Login successful" 
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Server error during login" });
    }
  });
  
  // User info and balance
  app.get("/api/user/info", async (req: Request, res: Response) => {
    try {
      // In production, this would use the authenticated user ID
      // For demo purposes, we're using a fixed user
      const userId = 1;
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      
      return res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Get user info error:", error);
      return res.status(500).json({ message: "Server error while fetching user info" });
    }
  });
  
  // Transaction history
  app.get("/api/transactions", async (req: Request, res: Response) => {
    try {
      // In production, this would use the authenticated user ID
      // For demo purposes, we're using a fixed user
      const userId = 1;
      
      const transactions = await storage.getTransactionsByUserId(userId);
      
      return res.json({ transactions });
    } catch (error) {
      console.error("Get transactions error:", error);
      return res.status(500).json({ message: "Server error while fetching transactions" });
    }
  });
  
  // Generate QR code for deposit
  app.post("/api/payments/gcash/generate-qr", async (req: Request, res: Response) => {
    try {
      // Validate request
      const { amount } = req.body;
      
      if (!amount || amount < 100 || amount > 50000) {
        return res.status(400).json({ 
          message: "Invalid amount. Must be between ₱100 and ₱50,000" 
        });
      }
      
      // In production, this would use the authenticated user
      // For demo purposes, we're using a fixed user
      const userId = 1;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if there's already an active QR code
      const activeQr = await storage.getActiveQrPaymentByUserId(userId);
      if (activeQr) {
        return res.status(400).json({
          message: "You already have an active QR code. Please complete or cancel the existing payment.",
          qrPayment: activeQr
        });
      }
      
      // Create a transaction record first
      const transactionReference = randomUUID();
      const transaction = await storage.createTransaction({
        userId,
        type: "deposit",
        method: "gcash_qr",
        amount: amount.toString(),
        status: "pending",
        paymentReference: transactionReference,
        metadata: { initiatedAt: new Date().toISOString() }
      });
      
      // Call DirectPay API to generate QR code
      const { qrCodeData, directPayReference, expiresAt } = await directPayGenerateQRCode(
        amount,
        transactionReference,
        user.username
      );
      
      // Call 747 Casino API to prepare for topup
      const { casinoReference } = await casino747PrepareTopup(
        user.casinoId,
        amount,
        transactionReference
      );
      
      // Update transaction with references
      await storage.updateTransactionStatus(
        transaction.id,
        "pending",
        directPayReference
      );
      
      // Create QR payment record
      const qrPayment = await storage.createQrPayment({
        userId,
        transactionId: transaction.id,
        qrCodeData,
        amount: amount.toString(),
        expiresAt,
        directPayReference,
        status: "pending"
      });
      
      // Return the QR code data to the client
      return res.json({
        success: true,
        qrPayment,
        transaction
      });
    } catch (error) {
      console.error("Generate QR error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: "Server error while generating QR code" });
    }
  });
  
  // Endpoint to check payment status
  app.get("/api/payments/status/:referenceId", async (req: Request, res: Response) => {
    try {
      const { referenceId } = req.params;
      
      if (!referenceId) {
        return res.status(400).json({ message: "Reference ID is required" });
      }
      
      // Find the QR payment by reference
      const qrPayment = await storage.getQrPaymentByReference(referenceId);
      
      if (!qrPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      // Check if the payment has expired
      if (qrPayment.status === "pending" && new Date() > qrPayment.expiresAt) {
        await storage.updateQrPaymentStatus(qrPayment.id, "expired");
        return res.json({
          success: false,
          status: "expired",
          message: "Payment has expired"
        });
      }
      
      return res.json({
        success: true,
        status: qrPayment.status,
        qrPayment
      });
    } catch (error) {
      console.error("Check payment status error:", error);
      return res.status(500).json({ message: "Server error while checking payment status" });
    }
  });
  
  // Endpoint to simulate payment completion (in production this would be a webhook from DirectPay)
  app.post("/api/payments/simulate-completion", async (req: Request, res: Response) => {
    try {
      const { directPayReference } = req.body;
      
      if (!directPayReference) {
        return res.status(400).json({ message: "DirectPay reference is required" });
      }
      
      // Find the QR payment
      const qrPayment = await storage.getQrPaymentByReference(directPayReference);
      
      if (!qrPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      if (qrPayment.status !== "pending") {
        return res.status(400).json({ 
          message: `Payment is already ${qrPayment.status}` 
        });
      }
      
      // Find the user
      const user = await storage.getUser(qrPayment.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Find the transaction
      const transaction = await storage.getTransaction(qrPayment.transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Update QR payment status
      await storage.updateQrPaymentStatus(qrPayment.id, "completed");
      
      // Update transaction status
      await storage.updateTransactionStatus(transaction.id, "completed");
      
      // Call 747 Casino API to complete the topup
      const amount = parseFloat(qrPayment.amount.toString());
      const { transactionId } = await casino747CompleteTopup(
        user.casinoId,
        amount,
        transaction.paymentReference || ""
      );
      
      // Update user's balance
      const updatedUser = await storage.updateUserBalance(user.id, amount);
      
      return res.json({
        success: true,
        message: "Payment completed successfully",
        transaction: {
          ...transaction,
          status: "completed",
          transactionId
        },
        newBalance: updatedUser.balance
      });
    } catch (error) {
      console.error("Simulate payment completion error:", error);
      return res.status(500).json({ message: "Server error while processing payment completion" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
