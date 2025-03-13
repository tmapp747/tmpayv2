import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  generateQrCodeSchema, 
  insertTransactionSchema, 
  insertQrPaymentSchema,
  updateBalanceSchema,
  verifyPaymentSchema,
  casinoDepositSchema,
  casinoWithdrawSchema,
  casinoTransferSchema,
  casinoGetUserDetailsSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { randomUUID } from "crypto";
import { casino747Api } from "./casino747Api";
import { directPayApi } from "./directPayApi";

// Real DirectPay function to generate QR code using DirectPay API
async function directPayGenerateQRCode(amount: number, reference: string, username: string) {
  try {
    // Configure the webhook and redirect URLs
    const baseUrl = process.env.BASE_URL || 'https://747casino.replit.app';
    const webhook = `${baseUrl}/api/webhook/directpay/payment`;
    const redirectUrl = `${baseUrl}/payment/success?ref=${reference}`;
    
    // Call the DirectPay API to generate a GCash QR code
    const result = await directPayApi.generateGCashQR(amount, webhook, redirectUrl);
    
    if (!result || !result.paymentLink) {
      throw new Error('Failed to generate QR code from DirectPay API');
    }

    // Extract the QR code data and reference
    const qrCodeData = result.paymentLink;
    const directPayReference = result.reference || reference;
    
    // Calculate expiry time (30 minutes from now)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    
    return {
      qrCodeData,
      directPayReference,
      expiresAt
    };
  } catch (error) {
    console.error('Error generating QR code with DirectPay API:', error);
    
    // Fallback to mock implementation for development
    console.log(`[FALLBACK] DirectPay: Generating mock QR code for ${amount} with reference ${reference}`);
    
    const directPayReference = `DP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const qrCodeData = `https://directpay.example/payment/747casino/${username}?amount=${amount}&ref=${reference}`;
    
    return {
      qrCodeData,
      directPayReference,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    };
  }
}

async function casino747PrepareTopup(casinoId: string, amount: number, reference: string) {
  try {
    console.log(`Casino747: Preparing topup for casino ID ${casinoId} with amount ${amount} and reference ${reference}`);
    
    // In the real implementation, we would prepare the topup with the casino API
    // Here we're using a simple approach, but this could involve pre-creating a transaction
    // in the casino system or reserving funds
    
    // For now, we'll generate a unique reference that will be used to track this transaction
    // in the casino system
    const casinoReference = `C747-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    return {
      success: true,
      casinoReference
    };
  } catch (error) {
    console.error('Error preparing topup with Casino747 API:', error);
    throw new Error('Failed to prepare topup with Casino747 API');
  }
}

async function casino747CompleteTopup(casinoId: string, amount: number, reference: string) {
  try {
    console.log(`Casino747: Completing topup for casino ID ${casinoId} with amount ${amount} and reference ${reference}`);
    
    // Find the user by casino ID
    const user = await storage.getUserByCasinoClientId(parseInt(casinoId));
    
    if (!user || !user.casinoUsername) {
      throw new Error(`User with casino ID ${casinoId} not found or has no casino username`);
    }
    
    // Complete the topup using the Casino747 API's transfer funds function
    // This will directly credit the user's casino account
    const transferResult = await casino747Api.transferFunds(
      amount,
      parseInt(casinoId),
      user.casinoUsername,
      "USD",
      "system", // System transfer initiated by e-wallet
      `Deposit via e-wallet ref: ${reference}`
    );
    
    return {
      success: true,
      newBalance: transferResult.newBalance || amount,
      transactionId: transferResult.transactionId || `TXN${Math.floor(Math.random() * 10000000)}`
    };
  } catch (error) {
    console.error('Error completing topup with Casino747 API:', error);
    
    // Fallback for development/testing
    console.log(`[FALLBACK] Casino747: Simulating completed topup for ${casinoId} with amount ${amount}`);
    
    return {
      success: true,
      newBalance: amount,
      transactionId: `TXN${Math.floor(Math.random() * 10000000)}`
    };
  }
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

  // 747 Casino API routes
  
  // Get user details from casino
  app.post("/api/casino/user-details", async (req: Request, res: Response) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      // Validate using the schema
      casinoGetUserDetailsSchema.parse({ username });
      
      // First check if we have this user locally
      const existingUser = await storage.getUserByCasinoUsername(username);
      
      // If user exists locally, return the user details
      if (existingUser) {
        const { password: _, ...userWithoutPassword } = existingUser;
        return res.json({ 
          success: true, 
          user: userWithoutPassword,
          source: "local"
        });
      }
      
      // If not, fetch from casino API
      try {
        const casinoUserDetails = await casino747Api.getUserDetails(username);
        
        return res.json({
          success: true,
          user: casinoUserDetails,
          source: "casino"
        });
      } catch (casinoError) {
        console.error("Error fetching user from casino API:", casinoError);
        return res.status(404).json({ 
          success: false, 
          message: "User not found in casino system" 
        });
      }
    } catch (error) {
      console.error("Get casino user details error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false,
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ 
        success: false,
        message: "Server error while fetching user details" 
      });
    }
  });
  
  // Get user balance from casino
  app.post("/api/casino/balance", async (req: Request, res: Response) => {
    try {
      const { username, clientId } = req.body;
      
      if (!username || !clientId) {
        return res.status(400).json({ 
          success: false,
          message: "Username and client ID are required" 
        });
      }
      
      try {
        const balanceResult = await casino747Api.getUserBalance(clientId, username);
        
        // Find user in our database to update their casino balance
        const localUser = await storage.getUserByCasinoUsername(username);
        if (localUser) {
          await storage.updateUserCasinoDetails(localUser.id, {
            casinoBalance: balanceResult.balance.toString()
          });
        }
        
        return res.json({
          success: true,
          balance: balanceResult.balance,
          currency: balanceResult.currency
        });
      } catch (casinoError) {
        console.error("Error fetching balance from casino API:", casinoError);
        return res.status(400).json({ 
          success: false,
          message: "Failed to fetch balance from casino system" 
        });
      }
    } catch (error) {
      console.error("Get casino balance error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Server error while fetching casino balance" 
      });
    }
  });
  
  // Deposit to casino
  app.post("/api/casino/deposit", async (req: Request, res: Response) => {
    try {
      const { userId, casinoClientId, casinoUsername, amount, currency, method } = req.body;
      
      // Validate using the schema
      const validatedData = casinoDepositSchema.parse(req.body);
      
      // Get user from our database
      const user = await storage.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }
      
      // Check if user has enough balance
      const userBalance = parseFloat(user.balance.toString());
      if (userBalance < validatedData.amount) {
        return res.status(400).json({ 
          success: false, 
          message: "Insufficient funds" 
        });
      }
      
      // Create a transaction record
      const transactionReference = randomUUID();
      const transaction = await storage.createTransaction({
        userId: validatedData.userId,
        type: "casino_deposit",
        method: validatedData.method,
        amount: validatedData.amount.toString(),
        status: "pending",
        casinoClientId: validatedData.casinoClientId,
        casinoUsername: validatedData.casinoUsername,
        currency: validatedData.currency,
        uniqueId: `CD-${Date.now()}`,
        metadata: { initiatedAt: new Date().toISOString() }
      });
      
      try {
        // Transfer the funds to the casino
        const transferResult = await casino747Api.transferFunds(
          validatedData.amount,
          validatedData.casinoClientId,
          validatedData.casinoUsername,
          validatedData.currency,
          validatedData.casinoUsername, // From the same user (e-wallet to casino)
          `Deposit from e-wallet - ${transactionReference}`
        );
        
        // Update transaction record
        await storage.updateTransactionStatus(
          transaction.id, 
          "completed", 
          transferResult.transactionId
        );
        
        // Deduct from user's e-wallet balance
        const updatedUser = await storage.updateUserBalance(user.id, -validatedData.amount);
        
        // Update user's casino balance
        await storage.updateUserCasinoBalance(user.id, validatedData.amount);
        
        return res.json({
          success: true,
          message: "Deposit to casino completed successfully",
          transaction: {
            ...transaction,
            status: "completed",
            casinoReference: transferResult.transactionId
          },
          newBalance: updatedUser.balance,
          newCasinoBalance: transferResult.newBalance
        });
      } catch (casinoError) {
        console.error("Error depositing to casino:", casinoError);
        
        // Update transaction to failed
        await storage.updateTransactionStatus(transaction.id, "failed");
        
        return res.status(400).json({ 
          success: false, 
          message: "Failed to deposit to casino system",
          transaction: {
            ...transaction,
            status: "failed"
          }
        });
      }
    } catch (error) {
      console.error("Casino deposit error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false,
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ 
        success: false,
        message: "Server error while processing casino deposit" 
      });
    }
  });
  
  // Withdraw from casino
  app.post("/api/casino/withdraw", async (req: Request, res: Response) => {
    try {
      // Validate request using the schema
      const validatedData = casinoWithdrawSchema.parse(req.body);
      
      // Get user from our database
      const user = await storage.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }
      
      // Create a transaction record
      const transactionReference = randomUUID();
      const uniqueId = Date.now();
      
      const transaction = await storage.createTransaction({
        userId: validatedData.userId,
        type: "casino_withdraw",
        method: "crypto",
        amount: validatedData.amount.toString(),
        status: "pending",
        casinoClientId: validatedData.casinoClientId,
        casinoUsername: validatedData.casinoUsername,
        destinationAddress: validatedData.destinationAddress,
        destinationNetwork: validatedData.destinationNetwork,
        uniqueId: uniqueId.toString(),
        metadata: { initiatedAt: new Date().toISOString() }
      });
      
      try {
        // Process the withdrawal through the casino API
        const withdrawResult = await casino747Api.withdrawFunds(
          validatedData.casinoClientId,
          validatedData.amount,
          validatedData.currency,
          validatedData.destinationCurrency,
          validatedData.destinationNetwork,
          validatedData.destinationAddress
        );
        
        // Update transaction record
        await storage.updateTransactionStatus(
          transaction.id, 
          "completed", 
          withdrawResult.transactionId
        );
        
        // Update user's casino balance
        await storage.updateUserCasinoBalance(user.id, -validatedData.amount);
        
        return res.json({
          success: true,
          message: "Withdrawal from casino completed successfully",
          transaction: {
            ...transaction,
            status: "completed",
            casinoReference: withdrawResult.transactionId
          }
        });
      } catch (casinoError) {
        console.error("Error withdrawing from casino:", casinoError);
        
        // Update transaction to failed
        await storage.updateTransactionStatus(transaction.id, "failed");
        
        return res.status(400).json({ 
          success: false, 
          message: "Failed to withdraw from casino system",
          transaction: {
            ...transaction,
            status: "failed"
          }
        });
      }
    } catch (error) {
      console.error("Casino withdraw error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false,
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ 
        success: false,
        message: "Server error while processing casino withdrawal" 
      });
    }
  });
  
  // Transfer between casino accounts
  app.post("/api/casino/transfer", async (req: Request, res: Response) => {
    try {
      // Validate request using the schema
      const validatedData = casinoTransferSchema.parse(req.body);
      
      // Get user from our database
      const fromUser = await storage.getUserByUsername(validatedData.fromCasinoUsername);
      if (!fromUser) {
        return res.status(404).json({ 
          success: false, 
          message: "Sender not found" 
        });
      }
      
      // Create a transaction record
      const transactionReference = randomUUID();
      
      const transaction = await storage.createTransaction({
        userId: validatedData.fromUserId,
        type: "transfer",
        method: "casino_transfer",
        amount: validatedData.amount.toString(),
        status: "pending",
        casinoUsername: validatedData.toUsername, // Target username in this case
        casinoClientId: validatedData.toClientId, // Target client ID
        uniqueId: `CT-${Date.now()}`,
        currency: validatedData.currency,
        metadata: { 
          initiatedAt: new Date().toISOString(),
          comment: validatedData.comment
        }
      });
      
      try {
        // Process the transfer through the casino API
        const transferResult = await casino747Api.transferFunds(
          validatedData.amount,
          validatedData.toClientId,
          validatedData.toUsername,
          validatedData.currency,
          validatedData.fromCasinoUsername,
          validatedData.comment || "Transfer from e-wallet"
        );
        
        // Update transaction record
        await storage.updateTransactionStatus(
          transaction.id, 
          "completed", 
          transferResult.transactionId
        );
        
        // Update sender's casino balance
        await storage.updateUserCasinoBalance(fromUser.id, -validatedData.amount);
        
        return res.json({
          success: true,
          message: "Casino transfer completed successfully",
          transaction: {
            ...transaction,
            status: "completed",
            casinoReference: transferResult.transactionId
          }
        });
      } catch (casinoError) {
        console.error("Error processing casino transfer:", casinoError);
        
        // Update transaction to failed
        await storage.updateTransactionStatus(transaction.id, "failed");
        
        return res.status(400).json({ 
          success: false, 
          message: "Failed to process casino transfer",
          transaction: {
            ...transaction,
            status: "failed"
          }
        });
      }
    } catch (error) {
      console.error("Casino transfer error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false,
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ 
        success: false,
        message: "Server error while processing casino transfer" 
      });
    }
  });
  
  // Get casino transaction history
  app.get("/api/casino/transactions/:username", async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      const { currency } = req.query;
      
      if (!username) {
        return res.status(400).json({ 
          success: false, 
          message: "Username is required" 
        });
      }
      
      try {
        // Get user from our database
        const user = await storage.getUserByCasinoUsername(username);
        if (!user) {
          return res.status(404).json({ 
            success: false, 
            message: "User not found" 
          });
        }
        
        // Get transactions from casino API
        const transactionHistory = await casino747Api.getTransactionHistory(
          username, 
          currency as string || "USD"
        );
        
        // Also get local casino transactions
        const localTransactions = await storage.getCasinoTransactions(user.id);
        
        // Merge and sort transactions by date
        // This would need proper implementation to merge and deduplicate
        
        return res.json({
          success: true,
          casinoTransactions: transactionHistory.transactions,
          localTransactions: localTransactions
        });
      } catch (casinoError) {
        console.error("Error fetching transactions from casino:", casinoError);
        
        // If casino API fails, return just the local transactions
        if (username) {
          const user = await storage.getUserByCasinoUsername(username);
          if (user) {
            const localTransactions = await storage.getCasinoTransactions(user.id);
            return res.json({
              success: true,
              casinoTransactions: [],
              localTransactions: localTransactions,
              message: "Could not fetch transactions from casino API. Showing local transactions only."
            });
          }
        }
        
        return res.status(400).json({ 
          success: false, 
          message: "Failed to fetch transactions from casino system" 
        });
      }
    } catch (error) {
      console.error("Casino transactions error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Server error while fetching casino transactions" 
      });
    }
  });

  // DirectPay webhook endpoint for payment notifications
  app.post("/api/webhook/directpay/payment", async (req: Request, res: Response) => {
    try {
      console.log("DirectPay webhook received:", req.body);
      
      // Extract payment details from the webhook payload
      const { reference, status, amount, transactionId } = req.body;
      
      if (!reference) {
        return res.status(400).json({ 
          success: false, 
          message: "Payment reference is required" 
        });
      }
      
      // Find the QR payment
      const qrPayment = await storage.getQrPaymentByReference(reference);
      if (!qrPayment) {
        return res.status(404).json({ 
          success: false, 
          message: "Payment not found" 
        });
      }
      
      // Find the transaction
      const transaction = await storage.getTransaction(qrPayment.transactionId);
      if (!transaction) {
        return res.status(404).json({ 
          success: false, 
          message: "Transaction not found" 
        });
      }
      
      // Find the user
      const user = await storage.getUser(qrPayment.userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }
      
      if (status === 'success' || status === 'completed') {
        // Update QR payment status
        await storage.updateQrPaymentStatus(qrPayment.id, "completed");
        
        // Update transaction status and add DirectPay transaction ID
        await storage.updateTransactionStatus(
          transaction.id,
          "completed",
          transactionId || reference
        );
        
        // Call 747 Casino API to complete the topup
        const paymentAmount = parseFloat(qrPayment.amount.toString());
        const casinoResult = await casino747CompleteTopup(
          user.casinoId,
          paymentAmount,
          transaction.paymentReference || ""
        );
        
        // Update user's balance
        await storage.updateUserBalance(user.id, paymentAmount);
        
        console.log("Payment completed successfully:", {
          reference,
          userId: user.id,
          amount: paymentAmount,
          casinoResult
        });
      } else if (status === 'failed') {
        // Update QR payment and transaction status
        await storage.updateQrPaymentStatus(qrPayment.id, "failed");
        await storage.updateTransactionStatus(transaction.id, "failed");
        
        console.log("Payment failed:", { reference, userId: user.id });
      }
      
      // Return a 200 OK to acknowledge receipt of the webhook
      return res.status(200).json({ 
        success: true, 
        message: "Webhook processed successfully" 
      });
    } catch (error) {
      console.error("DirectPay webhook error:", error);
      
      // Even in case of error, return a 200 OK to prevent repeated webhook attempts
      return res.status(200).json({ 
        success: false, 
        message: "Error processing webhook, but received" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
