import { Router, Request, Response } from "express";
import { roleAuthMiddleware } from "../middleware";
import { storage } from "../../storage";
import { z } from "zod";
import { randomUUID } from "crypto";

// Create admin router for administrative features
const router = Router();

// Test endpoint
router.get("/test", roleAuthMiddleware(['admin']), (req, res) => {
  res.json({ success: true, message: "Admin API working" });
});

// Get all users (admin only)
router.get("/users", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
  try {
    // Get all users from the storage
    const allUsers = storage.getAllUsers();
    const users = Array.from(allUsers.values()).map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      balance: user.balance,
      pendingBalance: user.pendingBalance || "0.00",
      isAuthorized: user.isAuthorized,
      casinoUsername: user.casinoUsername,
      casinoClientId: user.casinoClientId,
      casinoBalance: user.casinoBalance || "0.00",
      userType: user.userType || user.casinoUserType || 'user',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    
    return res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

// Update manual payment status (admin only)
router.post("/manual-payment/:id/status", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status, adminNotes } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid payment ID" });
    }
    
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status. Must be one of: pending, approved, rejected" });
    }
    
    // Get the manual payment
    const manualPayment = await storage.getManualPayment(id);
    if (!manualPayment) {
      return res.status(404).json({ success: false, message: "Manual payment not found" });
    }
    
    // Get the associated transaction
    const transaction = await storage.getTransaction(manualPayment.transactionId);
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Associated transaction not found" });
    }
    
    // Update the manual payment status
    const updatedPayment = await storage.updateManualPayment(id, {
      status,
      adminNotes: adminNotes || null
    });
    
    // Update the transaction status
    let transactionStatus = status;
    if (status === 'approved') {
      transactionStatus = 'payment_completed';
    } else if (status === 'rejected') {
      transactionStatus = 'failed';
    }
    
    const updatedTransaction = await storage.updateTransactionStatus(transaction.id, transactionStatus, undefined, {
      ...transaction.metadata,
      adminProcessedAt: new Date().toISOString(),
      adminNotes: adminNotes || null
    });
    
    // Add status history entry
    await storage.addStatusHistoryEntry(transaction.id, transactionStatus, 
      `Manual payment ${status} by admin${adminNotes ? `: ${adminNotes}` : ''}`);
    
    // If approved, update user balance
    if (status === 'approved') {
      // Get the user
      const user = await storage.getUser(transaction.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      
      // Calculate new balance
      const amount = parseFloat(transaction.amount);
      const currentBalance = parseFloat(user.balance);
      const newBalance = currentBalance + amount;
      
      // Update user balance
      await storage.updateUserBalance(user.id, amount);
      
      // Record transaction financials
      await storage.recordTransactionFinancials(transaction.id, currentBalance, newBalance);
      
      // Complete the transaction
      await storage.completeTransaction(transaction.id, {
        ...transaction.metadata,
        completedBy: "admin",
        completedAt: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      message: `Manual payment ${status} successfully`,
      manualPayment: updatedPayment,
      transaction: updatedTransaction
    });
  } catch (error) {
    console.error('Error updating manual payment status:', error);
    return res.status(500).json({ success: false, message: "Failed to update manual payment status" });
  }
});

// Get all manual payments (admin only)
router.get("/manual-payments", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
  try {
    // Get all manual payments
    const manualPaymentsMap = storage.getAllManualPayments();
    const manualPayments = Array.from(manualPaymentsMap.values());
    
    // Sort by created date (newest first)
    manualPayments.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return res.json({ success: true, manualPayments });
  } catch (error) {
    console.error('Error fetching manual payments:', error);
    return res.status(500).json({ success: false, message: "Failed to fetch manual payments" });
  }
});

// Get all transactions (admin only)
router.get("/transactions", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
  try {
    const { limit = '50', offset = '0', userId, type, method, status, startDate, endDate } = req.query;
    
    // Parse date strings to Date objects if provided
    let start: Date | undefined;
    let end: Date | undefined;
    
    if (startDate) {
      start = new Date(startDate as string);
    }
    
    if (endDate) {
      end = new Date(endDate as string);
    }
    
    // Get transactions with filters
    let transactions;
    if (start && end) {
      transactions = await storage.getTransactionsByDateRange(start, end, {
        userId: userId ? parseInt(userId as string) : undefined,
        type: type as string,
        method: method as string,
        status: status as string
      });
    } else if (userId) {
      transactions = await storage.getTransactionsByUserId(parseInt(userId as string), {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        type: type as string,
        method: method as string,
        status: status as string,
        startDate: start,
        endDate: end
      });
    } else {
      // Default: get most recent transactions
      transactions = await storage.getTransactionsByDateRange(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        new Date(),
        {
          type: type as string,
          method: method as string,
          status: status as string
        }
      );
      
      // Apply limit and offset manually
      transactions = transactions.slice(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string)
      );
    }
    
    // Get transaction summary
    const summary = await storage.getTransactionsSummary({
      userId: userId ? parseInt(userId as string) : undefined,
      type: type as string,
      method: method as string,
      status: status as string,
      startDate: start,
      endDate: end
    });
    
    return res.json({
      success: true,
      transactions,
      summary,
      filters: {
        userId,
        type,
        method,
        status,
        startDate: start?.toISOString(),
        endDate: end?.toISOString(),
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('Error fetching admin transactions:', error);
    return res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
});

// Clean up expired payments
router.post("/payments/cleanup-expired", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
  try {
    const now = new Date();
    let expiredCount = 0;
    
    // Get all QR payments
    const qrPaymentsMap = storage.getAllQrPayments();
    for (const [id, payment] of qrPaymentsMap.entries()) {
      // Skip if payment is not pending
      if (payment.status !== 'pending') continue;
      
      // Check if payment is expired
      if (payment.expiresAt && new Date(payment.expiresAt) < now) {
        // Update payment status
        await storage.updateQrPaymentStatus(payment.id, 'expired');
        
        // Update associated transaction
        const transaction = await storage.getTransaction(payment.transactionId);
        if (transaction) {
          await storage.updateTransactionStatus(transaction.id, 'expired', undefined, {
            ...transaction.metadata,
            expiredAt: now.toISOString()
          });
          
          // Add status history entry
          await storage.addStatusHistoryEntry(transaction.id, 'expired', 'Payment expired');
        }
        
        expiredCount++;
      }
    }
    
    // Get all Telegram payments
    const telegramPaymentsMap = storage.getAllTelegramPayments();
    for (const [id, payment] of telegramPaymentsMap.entries()) {
      // Skip if payment is not pending
      if (payment.status !== 'pending') continue;
      
      // Check if payment is expired
      if (payment.expiresAt && new Date(payment.expiresAt) < now) {
        // Update payment status
        await storage.updateTelegramPaymentStatus(payment.id, 'expired');
        
        // Update associated transaction
        const transaction = await storage.getTransaction(payment.transactionId);
        if (transaction) {
          await storage.updateTransactionStatus(transaction.id, 'expired', undefined, {
            ...transaction.metadata,
            expiredAt: now.toISOString()
          });
          
          // Add status history entry
          await storage.addStatusHistoryEntry(transaction.id, 'expired', 'Payment expired');
        }
        
        expiredCount++;
      }
    }
    
    // Get all Manual payments
    const manualPaymentsMap = storage.getAllManualPayments();
    for (const [id, payment] of manualPaymentsMap.entries()) {
      // Skip if payment is not pending
      if (payment.status !== 'pending') continue;
      
      // Check if payment is expired
      if (payment.expiresAt && new Date(payment.expiresAt) < now) {
        // Update payment status
        await storage.updateManualPaymentStatus(payment.id, 'expired');
        
        // Update associated transaction
        const transaction = await storage.getTransaction(payment.transactionId);
        if (transaction) {
          await storage.updateTransactionStatus(transaction.id, 'expired', undefined, {
            ...transaction.metadata,
            expiredAt: now.toISOString()
          });
          
          // Add status history entry
          await storage.addStatusHistoryEntry(transaction.id, 'expired', 'Payment expired');
        }
        
        expiredCount++;
      }
    }
    
    return res.json({
      success: true,
      message: `Cleaned up ${expiredCount} expired payments`,
      expiredCount
    });
  } catch (error) {
    console.error('Error cleaning up expired payments:', error);
    return res.status(500).json({ success: false, message: "Failed to clean up expired payments" });
  }
});

// Process pending casino transfers
router.post("/payments/process-pending-transfers", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
  try {
    // Find all transactions with payment_completed status
    const completedPayments = await storage.getTransactionsByUserId(0, {
      status: "payment_completed"
    });
    
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const results = [];
    
    // Process each transaction with payment_completed status
    for (const transaction of completedPayments) {
      // Skip if not a deposit or if already has a casinoTransferStatus that's not 'pending'
      if (transaction.type !== 'deposit') continue;
      
      const metadata = transaction.metadata as Record<string, any> || {};
      const casinoTransferStatus = metadata.casinoTransferStatus || 'pending';
      
      if (casinoTransferStatus !== 'pending') continue;
      
      processed++;
      
      try {
        // Get user details from database
        const user = await storage.getUser(transaction.userId);
        if (!user || !user.casinoClientId) {
          failed++;
          results.push({
            transactionId: transaction.id,
            success: false,
            message: "User not found or missing casino ID"
          });
          continue;
        }
        
        // Try to complete the casino transfer
        const transferResult = await casino747CompleteTopup(
          user.casinoClientId.toString(),
          parseFloat(transaction.amount),
          transaction.paymentReference || transaction.uniqueId || `tx-${transaction.id}`
        );
        
        // Update transaction with casino transfer result
        await storage.updateTransactionMetadata(transaction.id, {
          ...metadata,
          casinoTransferStatus: 'completed',
          casinoTransferResult: transferResult,
          casinoTransferCompletedAt: new Date().toISOString()
        });
        
        // Complete the transaction
        await storage.completeTransaction(transaction.id);
        
        // Update user's casino balance
        await storage.updateUserCasinoBalance(user.id, parseFloat(transaction.amount));
        
        succeeded++;
        results.push({
          transactionId: transaction.id,
          success: true,
          transferResult
        });
      } catch (error) {
        // Update transaction metadata with error
        const errorMessage = error instanceof Error ? error.message : String(error);
        await storage.updateTransactionMetadata(transaction.id, {
          ...metadata,
          casinoTransferStatus: 'failed',
          casinoTransferError: errorMessage,
          casinoTransferAttemptedAt: new Date().toISOString()
        });
        
        failed++;
        results.push({
          transactionId: transaction.id,
          success: false,
          error: errorMessage
        });
      }
    }
    
    return res.json({
      success: true,
      processed,
      succeeded,
      failed,
      results
    });
  } catch (error) {
    console.error('Error processing pending transfers:', error);
    return res.status(500).json({ success: false, message: "Failed to process pending transfers" });
  }
});

// Get agent downlines
router.get("/agent/downlines", roleAuthMiddleware(['admin', 'agent']), async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    
    // Only agents and admins can access this endpoint
    const userType = user.userType || user.casinoUserType || 'user';
    if (userType !== 'admin' && userType !== 'agent') {
      return res.status(403).json({ success: false, message: "Access forbidden" });
    }
    
    let downlineUsers = [];
    
    if (userType === 'admin') {
      // Admins can see all users
      const allUsers = storage.getAllUsers();
      downlineUsers = Array.from(allUsers.values()).filter(u => u.id !== user.id);
    } else {
      // Agents can only see users for which they are the top manager
      const allUsers = storage.getAllUsers();
      downlineUsers = Array.from(allUsers.values()).filter(u => 
        u.id !== user.id && u.topManager === user.username
      );
    }
    
    // Format the response
    const formattedDownlines = downlineUsers.map(u => ({
      id: u.id,
      username: u.username,
      casinoUsername: u.casinoUsername,
      casinoClientId: u.casinoClientId,
      casinoBalance: u.casinoBalance || "0.00",
      balance: u.balance,
      pendingBalance: u.pendingBalance || "0.00",
      topManager: u.topManager,
      immediateManager: u.immediateManager,
      createdAt: u.createdAt
    }));
    
    return res.json({
      success: true,
      downlines: formattedDownlines
    });
  } catch (error) {
    console.error('Error fetching downlines:', error);
    return res.status(500).json({ success: false, message: "Failed to fetch downline users" });
  }
});

// Helper function
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
    
    // Import required API
    const { casino747Api } = require('../../casino747Api');
    
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
      // Import required API
      const { casino747Api } = require('../../casino747Api');
      
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