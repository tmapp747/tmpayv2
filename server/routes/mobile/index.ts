import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware";
import { storage } from "../../storage";
import { z } from "zod";
import { randomUUID } from "crypto";

// APIs for integrations
import { directPayApi } from "../../directPayApi";
import { casino747Api } from "../../casino747Api";
import { paygramApi } from "../../paygramApi";

// Schemas
import {
  generateQrCodeSchema,
  generateTelegramPaymentSchema,
  manualPaymentSchema,
  updatePreferredCurrencySchema,
  getCurrencyBalanceSchema,
  exchangeCurrencySchema,
  supportedCurrencies,
  Currency
} from "@shared/schema";

// Helper functions
async function directPayGenerateQRCode(amount: number, reference: string, username: string) {
  try {
    // Use dynamic host detection for proper redirection
    const baseUrl = process.env.BASE_URL || `https://${process.env.REPLIT_HOSTNAME || 'localhost:5000'}`;
    const webhook = `${baseUrl}/api/webhook/directpay/payment`;
    // Updated to a more comprehensive thank you page with transaction details
    const redirectUrl = `${baseUrl}/payment/thank-you?reference=${reference}&amount=${amount}&username=${encodeURIComponent(username)}`;
    
    console.log(`Generating DirectPay GCash payment with the following parameters:`);
    console.log(`- Amount: ${amount}`);
    console.log(`- Reference: ${reference}`);
    console.log(`- Webhook: ${webhook}`);
    console.log(`- Redirect URL: ${redirectUrl}`);
    
    // Maximum retries for API call
    const maxRetries = 3;
    let result = null;
    let error = null;
    
    // Try up to maxRetries times with exponential backoff
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Call the DirectPay API to generate a GCash payment link
        result = await directPayApi.generateGCashQR(amount, webhook, redirectUrl);
        
        // If successful, break out of retry loop
        if (result && result.payUrl) {
          console.log(`DirectPay API call successful on attempt ${attempt}`);
          break;
        }
      } catch (e) {
        error = e;
        console.error(`DirectPay API call failed on attempt ${attempt}:`, e);
        
        // If this is not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If all attempts failed, throw the last error
    if (!result && error) {
      throw error;
    }
    
    // If we still don't have a result, throw a generic error
    if (!result) {
      throw new Error('No valid response received from DirectPay API after multiple attempts');
    }
    
    console.log('DirectPay API Response:', JSON.stringify(result, null, 2));
    
    // Extract response data
    const qrCodeData = result.qrCodeData;
    const directPayReference = result.reference || reference;
    const payUrl = result.payUrl;
    const expiresAt = result.expiresAt || new Date(Date.now() + 30 * 60 * 1000);
    
    console.log(`Successfully generated payment link with DirectPay reference: ${directPayReference}`);
    
    return {
      qrCodeData,
      directPayReference,
      payUrl,
      expiresAt
    };
  } catch (error) {
    console.error('Error generating payment form/QR code with DirectPay API:', error);
    
    // Since we're in production, we don't want to use fallbacks. Instead, throw an error
    // that will be handled by the calling code.
    throw new Error('Failed to generate payment form with DirectPay API');
  }
}

// Helper function to generate a unique transaction reference
function generateTransactionReference(username?: string): string {
  const userPrefix = username ? username.toUpperCase() : 'TX';
  return `${userPrefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// Create mobile router for user-facing features
const router = Router();

// User info endpoint - core mobile feature
router.get("/user/info", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    
    // Return user data without sensitive fields
    const userResponse = {
      id: user.id,
      username: user.username,
      balance: user.balance.toString(),
      pendingBalance: user.pendingBalance?.toString() || "0.00",
      casinoUsername: user.casinoUsername,
      casinoBalance: user.casinoBalance?.toString() || "0.00",
      casinoClientId: user.casinoClientId,
      isAuthorized: user.isAuthorized,
      userType: user.userType || user.casinoUserType || 'user',
      preferredCurrency: user.preferredCurrency || 'PHP',
      topManager: user.topManager,
      immediateManager: user.immediateManager,
      currencyBalances: {
        PHP: user.balancePHP?.toString() || user.balance.toString(),
        PHPT: user.balancePHPT?.toString() || "0.00",
        USDT: user.balanceUSDT?.toString() || "0.00"
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    return res.json({ success: true, user: userResponse });
  } catch (error) {
    console.error('Error fetching user info:', error);
    return res.status(500).json({ success: false, message: "Failed to fetch user information" });
  }
});

// Get supported currencies
router.get("/currencies", authMiddleware, (req: Request, res: Response) => {
  try {
    return res.json({ success: true, currencies: supportedCurrencies });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return res.status(500).json({ success: false, message: "Failed to fetch supported currencies" });
  }
});

// Get user currency balances
router.get("/user/currency-balances", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    
    const currencyBalances = {
      PHP: user.balancePHP?.toString() || user.balance.toString(),
      PHPT: user.balancePHPT?.toString() || "0.00",
      USDT: user.balanceUSDT?.toString() || "0.00"
    };
    
    return res.json({ success: true, balances: currencyBalances, preferredCurrency: user.preferredCurrency || 'PHP' });
  } catch (error) {
    console.error('Error fetching currency balances:', error);
    return res.status(500).json({ success: false, message: "Failed to fetch currency balances" });
  }
});

// Get user preferences
router.get("/user/preferences/:key", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    
    const preference = await storage.getUserPreference(userId, key);
    
    if (!preference) {
      // Return a default value for theme if not found
      if (key === 'theme') {
        return res.json({ success: true, key: 'theme', value: 'dark' });
      }
      return res.json({ success: false, message: "Preference not found" });
    }
    
    return res.json({ success: true, key: preference.key, value: preference.value });
  } catch (error) {
    console.error(`Error fetching user preference for ${req.params.key}:`, error);
    return res.status(500).json({ success: false, message: "Failed to fetch user preference" });
  }
});

// Update user preferences
router.post("/user/preferences/:key", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    
    // Validate that we received a value
    if (value === undefined) {
      return res.status(400).json({ success: false, message: "Value is required" });
    }
    
    // Create or update the preference
    const preference = await storage.updateUserPreference(userId, key, value);
    
    return res.json({ success: true, key: preference.key, value: preference.value });
  } catch (error) {
    console.error(`Error updating user preference for ${req.params.key}:`, error);
    return res.status(500).json({ success: false, message: "Failed to update user preference" });
  }
});

// Update preferred currency
router.post("/user/preferred-currency", authMiddleware, async (req: Request, res: Response) => {
  try {
    const validatedData = updatePreferredCurrencySchema.parse(req.body);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    
    // Update user's preferred currency
    const updatedUser = await storage.updatePreferredCurrency(userId, validatedData.currency);
    
    const currencyBalances = {
      PHP: updatedUser.balancePHP?.toString() || updatedUser.balance.toString(),
      PHPT: updatedUser.balancePHPT?.toString() || "0.00",
      USDT: updatedUser.balanceUSDT?.toString() || "0.00"
    };
    
    return res.json({
      success: true,
      message: `Preferred currency updated to ${validatedData.currency}`,
      preferredCurrency: updatedUser.preferredCurrency,
      balances: currencyBalances
    });
  } catch (error) {
    console.error('Error updating preferred currency:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "Invalid request data", errors: error.errors });
    }
    return res.status(500).json({ success: false, message: "Failed to update preferred currency" });
  }
});

// Currency exchange endpoint
router.post("/currency/exchange", authMiddleware, async (req: Request, res: Response) => {
  try {
    // Validate the request data
    const validatedData = exchangeCurrencySchema.parse(req.body);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    
    // Get current balances before exchange
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const fromCurrency = validatedData.fromCurrency;
    const toCurrency = validatedData.toCurrency;
    const amount = parseFloat(validatedData.amount);
    
    // Check if user has sufficient balance
    const currentBalance = await storage.getUserCurrencyBalance(userId, fromCurrency);
    if (parseFloat(currentBalance) < amount) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient ${fromCurrency} balance`,
        currentBalance
      });
    }
    
    console.log(`Processing currency exchange for user ${userId}:`);
    console.log(`- From: ${amount} ${fromCurrency}`);
    console.log(`- To: ${toCurrency}`);
    
    // Perform the exchange
    const updatedUser = await storage.exchangeCurrency(userId, fromCurrency, toCurrency, amount);
    
    // Return updated balances
    const currencyBalances = {
      PHP: updatedUser.balancePHP?.toString() || updatedUser.balance.toString(),
      PHPT: updatedUser.balancePHPT?.toString() || "0.00",
      USDT: updatedUser.balanceUSDT?.toString() || "0.00"
    };
    
    // Create a transaction record for this exchange
    const transaction = await storage.createTransaction({
      userId,
      type: "exchange",
      method: "internal",
      amount: amount.toString(),
      status: "completed",
      uniqueId: `EX-${randomUUID()}`,
      currency: fromCurrency,
      description: `Exchange ${amount} ${fromCurrency} to ${toCurrency}`,
      metadata: {
        fromCurrency,
        toCurrency,
        exchangeRate: validatedData.rate || 1,
        completedAt: new Date().toISOString()
      }
    });
    
    return res.json({
      success: true,
      message: `Successfully exchanged ${amount} ${fromCurrency} to ${toCurrency}`,
      balances: currencyBalances,
      preferredCurrency: updatedUser.preferredCurrency,
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        createdAt: transaction.createdAt
      }
    });
  } catch (error) {
    console.error('Error exchanging currency:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "Invalid request data", errors: error.errors });
    }
    return res.status(500).json({ success: false, message: "Failed to exchange currency" });
  }
});

// Get user transactions
router.get("/transactions", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    
    // Get query parameters for filtering
    const { limit = '10', offset = '0', type, method, status } = req.query;
    
    // Get transactions from storage
    const transactions = await storage.getTransactionsByUserId(userId, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      type: type as string,
      method: method as string,
      status: status as string
    });
    
    return res.json({ success: true, transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
});

// Get transaction by ID
router.get("/transactions/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const transactionId = parseInt(req.params.id);
    if (isNaN(transactionId)) {
      return res.status(400).json({ success: false, message: "Invalid transaction ID" });
    }
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    
    // Get transaction from storage
    const transaction = await storage.getTransaction(transactionId);
    
    // Check if transaction exists and belongs to the user
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }
    
    if (transaction.userId !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to view this transaction" });
    }
    
    // If it's a QR payment, get additional details
    let qrPayment;
    if (transaction.method === 'gcash_qr') {
      qrPayment = await storage.getQrPaymentByReference(transaction.paymentReference || '');
    }
    
    // If it's a Telegram payment, get additional details
    let telegramPayment;
    if (transaction.method === 'telegram') {
      telegramPayment = await storage.getTelegramPaymentByReference(transaction.paymentReference || '');
    }
    
    // If it's a manual payment, get additional details
    let manualPayment;
    if (transaction.method === 'manual') {
      manualPayment = await storage.getManualPaymentByReference(transaction.paymentReference || '');
    }
    
    return res.json({
      success: true,
      transaction,
      qrPayment,
      telegramPayment,
      manualPayment
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return res.status(500).json({ success: false, message: "Failed to fetch transaction details" });
  }
});

// Generate GCash QR code for payment
router.post("/payments/gcash/generate-qr", authMiddleware, async (req: Request, res: Response) => {
  try {
    // Validate the request data
    const validatedData = generateQrCodeSchema.parse(req.body);
    const amount = parseFloat(validatedData.amount);
    
    let user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    
    // Check if user already has an active QR payment
    const activeQr = await storage.getActiveQrPaymentByUserId(user.id);
    if (activeQr) {
      return res.json({
        success: true,
        message: "Active QR payment found",
        qrPayment: activeQr,
        isExisting: true
      });
    }
    
    // Generate a unique reference for this payment
    const reference = generateTransactionReference(user.username);
    console.log(`Generating QR code with reference: ${reference}`);
    
    // Create transaction record
    const transaction = await storage.createTransaction({
      userId: user.id,
      type: "deposit",
      method: "gcash_qr",
      amount: amount.toString(),
      status: "pending",
      paymentReference: reference,
      uniqueId: `GCash-${randomUUID()}`,
      currency: "PHP",
      metadata: {
        initiatedAt: new Date().toISOString(),
        autoLogin: validatedData.autoLogin || false,
        anonymous: validatedData.anonymous || false,
        statusHistory: [{
          status: "pending",
          timestamp: new Date().toISOString(),
          note: "Transaction created"
        }]
      }
    });
    
    console.log(`Created transaction record with ID: ${transaction.id}`);
    
    // Generate QR code with DirectPay API
    const qrResult = await directPayGenerateQRCode(amount, reference, user.username);
    
    // Create QR payment record
    const qrPayment = await storage.createQrPayment({
      userId: user.id,
      transactionId: transaction.id,
      qrCode: qrResult.qrCodeData,
      amount: amount.toString(),
      reference: reference,
      directPayReference: qrResult.directPayReference,
      payUrl: qrResult.payUrl,
      expiresAt: qrResult.expiresAt,
      status: "pending"
    });
    
    console.log(`Created QR payment record with ID: ${qrPayment.id}`);
    
    return res.json({
      success: true,
      message: "GCash QR code generated successfully",
      qrPayment,
      transactionId: transaction.id,
      reference
    });
  } catch (error) {
    console.error('Error generating GCash QR code:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "Invalid request data", errors: error.errors });
    }
    return res.status(500).json({ success: false, message: "Failed to generate GCash QR code" });
  }
});

// Check payment status
router.get("/payments/status/:referenceId", async (req: Request, res: Response) => {
  try {
    const { referenceId } = req.params;
    
    // First try to find it as a QR payment
    let qrPayment = await storage.getQrPaymentByReference(referenceId);
    
    if (qrPayment) {
      // Get associated transaction
      const transaction = await storage.getTransaction(qrPayment.transactionId);
      
      return res.json({
        success: true,
        status: qrPayment.status,
        paymentType: "gcash_qr",
        qrPayment,
        transaction
      });
    }
    
    // Then try as a telegram payment
    let telegramPayment = await storage.getTelegramPaymentByReference(referenceId);
    
    if (telegramPayment) {
      // Get associated transaction
      const transaction = await storage.getTransaction(telegramPayment.transactionId);
      
      return res.json({
        success: true,
        status: telegramPayment.status,
        paymentType: "telegram",
        telegramPayment,
        transaction
      });
    }
    
    // Finally try as a manual payment
    let manualPayment = await storage.getManualPaymentByReference(referenceId);
    
    if (manualPayment) {
      // Get associated transaction
      const transaction = await storage.getTransaction(manualPayment.transactionId);
      
      return res.json({
        success: true,
        status: manualPayment.status,
        paymentType: "manual",
        manualPayment,
        transaction
      });
    }
    
    // If we reach here, no payment was found
    return res.status(404).json({
      success: false,
      message: "Payment not found"
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    return res.status(500).json({ success: false, message: "Failed to check payment status" });
  }
});

// Get active QR payment
router.get("/payments/active-qr", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    
    // Get active QR payment for user
    const activeQr = await storage.getActiveQrPaymentByUserId(userId);
    
    if (!activeQr) {
      return res.json({
        success: false,
        message: "No active QR payment found"
      });
    }
    
    return res.json({
      success: true,
      qrPayment: activeQr
    });
  } catch (error) {
    console.error('Error fetching active QR payment:', error);
    return res.status(500).json({ success: false, message: "Failed to fetch active QR payment" });
  }
});

// Create a manual payment
router.post("/payments/manual/create", authMiddleware, async (req: Request, res: Response) => {
  try {
    // Validate request
    const validatedData = manualPaymentSchema.parse(req.body);
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    
    // Check if user already has an active manual payment
    const activeManualPayment = await storage.getActiveManualPaymentByUserId(userId);
    if (activeManualPayment) {
      return res.json({
        success: true,
        message: "Active manual payment found",
        manualPayment: activeManualPayment,
        isExisting: true
      });
    }
    
    // Generate a unique reference for this payment
    const reference = generateTransactionReference(req.user?.username);
    
    // Create transaction record
    const transaction = await storage.createTransaction({
      userId,
      type: "deposit",
      method: "manual",
      amount: validatedData.amount,
      status: "pending",
      paymentReference: reference,
      uniqueId: `Manual-${randomUUID()}`,
      currency: validatedData.currency || "PHP",
      metadata: {
        initiatedAt: new Date().toISOString(),
        paymentMethodId: validatedData.paymentMethodId,
        notes: validatedData.notes,
        statusHistory: [{
          status: "pending",
          timestamp: new Date().toISOString(),
          note: "Manual payment created"
        }]
      }
    });
    
    // Create manual payment record
    const manualPayment = await storage.createManualPayment({
      userId,
      transactionId: transaction.id,
      amount: validatedData.amount,
      reference,
      status: "pending",
      paymentMethodId: validatedData.paymentMethodId,
      paymentMethodName: validatedData.paymentMethodName,
      senderName: validatedData.senderName,
      senderAccount: validatedData.senderAccount,
      notes: validatedData.notes,
      currency: validatedData.currency || "PHP",
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
    });
    
    return res.json({
      success: true,
      message: "Manual payment created successfully",
      manualPayment,
      transactionId: transaction.id,
      reference
    });
  } catch (error) {
    console.error('Error creating manual payment:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "Invalid request data", errors: error.errors });
    }
    return res.status(500).json({ success: false, message: "Failed to create manual payment" });
  }
});

// Complete a manual payment with proof of payment
router.post("/payments/complete-manual/:reference", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    const { proofImageUrl } = req.body;
    
    if (!proofImageUrl) {
      return res.status(400).json({ success: false, message: "Proof image URL is required" });
    }
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    
    // Find the manual payment
    const manualPayment = await storage.getManualPaymentByReference(reference);
    
    if (!manualPayment) {
      return res.status(404).json({ success: false, message: "Manual payment not found" });
    }
    
    if (manualPayment.userId !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to update this payment" });
    }
    
    if (manualPayment.status !== "pending") {
      return res.status(400).json({ success: false, message: `Cannot update payment with status: ${manualPayment.status}` });
    }
    
    // Upload proof image
    const updatedManualPayment = await storage.uploadManualPaymentReceipt(manualPayment.id, proofImageUrl);
    
    // Update the transaction status to "proof_submitted"
    const transaction = await storage.getTransaction(manualPayment.transactionId);
    if (transaction) {
      await storage.updateTransactionStatus(transaction.id, "proof_submitted", undefined, {
        ...transaction.metadata,
        proofSubmittedAt: new Date().toISOString(),
        proofImageUrl
      });
      
      // Add status history entry
      await storage.addStatusHistoryEntry(transaction.id, "proof_submitted", "Customer submitted proof of payment");
    }
    
    return res.json({
      success: true,
      message: "Proof of payment submitted successfully",
      manualPayment: updatedManualPayment
    });
  } catch (error) {
    console.error('Error uploading proof of payment:', error);
    return res.status(500).json({ success: false, message: "Failed to upload proof of payment" });
  }
});

// Cancel a payment
router.post("/payments/cancel/:referenceId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { referenceId } = req.params;
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    
    // First try to find and cancel a QR payment
    let qrPayment = await storage.getQrPaymentByReference(referenceId);
    if (qrPayment && qrPayment.userId === userId) {
      if (qrPayment.status !== "pending") {
        return res.status(400).json({ success: false, message: `Cannot cancel payment with status: ${qrPayment.status}` });
      }
      
      // Update QR payment status
      const updatedQrPayment = await storage.updateQrPaymentStatus(qrPayment.id, "cancelled");
      
      // Update transaction status
      const transaction = await storage.getTransaction(qrPayment.transactionId);
      if (transaction) {
        await storage.updateTransactionStatus(transaction.id, "cancelled", undefined, {
          ...transaction.metadata,
          cancelledAt: new Date().toISOString(),
          cancelledBy: "user"
        });
        
        // Add status history entry
        await storage.addStatusHistoryEntry(transaction.id, "cancelled", "Cancelled by user");
      }
      
      return res.json({
        success: true,
        message: "QR payment cancelled successfully",
        qrPayment: updatedQrPayment
      });
    }
    
    // Try to find and cancel a Telegram payment
    let telegramPayment = await storage.getTelegramPaymentByReference(referenceId);
    if (telegramPayment && telegramPayment.userId === userId) {
      if (telegramPayment.status !== "pending") {
        return res.status(400).json({ success: false, message: `Cannot cancel payment with status: ${telegramPayment.status}` });
      }
      
      // Update Telegram payment status
      const updatedTelegramPayment = await storage.updateTelegramPaymentStatus(telegramPayment.id, "cancelled");
      
      // Update transaction status
      const transaction = await storage.getTransaction(telegramPayment.transactionId);
      if (transaction) {
        await storage.updateTransactionStatus(transaction.id, "cancelled", undefined, {
          ...transaction.metadata,
          cancelledAt: new Date().toISOString(),
          cancelledBy: "user"
        });
        
        // Add status history entry
        await storage.addStatusHistoryEntry(transaction.id, "cancelled", "Cancelled by user");
      }
      
      return res.json({
        success: true,
        message: "Telegram payment cancelled successfully",
        telegramPayment: updatedTelegramPayment
      });
    }
    
    // Try to find and cancel a Manual payment
    let manualPayment = await storage.getManualPaymentByReference(referenceId);
    if (manualPayment && manualPayment.userId === userId) {
      if (manualPayment.status !== "pending") {
        return res.status(400).json({ success: false, message: `Cannot cancel payment with status: ${manualPayment.status}` });
      }
      
      // Update Manual payment status
      const updatedManualPayment = await storage.updateManualPaymentStatus(manualPayment.id, "cancelled");
      
      // Update transaction status
      const transaction = await storage.getTransaction(manualPayment.transactionId);
      if (transaction) {
        await storage.updateTransactionStatus(transaction.id, "cancelled", undefined, {
          ...transaction.metadata,
          cancelledAt: new Date().toISOString(),
          cancelledBy: "user"
        });
        
        // Add status history entry
        await storage.addStatusHistoryEntry(transaction.id, "cancelled", "Cancelled by user");
      }
      
      return res.json({
        success: true,
        message: "Manual payment cancelled successfully",
        manualPayment: updatedManualPayment
      });
    }
    
    // If we reach here, no payment was found or user not authorized
    return res.status(404).json({
      success: false,
      message: "Payment not found or you are not authorized to cancel it"
    });
  } catch (error) {
    console.error('Error cancelling payment:', error);
    return res.status(500).json({ success: false, message: "Failed to cancel payment" });
  }
});

export default router;