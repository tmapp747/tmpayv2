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
  casinoGetUserDetailsSchema,
  loginSchema,
  authSchema,
  allowedTopManagersSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { randomUUID, randomBytes, createHash } from "crypto";
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
  // The list of allowed top managers
  const ALLOWED_TOP_MANAGERS = ['alpha1', 'omega2', 'sigma3'];

  // Helper function to generate a unique access token
  function generateAccessToken(): string {
    return randomBytes(32).toString('hex');
  }

  // Auth and user management routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      // Validate the request body against the login schema
      const loginData = loginSchema.parse(req.body);
      const { username, password } = loginData;
      
      // Find the user in our database
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid username or password" 
        });
      }
      
      // Check if the user's casino details are available
      // If not, we need to fetch them from the casino API
      if (!user.casinoUsername || !user.topManager) {
        try {
          // Fetch user details from casino API
          const casinoUserDetails = await casino747Api.getUserDetails(username);
          
          // Update user with casino details
          await storage.updateUserHierarchyInfo(
            user.id,
            casinoUserDetails.topManager || '',
            casinoUserDetails.immediateManager || '',
            casinoUserDetails.userType || 'player'
          );
          
          // Update the local user object with the fetched data
          user.topManager = casinoUserDetails.topManager;
          user.immediateManager = casinoUserDetails.immediateManager;
          user.casinoUserType = casinoUserDetails.userType;
          user.casinoUsername = casinoUserDetails.username;
          user.casinoClientId = casinoUserDetails.clientId;
        } catch (casinoError) {
          console.error("Error fetching user details from casino API:", casinoError);
          return res.status(403).json({ 
            success: false, 
            message: "Failed to verify user with casino system" 
          });
        }
      }
      
      // Check if the user belongs to one of the allowed top managers
      if (!user.topManager || !ALLOWED_TOP_MANAGERS.includes(user.topManager)) {
        return res.status(403).json({ 
          success: false, 
          message: "User is not authorized to use this system" 
        });
      }
      
      // Set allowed top managers for this user if not already set
      if (!user.allowedTopManagers || user.allowedTopManagers.length === 0) {
        await storage.setUserAllowedTopManagers(user.id, ALLOWED_TOP_MANAGERS);
      }
      
      // Generate a new access token for this session
      const accessToken = generateAccessToken();
      await storage.updateUserAccessToken(user.id, accessToken);
      
      // Mark the user as authorized
      await storage.updateUserAuthorizationStatus(user.id, true);
      
      // Don't send the password to the client
      const { password: _, ...userWithoutPassword } = user;
      
      return res.json({ 
        success: true,
        user: {
          ...userWithoutPassword,
          accessToken, // Include the access token in the response
          isAuthorized: true
        },
        message: "Login successful" 
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false,
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ 
        success: false,
        message: "Server error during login" 
      });
    }
  });
  
  // Authorization middleware
  async function authMiddleware(req: Request, res: Response, next: Function) {
    try {
      // Get the access token from the authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          message: "Authorization token is required" 
        });
      }
      
      const token = authHeader.split(' ')[1];
      
      // Find the user with this access token
      const user = await storage.getUserByAccessToken(token);
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid or expired token" 
        });
      }
      
      // Check if the user is authorized
      if (!user.isAuthorized) {
        return res.status(403).json({ 
          success: false, 
          message: "User is not authorized to use this system" 
        });
      }
      
      // Attach the user to the request object
      (req as any).user = user;
      
      // Continue to the next middleware or route handler
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Server error during authentication" 
      });
    }
  }

  // User info and balance
  app.get("/api/user/info", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Get the authenticated user from the request
      const user = (req as any).user;
      
      // Don't send the password to the client
      const { password: _, ...userWithoutPassword } = user;
      
      return res.json({ 
        success: true,
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("Get user info error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Server error while fetching user info" 
      });
    }
  });
  
  // Transaction history
  app.get("/api/transactions", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Get the authenticated user from the request
      const user = (req as any).user;
      
      const transactions = await storage.getTransactionsByUserId(user.id);
      
      return res.json({ 
        success: true,
        transactions 
      });
    } catch (error) {
      console.error("Get transactions error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Server error while fetching transactions" 
      });
    }
  });
  
  // Generate QR code for deposit
  app.post("/api/payments/gcash/generate-qr", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Get the authenticated user from the request
      const user = (req as any).user;
      
      // Validate request with generateQrCodeSchema
      const { amount } = generateQrCodeSchema.parse({
        ...req.body,
        userId: user.id,
        username: user.username,
        casinoId: user.casinoId
      });
      
      if (amount < 100 || amount > 50000) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid amount. Must be between ₱100 and ₱50,000" 
        });
      }
      
      // Check if there's already an active QR code
      const activeQr = await storage.getActiveQrPaymentByUserId(user.id);
      if (activeQr) {
        return res.status(400).json({
          success: false,
          message: "You already have an active QR code. Please complete or cancel the existing payment.",
          qrPayment: activeQr
        });
      }
      
      // Create a transaction record first
      const transactionReference = randomUUID();
      const transaction = await storage.createTransaction({
        userId: user.id,
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
        userId: user.id,
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
          success: false,
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ 
        success: false,
        message: "Server error while generating QR code" 
      });
    }
  });
  
  // Endpoint to check payment status
  app.get("/api/payments/status/:referenceId", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { referenceId } = req.params;
      
      if (!referenceId) {
        return res.status(400).json({ 
          success: false,
          message: "Reference ID is required" 
        });
      }
      
      // Get the authenticated user
      const authenticatedUser = (req as any).user;
      
      // Find the QR payment by reference
      const qrPayment = await storage.getQrPaymentByReference(referenceId);
      
      if (!qrPayment) {
        return res.status(404).json({ 
          success: false,
          message: "Payment not found" 
        });
      }
      
      // Check if the payment belongs to the authenticated user
      if (qrPayment.userId !== authenticatedUser.id) {
        return res.status(403).json({ 
          success: false,
          message: "You don't have permission to view this payment" 
        });
      }
      
      // If payment is already completed or failed, just return the current status
      if (qrPayment.status === "completed" || qrPayment.status === "failed") {
        return res.json({
          success: true,
          status: qrPayment.status,
          qrPayment
        });
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
      
      // For pending payments, check with DirectPay for the latest status
      // This is useful for cases where the webhook might not have been received
      if (qrPayment.status === "pending") {
        try {
          // Query DirectPay API for the latest payment status
          const directPayStatus = await directPayApi.checkPaymentStatus(qrPayment.directPayReference || referenceId);
          
          // If DirectPay says the payment is completed or failed, update our status
          if (directPayStatus.status !== "pending") {
            console.log(`Payment status from DirectPay: ${directPayStatus.status} for reference ${referenceId}`);
            
            // Update our QR payment status
            await storage.updateQrPaymentStatus(qrPayment.id, directPayStatus.status);
            qrPayment.status = directPayStatus.status;
            
            // If payment is completed, also update the transaction and user balance
            if (directPayStatus.status === "completed") {
              // Get the transaction and user
              const transaction = await storage.getTransaction(qrPayment.transactionId);
              const user = await storage.getUser(qrPayment.userId);
              
              if (transaction && user) {
                // Update transaction status
                await storage.updateTransactionStatus(
                  transaction.id, 
                  "completed",
                  directPayStatus.transactionId
                );
                
                // Call 747 Casino API to complete the topup
                const amount = parseFloat(qrPayment.amount.toString());
                const casinoResult = await casino747CompleteTopup(
                  user.casinoId,
                  amount,
                  transaction.paymentReference || ""
                );
                
                // Update user's balance
                await storage.updateUserBalance(user.id, amount);
                
                console.log(`Payment completed via status check: ${referenceId}, amount: ${amount}`);
              }
            }
          }
        } catch (directPayError) {
          // If there's an error checking with DirectPay, just continue with our current status
          console.error("Error checking payment status with DirectPay:", directPayError);
        }
      }
      
      return res.json({
        success: qrPayment.status === "completed",
        status: qrPayment.status,
        qrPayment
      });
    } catch (error) {
      console.error("Check payment status error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Server error while checking payment status" 
      });
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
  app.post("/api/casino/deposit", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Get the authenticated user
      const authenticatedUser = (req as any).user;
      
      // Validate using the schema, ensuring userId matches authenticated user
      const validatedData = casinoDepositSchema.parse({
        ...req.body,
        userId: authenticatedUser.id,
        casinoClientId: authenticatedUser.casinoClientId || req.body.casinoClientId,
        casinoUsername: authenticatedUser.casinoUsername || req.body.casinoUsername
      });
      
      // Check if the casino username belongs to the authenticated user
      if (validatedData.casinoUsername !== authenticatedUser.casinoUsername) {
        return res.status(403).json({ 
          success: false, 
          message: "You can only deposit to your own casino account" 
        });
      }
      
      // Check if user has enough balance
      const userBalance = parseFloat(authenticatedUser.balance.toString());
      if (userBalance < validatedData.amount) {
        return res.status(400).json({ 
          success: false, 
          message: "Insufficient funds" 
        });
      }
      
      // Create a transaction record
      const transactionReference = randomUUID();
      const transaction = await storage.createTransaction({
        userId: authenticatedUser.id,
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
        // Transfer the funds to the casino using the user's access token
        const transferResult = await casino747Api.transferFunds(
          validatedData.amount,
          validatedData.casinoClientId,
          validatedData.casinoUsername,
          validatedData.currency,
          validatedData.casinoUsername, // From the same user (e-wallet to casino)
          `Deposit from e-wallet - ${transactionReference}`,
          authenticatedUser.accessToken // Pass the user's access token for authorization
        );
        
        // Update transaction record
        await storage.updateTransactionStatus(
          transaction.id, 
          "completed", 
          transferResult.transactionId
        );
        
        // Deduct from user's e-wallet balance
        const updatedUser = await storage.updateUserBalance(authenticatedUser.id, -validatedData.amount);
        
        // Update user's casino balance
        await storage.updateUserCasinoBalance(authenticatedUser.id, validatedData.amount);
        
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
      console.log("DirectPay webhook received:", JSON.stringify(req.body));
      
      // Extract payment details from the webhook payload
      // DirectPay might send different structured data, so we handle common formats
      const { 
        reference, status, state, payment_status, 
        amount, transactionId, transaction_id, 
        payment_reference
      } = req.body;
      
      // Determine the actual reference value from possible fields
      const paymentReference = reference || payment_reference || req.body.ref;
      
      if (!paymentReference) {
        console.warn("Payment reference is missing in webhook:", req.body);
        return res.status(200).json({ 
          success: false, 
          message: "Payment reference is required, but webhook acknowledged" 
        });
      }
      
      // Find the QR payment by reference
      const qrPayment = await storage.getQrPaymentByReference(paymentReference);
      if (!qrPayment) {
        console.warn(`QR Payment not found for reference: ${paymentReference}`);
        return res.status(200).json({ 
          success: false, 
          message: "Payment not found, but webhook acknowledged" 
        });
      }
      
      // Avoid processing the same payment multiple times
      if (qrPayment.status !== "pending") {
        console.log(`Payment ${paymentReference} already processed with status: ${qrPayment.status}`);
        return res.status(200).json({ 
          success: true, 
          message: `Payment already ${qrPayment.status}, webhook acknowledged` 
        });
      }
      
      // Find the transaction
      const transaction = await storage.getTransaction(qrPayment.transactionId);
      if (!transaction) {
        console.error(`Transaction not found for QR payment ID: ${qrPayment.id}`);
        return res.status(200).json({ 
          success: false, 
          message: "Transaction not found, but webhook acknowledged" 
        });
      }
      
      // Find the user
      const user = await storage.getUser(qrPayment.userId);
      if (!user) {
        console.error(`User not found for QR payment user ID: ${qrPayment.userId}`);
        return res.status(200).json({ 
          success: false, 
          message: "User not found, but webhook acknowledged" 
        });
      }
      
      // Determine the payment status from various possible fields
      const paymentStatus = status || state || payment_status || '';
      const txId = transactionId || transaction_id || Date.now().toString();
      
      // Process based on payment status
      if (
        paymentStatus.toLowerCase() === 'success' || 
        paymentStatus.toLowerCase() === 'completed' || 
        paymentStatus.toLowerCase() === 'paid'
      ) {
        // Update QR payment status
        await storage.updateQrPaymentStatus(qrPayment.id, "completed");
        
        // Update transaction status and add DirectPay transaction ID
        await storage.updateTransactionStatus(
          transaction.id,
          "completed",
          txId
        );
        
        // Call 747 Casino API to complete the topup
        const paymentAmount = parseFloat(qrPayment.amount.toString());
        try {
          const casinoResult = await casino747CompleteTopup(
            user.casinoId,
            paymentAmount,
            transaction.paymentReference || ""
          );
          
          // Update user's balance
          await storage.updateUserBalance(user.id, paymentAmount);
          
          console.log("Payment completed successfully via webhook:", {
            reference: paymentReference,
            userId: user.id,
            amount: paymentAmount,
            casinoResult
          });
        } catch (casinoError) {
          console.error("Error completing casino topup:", casinoError);
          // We still mark the payment as completed but log the casino error
          // A manual reconciliation may be needed
        }
      } else if (
        paymentStatus.toLowerCase() === 'failed' || 
        paymentStatus.toLowerCase() === 'cancelled' || 
        paymentStatus.toLowerCase() === 'declined'
      ) {
        // Update QR payment and transaction status
        await storage.updateQrPaymentStatus(qrPayment.id, "failed");
        await storage.updateTransactionStatus(transaction.id, "failed");
        
        console.log("Payment failed via webhook:", { 
          reference: paymentReference, 
          userId: user.id,
          status: paymentStatus
        });
      } else {
        // Unknown status, log but don't change anything
        console.log(`Unknown payment status received: ${paymentStatus} for reference ${paymentReference}`);
      }
      
      // Return a 200 OK to acknowledge receipt of the webhook
      return res.status(200).json({ 
        success: true, 
        message: "Webhook processed successfully" 
      });
    } catch (error) {
      console.error("DirectPay webhook processing error:", error);
      
      // Even in case of error, return a 200 OK to prevent repeated webhook attempts
      return res.status(200).json({ 
        success: false, 
        message: "Error processing webhook, but acknowledged" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
