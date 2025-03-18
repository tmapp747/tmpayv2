import { Router, Request, Response } from "express";
import { storage } from "../../storage";
import { casino747Api } from "../../casino747Api";
import { directPayApi } from "../../directPayApi";
import { authMiddleware, roleAuthMiddleware } from "../middleware";
import { 
  casinoGetUserDetailsSchema, 
  casinoDepositSchema,
  casinoWithdrawSchema,
  casinoTransferSchema,
  loginSchema,
  authSchema
} from "@shared/schema";
import { 
  mapDirectPayStatusToGcashStatus, 
  mapCasinoTransferStatusToCasinoStatus, 
  determineTransactionStatus,
  generateTransactionTimeline
} from "@shared/api-mapping";
import { z } from "zod";
import { randomUUID } from "crypto";
import { comparePasswords, hashPassword } from "../../auth";

// Create API router for webhooks and callbacks
const router = Router();

// Test endpoint
router.get("/test", (req, res) => {
  res.json({ success: true, message: "API router working" });
});

// Authentication endpoints

// Verify username
router.post("/auth/verify-username", async (req: Request, res: Response) => {
  try {
    console.log("Verifying username with data:", JSON.stringify(req.body, null, 2));
    const { username, userType } = req.body;
    
    if (!username) {
      return res.status(400).json({ success: false, message: "Username is required" });
    }
    
    // Check if user already exists in our database
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.json({
        success: true,
        accountExists: true,
        message: "Account exists",
        isAuthorized: existingUser.isAuthorized
      });
    }
    
    // If user doesn't exist, check with casino API to validate
    const isAgent = userType === 'agent';
    
    try {
      const userDetails = await casino747Api.getUserDetails(username);
      
      if (!userDetails || !userDetails.success) {
        return res.status(400).json({
          success: false,
          message: "Username not found in casino system"
        });
      }
      
      // Get user hierarchy from casino API
      const hierarchyInfo = await casino747Api.getUserHierarchy(username, isAgent);
      
      return res.json({
        success: true,
        accountExists: false,
        message: "Username verified with casino API",
        topManager: hierarchyInfo.topManager,
        immediateManager: hierarchyInfo.immediateManager,
        userType: hierarchyInfo.userType,
        clientId: userDetails.clientId
      });
    } catch (error) {
      console.error('Error verifying username with casino API:', error);
      return res.status(400).json({
        success: false,
        message: "Failed to verify username with casino API"
      });
    }
  } catch (error) {
    console.error('Error verifying username:', error);
    return res.status(500).json({ success: false, message: "Username verification failed" });
  }
});

// Login endpoint
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    // Validate request using schema
    const validatedData = loginSchema.parse(req.body);
    
    // Check if user exists
    const user = await storage.getUserByUsername(validatedData.username);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    
    // Verify password
    const isPasswordValid = await comparePasswords(validatedData.password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    
    // Check if user is authorized
    if (!user.isAuthorized) {
      return res.status(403).json({ success: false, message: "Account is not authorized" });
    }
    
    // Generate tokens
    const accessToken = randomUUID();
    const refreshToken = randomUUID();
    
    // Store tokens
    await storage.updateUserAccessToken(user.id, accessToken);
    await storage.updateUserRefreshToken(user.id, refreshToken);
    
    // Set session (if using session-based auth)
    if (req.session) {
      req.session.userId = user.id;
    }
    
    // Return user info and tokens
    return res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        balance: user.balance,
        casinoUsername: user.casinoUsername,
        casinoBalance: user.casinoBalance || "0.00",
        casinoClientId: user.casinoClientId,
        userType: user.userType || user.casinoUserType || 'user',
        topManager: user.topManager,
        immediateManager: user.immediateManager
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "Invalid login data", errors: error.errors });
    }
    return res.status(500).json({ success: false, message: "Login failed" });
  }
});

// Refresh token endpoint
router.post("/auth/refresh-token", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "Refresh token is required" });
    }
    
    // Check if refresh token is valid
    const user = await storage.getUserByRefreshToken(refreshToken);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }
    
    // Generate new tokens
    const newAccessToken = randomUUID();
    const newRefreshToken = randomUUID();
    
    // Store new tokens
    await storage.updateUserAccessToken(user.id, newAccessToken);
    await storage.updateUserRefreshToken(user.id, newRefreshToken);
    
    // Set session (if using session-based auth)
    if (req.session) {
      req.session.userId = user.id;
    }
    
    return res.json({
      success: true,
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({ success: false, message: "Token refresh failed" });
  }
});

// Logout endpoint
router.post("/auth/logout", async (req: Request, res: Response) => {
  try {
    // Get token from authorization header or body
    const authHeader = req.headers.authorization;
    const { refreshToken } = req.body;
    
    let token;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    
    // Clear tokens from user record if token is valid
    if (token) {
      const user = await storage.getUserByAccessToken(token);
      if (user) {
        await storage.updateUserAccessToken(user.id, null);
        await storage.updateUserRefreshToken(user.id, null);
      }
    }
    
    // Clear refresh token if provided
    if (refreshToken) {
      const user = await storage.getUserByRefreshToken(refreshToken);
      if (user) {
        await storage.updateUserAccessToken(user.id, null);
        await storage.updateUserRefreshToken(user.id, null);
      }
    }
    
    // Clear session
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
      });
    }
    
    return res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, message: "Logout failed" });
  }
});

// Register endpoint
router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    // Validate request using schema
    const validatedData = authSchema.parse(req.body);
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(validatedData.username);
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Username already exists" });
    }
    
    // Create user
    const hashedPassword = await hashPassword(validatedData.password);
    
    // Create the user with the provided data
    const user = await storage.createUser({
      username: validatedData.username,
      password: hashedPassword,
      email: validatedData.email,
      preferredCurrency: 'PHP', // Default currency
      casinoId: validatedData.casinoId || "",
      balance: "0.00",
      pendingBalance: "0.00",
      isVip: false,
      casinoUsername: validatedData.casinoUsername || validatedData.username,
      casinoClientId: validatedData.casinoClientId,
      topManager: validatedData.topManager,
      immediateManager: validatedData.immediateManager,
      casinoUserType: validatedData.userType || 'user',
      isAuthorized: true
    });
    
    // Generate tokens
    const accessToken = randomUUID();
    const refreshToken = randomUUID();
    
    // Store tokens
    await storage.updateUserAccessToken(user.id, accessToken);
    await storage.updateUserRefreshToken(user.id, refreshToken);
    
    // Set session (if using session-based auth)
    if (req.session) {
      req.session.userId = user.id;
    }
    
    return res.json({
      success: true,
      message: "Registration successful",
      user: {
        id: user.id,
        username: user.username,
        balance: user.balance,
        casinoUsername: user.casinoUsername,
        casinoBalance: user.casinoBalance || "0.00",
        casinoClientId: user.casinoClientId,
        userType: user.casinoUserType || 'user',
        topManager: user.topManager,
        immediateManager: user.immediateManager
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "Invalid registration data", errors: error.errors });
    }
    return res.status(500).json({ success: false, message: "Registration failed" });
  }
});

// Casino API integration endpoints

// Get user details from casino API
router.post("/casino/user-details", async (req: Request, res: Response) => {
  try {
    // Validate request
    const validatedData = casinoGetUserDetailsSchema.parse(req.body);
    
    // Call casino API to get user details
    const userDetails = await casino747Api.getUserDetails(validatedData.username);
    
    if (!userDetails || !userDetails.success) {
      return res.status(400).json({
        success: false,
        message: "Failed to get user details from casino API"
      });
    }
    
    // Get user hierarchy from casino API
    const isAgent = validatedData.userType === 'agent';
    const hierarchyInfo = await casino747Api.getUserHierarchy(validatedData.username, isAgent);
    
    return res.json({
      success: true,
      userDetails: {
        ...userDetails,
        topManager: hierarchyInfo.topManager,
        immediateManager: hierarchyInfo.immediateManager,
        userType: hierarchyInfo.userType
      }
    });
  } catch (error) {
    console.error('Error fetching user details from casino API:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "Invalid request data", errors: error.errors });
    }
    return res.status(500).json({ success: false, message: "Failed to fetch user details" });
  }
});

// Get user stats from casino API
router.get("/casino/user-stats/:username", async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({ success: false, message: "Username is required" });
    }
    
    // Get user from our database first
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Get user balance from casino API
    let casinoBalance = "0.00";
    let casinoDetails = null;
    
    try {
      if (user.casinoClientId) {
        const balanceResult = await casino747Api.getUserBalance(
          user.casinoClientId,
          user.casinoUsername || user.username
        );
        
        if (balanceResult && balanceResult.success) {
          casinoBalance = balanceResult.balance.toString();
          casinoDetails = balanceResult;
          
          // Update user's casino balance in our database
          await storage.updateUserCasinoBalance(user.id, parseFloat(casinoBalance));
        }
      }
    } catch (error) {
      console.error('Error fetching casino balance:', error);
      // Don't fail the entire request if casino API is down
    }
    
    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        balance: user.balance,
        casinoUsername: user.casinoUsername,
        casinoClientId: user.casinoClientId,
        casinoBalance,
        userType: user.userType || user.casinoUserType || 'user',
        topManager: user.topManager,
        immediateManager: user.immediateManager
      },
      casinoDetails
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return res.status(500).json({ success: false, message: "Failed to fetch user stats" });
  }
});

// Get casino balance
router.post("/casino/balance", async (req: Request, res: Response) => {
  try {
    const { username, casinoClientId } = req.body;
    
    if (!username || !casinoClientId) {
      return res.status(400).json({ success: false, message: "Username and casino client ID are required" });
    }
    
    // Get balance from casino API
    const balanceResult = await casino747Api.getUserBalance(
      casinoClientId,
      username
    );
    
    if (!balanceResult || !balanceResult.success) {
      return res.status(400).json({
        success: false,
        message: "Failed to get balance from casino API"
      });
    }
    
    // Check if user exists in our database
    const user = await storage.getUserByCasinoClientId(casinoClientId) || 
                 await storage.getUserByCasinoUsername(username) ||
                 await storage.getUserByUsername(username);
    
    // If user exists, update casino balance
    if (user) {
      await storage.updateUserCasinoBalance(user.id, parseFloat(balanceResult.balance.toString()));
    }
    
    return res.json({
      success: true,
      balance: balanceResult.balance.toString(),
      details: balanceResult
    });
  } catch (error) {
    console.error('Error fetching casino balance:', error);
    return res.status(500).json({ success: false, message: "Failed to fetch casino balance" });
  }
});

// Get real-time casino balance
router.post("/casino/balance-realtime", async (req: Request, res: Response) => {
  try {
    const { username, casinoClientId } = req.body;
    
    if (!username && !casinoClientId) {
      return res.status(400).json({ success: false, message: "Either username or casino client ID is required" });
    }
    
    // Find user by casino client ID or username
    let user;
    if (casinoClientId) {
      user = await storage.getUserByCasinoClientId(casinoClientId);
    }
    
    if (!user && username) {
      user = await storage.getUserByCasinoUsername(username) || 
             await storage.getUserByUsername(username);
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Get actual client ID and username
    const effectiveClientId = user.casinoClientId;
    const effectiveUsername = user.casinoUsername || user.username;
    
    if (!effectiveClientId) {
      return res.status(400).json({ success: false, message: "User has no casino client ID" });
    }
    
    // Get balance from casino API
    const balanceResult = await casino747Api.getUserBalance(
      effectiveClientId,
      effectiveUsername
    );
    
    if (!balanceResult || !balanceResult.success) {
      return res.status(400).json({
        success: false,
        message: "Failed to get balance from casino API"
      });
    }
    
    // Update casino balance in our database
    await storage.updateUserCasinoBalance(user.id, parseFloat(balanceResult.balance.toString()));
    
    return res.json({
      success: true,
      userId: user.id,
      username: user.username,
      casinoUsername: effectiveUsername,
      casinoClientId: effectiveClientId,
      casinoBalance: balanceResult.balance.toString(),
      details: balanceResult
    });
  } catch (error) {
    console.error('Error fetching real-time casino balance:', error);
    return res.status(500).json({ success: false, message: "Failed to fetch real-time casino balance" });
  }
});

// Send message to user or manager
router.post("/casino/send-message", async (req: Request, res: Response) => {
  try {
    const { username, subject, message } = req.body;
    
    if (!username || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Username, subject, and message are required"
      });
    }
    
    // Send message through casino API
    const result = await casino747Api.sendMessage(username, subject, message);
    
    if (!result || !result.success) {
      return res.status(400).json({
        success: false,
        message: "Failed to send message through casino API"
      });
    }
    
    return res.json({
      success: true,
      message: "Message sent successfully",
      details: result
    });
  } catch (error) {
    console.error('Error sending message through casino API:', error);
    return res.status(500).json({ success: false, message: "Failed to send message" });
  }
});

// Get user hierarchy from casino API
router.post("/casino/user-hierarchy", async (req: Request, res: Response) => {
  try {
    const { username, isAgent } = req.body;
    
    if (!username) {
      return res.status(400).json({ success: false, message: "Username is required" });
    }
    
    // Get user hierarchy from casino API
    const hierarchyInfo = await casino747Api.getUserHierarchy(username, isAgent || false);
    
    if (!hierarchyInfo || !hierarchyInfo.success) {
      return res.status(400).json({
        success: false,
        message: "Failed to get user hierarchy from casino API"
      });
    }
    
    return res.json({
      success: true,
      hierarchy: hierarchyInfo
    });
  } catch (error) {
    console.error('Error fetching user hierarchy from casino API:', error);
    return res.status(500).json({ success: false, message: "Failed to fetch user hierarchy" });
  }
});

// Deposit to casino
router.post("/casino/deposit", authMiddleware, async (req: Request, res: Response) => {
  try {
    // Validate request
    const validatedData = casinoDepositSchema.parse(req.body);
    
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    
    // Check if user has enough balance
    const amount = parseFloat(validatedData.amount.toString());
    const currentBalance = parseFloat(user.balance.toString());
    
    if (currentBalance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
        currentBalance: currentBalance.toString(),
        requestedAmount: amount.toString()
      });
    }
    
    // Generate unique transaction ID and reference
    const uniqueId = `DEPOSIT-${randomUUID()}`;
    const reference = `DEP-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Create transaction record
    const transaction = await storage.createTransaction({
      userId: user.id,
      type: "casino_deposit",
      method: "wallet_transfer",
      amount: amount.toString(),
      status: "pending",
      uniqueId,
      paymentReference: reference,
      casinoUsername: validatedData.casinoUsername || user.casinoUsername || user.username,
      casinoClientId: validatedData.casinoClientId || user.casinoClientId,
      currency: validatedData.currency || "PHP",
      metadata: {
        initiatedAt: new Date().toISOString(),
        statusHistory: [{
          status: "pending",
          timestamp: new Date().toISOString(),
          note: "Casino deposit initiated"
        }]
      }
    });
    
    try {
      // Get effective casino details
      const effectiveCasinoClientId = validatedData.casinoClientId || user.casinoClientId;
      const effectiveCasinoUsername = validatedData.casinoUsername || user.casinoUsername || user.username;
      
      if (!effectiveCasinoClientId) {
        throw new Error("No casino client ID available");
      }
      
      // Complete topup through casino API
      const topupResult = await casino747CompleteTopup(
        effectiveCasinoClientId.toString(),
        amount,
        reference
      );
      
      // Update transaction status to completed
      await storage.updateTransactionStatus(transaction.id, "completed", undefined, {
        ...transaction.metadata,
        casinoTransferResult: topupResult,
        completedAt: new Date().toISOString()
      });
      
      // Add status history entry
      await storage.addStatusHistoryEntry(transaction.id, "completed", "Casino deposit completed successfully");
      
      // Update user balances
      const newBalance = currentBalance - amount;
      await storage.updateUserBalance(user.id, -amount); // Deduct from wallet balance
      
      // Update casino balance (add to casino balance)
      await storage.updateUserCasinoBalance(user.id, amount);
      
      // Record financial details
      await storage.recordTransactionFinancials(transaction.id, currentBalance, newBalance);
      
      // Complete the transaction
      await storage.completeTransaction(transaction.id);
      
      return res.json({
        success: true,
        message: "Funds transferred to casino account successfully",
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          status: "completed",
          reference,
          uniqueId,
          casinoUsername: effectiveCasinoUsername,
          casinoClientId: effectiveCasinoClientId,
          createdAt: transaction.createdAt,
          completedAt: new Date()
        },
        newCasinoBalance: (parseFloat(user.casinoBalance || "0") + amount).toString(),
        newBalance: newBalance.toString()
      });
    } catch (error) {
      // Update transaction status to failed
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      await storage.updateTransactionStatus(transaction.id, "failed", undefined, {
        ...transaction.metadata,
        error: errorMessage,
        failedAt: new Date().toISOString()
      });
      
      // Add status history entry
      await storage.addStatusHistoryEntry(transaction.id, "failed", `Casino deposit failed: ${errorMessage}`);
      
      console.error('Error processing casino deposit:', error);
      return res.status(500).json({
        success: false,
        message: "Failed to transfer funds to casino account",
        error: errorMessage,
        transactionId: transaction.id
      });
    }
  } catch (error) {
    console.error('Error processing casino deposit:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "Invalid request data", errors: error.errors });
    }
    return res.status(500).json({ success: false, message: "Failed to process casino deposit" });
  }
});

// DirectPay webhook handler
router.post("/webhook/directpay/payment", async (req: Request, res: Response) => {
  try {
    console.log("Received DirectPay webhook:", JSON.stringify(req.body, null, 2));
    
    const payload = req.body;
    
    // Extract reference from multiple possible fields based on DirectPay format
    // DirectPay may send refId, reference, or ref fields
    const reference = payload.refId || payload.reference || payload.ref;
    
    // Extract status from multiple possible fields
    // DirectPay may send status as 'status' or 'status' with values like 'FAILED', 'SUCCESS', etc.
    const status = payload.status;
    
    // Validate essential fields
    if (!reference || !status) {
      console.error("Invalid webhook payload: missing required fields (reference/status)");
      return res.status(400).json({ success: false, message: "Invalid webhook payload" });
    }
    
    console.log(`Processing DirectPay webhook with reference: ${reference}, status: ${status}`);
    
    // Find the QR payment by reference
    const qrPayment = await storage.getQrPaymentByReference(reference);
    
    if (!qrPayment) {
      console.error(`QR payment not found for reference: ${reference}`);
      return res.status(404).json({ success: false, message: "Payment not found" });
    }
    
    console.log(`Found QR payment with ID ${qrPayment.id} for user ${qrPayment.userId}`);
    
    // Map DirectPay status to our standardized gcashStatus
    const gcashStatus = mapDirectPayStatusToGcashStatus(payload.status);
    
    // Update QR payment status
    await storage.updateQrPaymentStatus(qrPayment.id, gcashStatus);
    
    // Get associated transaction
    const transaction = await storage.getTransaction(qrPayment.transactionId);
    
    if (!transaction) {
      console.error(`Transaction not found for QR payment: ${qrPayment.id}`);
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }
    
    console.log(`Found transaction ${transaction.id} with status ${transaction.status}`);
    
    // Only proceed if transaction is not already fully completed or failed
    if (transaction.status === "completed" || transaction.status === "failed") {
      console.log(`Transaction ${transaction.id} already has final status ${transaction.status}, not updating`);
      return res.json({
        success: true,
        message: `Transaction already has final status: ${transaction.status}`,
        alreadyProcessed: true
      });
    }
    
    // Get the current metadata or initialize if not present
    const metadata = transaction.metadata || {};
    
    // Update transaction metadata with new gcashStatus
    await storage.updateTransactionMetadata(transaction.id, {
      ...metadata,
      gcashStatus,
      directPayResponse: payload,
      gcashStatusUpdatedAt: new Date().toISOString()
    });
    
    // Determine the next transaction status based on dual-status tracking
    const casinoStatus = metadata.casinoStatus || "pending";
    const newTransactionStatus = determineTransactionStatus(gcashStatus, casinoStatus);
    
    // Update transaction status if it has changed
    if (newTransactionStatus !== transaction.status) {
      console.log(`Updating transaction ${transaction.id} status from ${transaction.status} to ${newTransactionStatus}`);
      await storage.updateTransactionStatus(transaction.id, newTransactionStatus);
      await storage.addStatusHistoryEntry(transaction.id, newTransactionStatus, 
        `Status updated based on GCash payment status: ${gcashStatus}`);
    }
    
    // If payment completed, update user balance and attempt casino transfer
    if (gcashStatus === "completed") {
      console.log(`GCash payment completed for transaction ${transaction.id}`);
      
      // Get the user
      const user = await storage.getUser(transaction.userId);
      
      if (user) {
        // Calculate new balance
        const amount = parseFloat(transaction.amount);
        const currentBalance = parseFloat(user.balance);
        const newBalance = currentBalance + amount;
        
        // Update user balance
        await storage.updateUserBalance(user.id, amount);
        
        // Record transaction financials
        await storage.recordTransactionFinancials(transaction.id, currentBalance, newBalance);
        
        console.log(`Updated user balance: ${currentBalance} -> ${newBalance}`);
        
        // Generate transaction timeline for UI display
        const timeline = generateTransactionTimeline({
          ...transaction,
          metadata: {
            ...metadata,
            gcashStatus,
            casinoStatus
          }
        });
        
        // Save timeline to transaction metadata
        await storage.updateTransactionMetadata(transaction.id, {
          ...metadata,
          gcashStatus,
          timeline
        });
        
        // Try to complete the casino transfer
        try {
          if (user.casinoClientId) {
            console.log(`Attempting casino transfer for user ${user.username} with casinoClientId ${user.casinoClientId}`);
            
            // Update casinoStatus to processing
            await storage.updateTransactionMetadata(transaction.id, {
              ...metadata,
              gcashStatus,
              casinoStatus: "processing",
              casinoTransferAttemptedAt: new Date().toISOString()
            });
            
            const topupResult = await casino747CompleteTopup(
              user.casinoClientId.toString(),
              amount,
              transaction.paymentReference || `QR-${qrPayment.id}`
            );
            
            // Update transaction with casino transfer result
            const updatedCasinoStatus = mapCasinoTransferStatusToCasinoStatus(topupResult.status || "completed");
            
            await storage.updateTransactionMetadata(transaction.id, {
              ...metadata,
              gcashStatus,
              casinoStatus: updatedCasinoStatus,
              casinoTransferResult: topupResult,
              casinoTransferCompletedAt: new Date().toISOString()
            });
            
            // Determine final transaction status
            const finalStatus = determineTransactionStatus(gcashStatus, updatedCasinoStatus);
            
            // Update the transaction status
            await storage.updateTransactionStatus(transaction.id, finalStatus);
            
            // Add status history entry
            await storage.addStatusHistoryEntry(transaction.id, finalStatus, 
              `Casino transfer ${updatedCasinoStatus}: ${topupResult.message || "Complete"}`);
            
            // Update user's casino balance if transfer was successful
            if (updatedCasinoStatus === "completed") {
              await storage.updateUserCasinoBalance(user.id, amount);
            }
            
            // Generate updated timeline
            const updatedTimeline = generateTransactionTimeline({
              ...transaction,
              metadata: {
                ...metadata,
                gcashStatus,
                casinoStatus: updatedCasinoStatus
              }
            });
            
            // Save updated timeline
            await storage.updateTransactionMetadata(transaction.id, {
              ...metadata,
              gcashStatus,
              casinoStatus: updatedCasinoStatus,
              timeline: updatedTimeline
            });
            
            console.log(`Casino transfer ${updatedCasinoStatus} for transaction ${transaction.id}`);
          } else {
            // No casino client ID, mark as pending transfer
            await storage.updateTransactionMetadata(transaction.id, {
              ...metadata,
              gcashStatus,
              casinoStatus: "no_casino_id",
              casinoTransferNotes: "User has no casino client ID"
            });
            
            // Generate updated timeline
            const updatedTimeline = generateTransactionTimeline({
              ...transaction,
              metadata: {
                ...metadata,
                gcashStatus,
                casinoStatus: "no_casino_id"
              }
            });
            
            // Save updated timeline
            await storage.updateTransactionMetadata(transaction.id, {
              ...metadata,
              gcashStatus,
              casinoStatus: "no_casino_id",
              timeline: updatedTimeline
            });
            
            console.log(`No casino client ID for user ${user.username}, marking transfer as pending`);
          }
        } catch (error) {
          // Casino transfer failed, but payment was successful
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // Update transaction with casino transfer failure
          await storage.updateTransactionMetadata(transaction.id, {
            ...metadata,
            gcashStatus,
            casinoStatus: "failed",
            casinoTransferError: errorMessage,
            casinoTransferAttemptedAt: new Date().toISOString()
          });
          
          // Determine final transaction status (partial success)
          const finalStatus = determineTransactionStatus(gcashStatus, "failed");
          
          // Update transaction status
          await storage.updateTransactionStatus(transaction.id, finalStatus);
          
          // Add status history entry
          await storage.addStatusHistoryEntry(transaction.id, finalStatus, 
            `Payment completed but casino transfer failed: ${errorMessage}`);
          
          // Generate updated timeline
          const updatedTimeline = generateTransactionTimeline({
            ...transaction,
            metadata: {
              ...metadata,
              gcashStatus,
              casinoStatus: "failed"
            }
          });
          
          // Save updated timeline
          await storage.updateTransactionMetadata(transaction.id, {
            ...metadata,
            gcashStatus,
            casinoStatus: "failed",
            timeline: updatedTimeline
          });
          
          console.error(`Casino transfer failed for transaction ${transaction.id}: ${errorMessage}`);
        }
      } else {
        console.error(`User not found for transaction ${transaction.id}`);
      }
    } else if (gcashStatus === "failed") {
      // Update transaction metadata with failure details
      await storage.updateTransactionMetadata(transaction.id, {
        ...metadata,
        gcashStatus,
        paymentFailedAt: new Date().toISOString(),
        directPayResponse: payload
      });
      
      // Generate timeline for UI display
      const timeline = generateTransactionTimeline({
        ...transaction,
        metadata: {
          ...metadata,
          gcashStatus,
          casinoStatus: metadata.casinoStatus || "pending"
        }
      });
      
      // Save timeline to transaction metadata
      await storage.updateTransactionMetadata(transaction.id, {
        ...metadata,
        gcashStatus,
        timeline
      });
      
      console.log(`Updated transaction ${transaction.id} gcashStatus to failed`);
    }
    
    // Always return success to DirectPay
    return res.json({
      success: true,
      message: "Webhook processed successfully",
      status: gcashStatus
    });
  } catch (error) {
    console.error('Error processing DirectPay webhook:', error);
    // Always return success to DirectPay to avoid retries
    return res.json({
      success: true,
      message: "Webhook received, but encountered processing error",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Helper function to complete casino topup
async function casino747CompleteTopup(casinoId: string, amount: number, reference: string) {
  try {
    console.log(`🎰 Casino747: Completing topup for casino ID ${casinoId} with amount ${amount} and reference ${reference}`);
    
    // Find the user by casino ID
    const user = await storage.getUserByCasinoClientId(parseInt(casinoId));
    console.log(`👤 Looking up user with casino client ID: ${casinoId}`, user ? 
      { found: true, username: user.username, casinoUsername: user.casinoUsername } : 
      { found: false });
    
    if (!user) {
      console.error(`❌ User with casino ID ${casinoId} not found`);
      throw new Error(`User with casino ID ${casinoId} not found`);
    }
    
    // If casinoUsername is not set but we have the username, use that 
    // This fixes the issue where users have casinoClientId but missing casinoUsername
    const effectiveCasinoUsername = user.casinoUsername || user.username;
    if (!effectiveCasinoUsername) {
      console.error(`❌ User with casino ID ${casinoId} has no username information`);
      throw new Error(`User with casino ID ${casinoId} has no username information`);
    }
    
    // If casinoUsername was missing, log this action
    if (!user.casinoUsername && user.username) {
      console.log(`⚠️ Using username "${user.username}" as fallback for missing casinoUsername`);
      
      // Mark this as a fallback case in transaction metadata
      try {
        // Find the associated transaction by reference
        const transaction = await storage.getTransactionByUniqueId(reference) || 
                          await storage.getTransactionByCasinoReference(reference);
        
        if (transaction) {
          // Update transaction metadata to indicate fallback was used
          await storage.updateTransactionMetadata(transaction.id, {
            ...(transaction.metadata as Record<string, any> || {}),
            usedUsernameFallback: true,
            fallbackDetails: {
              originalCasinoUsername: user.casinoUsername,
              usedUsername: user.username,
              timestamp: new Date().toISOString()
            }
          });
          console.log(`✅ Updated transaction ${transaction.id} with fallback metadata`);
        }
      } catch (err) {
        const metadataError = err as Error;
        console.warn(`⚠️ Could not update transaction metadata: ${metadataError.message}`);
      }
      
      // Try to automatically fix the user record for future transfers
      try {
        await storage.updateUserCasinoDetails(user.id, { 
          casinoUsername: user.username
        });
        console.log(`✅ Updated user record with casinoUsername = ${user.username}`);
      } catch (err) {
        const updateError = err as Error;
        console.warn(`⚠️ Could not update user record with casinoUsername: ${updateError.message}`);
      }
    }
    
    // Generate a unique nonce (using timestamp + random number)
    const nonce = `nonce_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // Create a detailed comment with nonce and DirectPay reference
    const comment = `An amount of ${amount} PHP has been deposited via DirectPay (ID: ${reference}). Nonce: ${nonce}. TMPay Web App Transaction.`;
    
    // Get the top manager for this user (use stored value or default to first allowed top manager)
    const topManager = user.topManager || 'Marcthepogi';
    console.log(`👑 Using top manager for transfer: ${topManager}`);
    
    console.log(`📝 Preparing casino transfer with params:`, {
      amount,
      clientId: parseInt(casinoId),
      username: effectiveCasinoUsername,
      currency: "PHP",
      fromUser: topManager, // Use top manager instead of system
      commentLength: comment.length,
      nonce
    });
    
    // Complete the topup using the Casino747 API's transfer funds function
    // Transfer from top manager to user instead of from system
    const transferResult = await casino747Api.transferFunds(
      amount,
      parseInt(casinoId),
      effectiveCasinoUsername,
      "PHP", // Use PHP currency for GCash deposits
      topManager, // Use top manager account to transfer funds
      comment
    );
    
    console.log(`✅ Casino747: Transfer completed successfully from ${topManager} to ${effectiveCasinoUsername}:`, {
      user: effectiveCasinoUsername,
      clientId: casinoId,
      amount,
      nonce,
      fromManager: topManager,
      transferResult: JSON.stringify(transferResult)
    });
    
    return {
      success: true,
      newBalance: transferResult.newBalance || amount,
      transactionId: transferResult.transactionId || `TXN${Math.floor(Math.random() * 10000000)}`,
      nonce: nonce,
      fromManager: topManager
    };
  } catch (error) {
    console.error('❌ Error completing topup with Casino747 API:', error);
    console.error('Error details:', {
      casinoId,
      amount,
      reference,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    // Try fallback with different top managers if the first one failed
    try {
      console.log('🔄 Attempting fallback with alternative top managers');
      const user = await storage.getUserByCasinoClientId(parseInt(casinoId));
      
      if (user) {
        // Use the username as fallback for casinoUsername if it's not set
        const effectiveCasinoUsername = user.casinoUsername || user.username;
        
        if (!effectiveCasinoUsername) {
          console.error('❌ User has no username or casinoUsername for fallback');
          throw new Error('User has no username or casinoUsername for fallback');
        }
        
        // If using username as fallback in the error handler, track this in metadata
        if (!user.casinoUsername && user.username) {
          console.log(`⚠️ [FALLBACK] Using username "${user.username}" as fallback for missing casinoUsername`);
          
          // Mark this as a fallback case in transaction metadata
          try {
            // Find the associated transaction by reference
            const transaction = await storage.getTransactionByUniqueId(reference) || 
                              await storage.getTransactionByCasinoReference(reference);
            
            if (transaction) {
              // Update transaction metadata to indicate fallback was used
              await storage.updateTransactionMetadata(transaction.id, {
                ...(transaction.metadata as Record<string, any> || {}),
                usedUsernameFallback: true,
                fallbackDetails: {
                  originalCasinoUsername: user.casinoUsername,
                  usedUsername: user.username,
                  timestamp: new Date().toISOString(),
                  fromErrorHandler: true
                }
              });
              console.log(`✅ Updated transaction ${transaction.id} with fallback metadata (from error handler)`);
            }
          } catch (err) {
            const metadataError = err as Error;
            console.warn(`⚠️ Could not update transaction metadata in error handler: ${metadataError.message}`);
          }
        }
        
        // List of allowed top managers to try
        const fallbackManagers = ['Marcthepogi', 'bossmarc747', 'teammarc'].filter(
          manager => manager !== user.topManager
        );
        
        for (const fallbackManager of fallbackManagers) {
          console.log(`🔄 Attempting fallback transfer with manager: ${fallbackManager}`);
          
          try {
            const fallbackNonce = `nonce_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
            const fallbackComment = `FALLBACK: An amount of ${amount} PHP has been deposited via DirectPay (ID: ${reference}). Nonce: ${fallbackNonce}.`;
            
            const fallbackResult = await casino747Api.transferFunds(
              amount,
              parseInt(casinoId),
              effectiveCasinoUsername,
              "PHP",
              fallbackManager,
              fallbackComment
            );
            
            console.log(`✅ Fallback transfer successful with manager ${fallbackManager}:`, fallbackResult);
            
            return {
              success: true,
              newBalance: fallbackResult.newBalance || amount,
              transactionId: fallbackResult.transactionId || `TXN${Math.floor(Math.random() * 10000000)}`,
              nonce: fallbackNonce,
              fromManager: fallbackManager,
              fallback: true
            };
          } catch (err) {
            const fallbackError = err as Error;
            console.error(`❌ Fallback with ${fallbackManager} failed:`, fallbackError.message);
            // Continue to next fallback manager
          }
        }
      }
    } catch (err) {
      const fallbackError = err as Error;
      console.error('❌ All fallback attempts failed:', fallbackError.message);
    }
    
    // Production error - don't use simulation fallbacks
    console.error(`[CASINO TRANSFER ERROR] All attempts to transfer funds to ${casinoId} failed`);
    throw new Error(`Failed to complete casino transfer after multiple attempts. Please try again later.`);
  }
}

export default router;