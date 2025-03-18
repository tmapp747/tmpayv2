/**
 * Webhook endpoints for payment integration
 * This file contains all webhook handlers for external payment integrations
 */

import { Router, Request, Response } from 'express';
import { mapDirectPayStatusToGcashStatus, mapCasinoTransferStatusToCasinoStatus, generateTransactionTimeline } from '../../shared/api-mapping';
import { db } from '../db';
import { casino747Api } from '../casino747Api';
import { DbStorage } from '../DbStorage';
import { Currency } from '../../shared/schema';

const router = Router();
const storage = new DbStorage(db);

/**
 * DirectPay Webhook Handler
 * Processes payment notifications from DirectPay for GCash payments
 * 
 * Expected payload format:
 * {
 *   "amount": "100",
 *   "currency": "PHP",
 *   "refId": "ref_1ae942cfd281eaa9",
 *   "invoiceNo": "Invoice123",
 *   "txnDesc": "Add Funds via GCASH QR|refId:ref_1ae942cfd281eaa9",
 *   "txnDate": "1742016549514",
 *   "txnId": "9908728",
 *   "status": "SUCCESS",
 *   "merchant_id": "ACw4xoKnvj52StUi"
 * }
 */
router.post('/directpay/payment', async (req: Request, res: Response) => {
  try {
    console.log("✅ DirectPay webhook received:", JSON.stringify(req.body));
    
    // Log all incoming fields for diagnostic purposes
    console.log("📝 DirectPay webhook fields:", {
      refId: req.body.refId,
      status: req.body.status,
      txnId: req.body.txnId,
      txnDate: req.body.txnDate,
      amount: req.body.amount,
      currency: req.body.currency,
      invoiceNo: req.body.invoiceNo,
      txnDesc: req.body.txnDesc,
      merchant_id: req.body.merchant_id
    });
    
    // Extract payment reference from various possible fields
    const paymentReference = req.body.refId || req.body.reference;
    
    if (!paymentReference) {
      console.warn("❌ Payment reference missing in webhook payload");
      return res.status(200).json({ 
        success: false,
        message: "Missing payment reference",
        webhookReceived: true
      });
    }
    
    // Find the QR payment by reference
    const qrPayment = await storage.getQrPaymentByReference(paymentReference);
    if (!qrPayment) {
      console.warn(`QR Payment not found for reference: ${paymentReference}`);
      return res.status(200).json({ 
        success: false, 
        message: "Payment not found",
        webhookReceived: true
      });
    }
    
    // Get the related transaction and user
    const transaction = await storage.getTransaction(qrPayment.transactionId);
    if (!transaction) {
      console.error(`Transaction not found for QR payment ID: ${qrPayment.id}`);
      return res.status(200).json({ 
        success: false, 
        message: "Transaction not found",
        webhookReceived: true
      });
    }
    
    const user = await storage.getUser(qrPayment.userId);
    if (!user) {
      console.error(`User not found for QR payment user ID: ${qrPayment.userId}`);
      return res.status(200).json({ 
        success: false, 
        message: "User not found",
        webhookReceived: true
      });
    }
    
    // Get payment status from the webhook
    const paymentStatus = req.body.status || '';
    const txId = req.body.txnId || `dp_${Date.now()}`;
    
    // Map the DirectPay status to our internal gcashStatus
    const gcashStatus = mapDirectPayStatusToGcashStatus(paymentStatus);
    console.log(`Mapped DirectPay status "${paymentStatus}" to internal status "${gcashStatus}"`);
    
    // Update QR payment with the new status
    await storage.updateQrPaymentStatus(qrPayment.id, gcashStatus);
    
    // Process based on mapped status
    if (gcashStatus === 'completed') {
      console.log(`Payment status confirmed as completed for reference: ${paymentReference}`);
      
      // Update transaction status to payment_completed first
      const updatedMetadata = {
        ...(transaction.metadata as Record<string, any> || {}),
        paymentCompletedAt: new Date().toISOString(),
        casinoTransferStatus: 'pending',
        gcashStatus,
        txId,
        txnDate: req.body.txnDate
      };
      
      await storage.updateTransactionStatus(
        transaction.id,
        "payment_completed",
        txId,
        updatedMetadata
      );
      
      // Add status history entry for payment completion
      await storage.addStatusHistoryEntry(
        transaction.id,
        'payment_completed',
        `Payment completed with DirectPay transaction ID: ${txId}`
      );
      
      // Update user's balance (GCash payments are in PHP)
      const paymentAmount = parseFloat(qrPayment.amount.toString());
      const currency = transaction.currency || 'PHP';
      await storage.updateUserCurrencyBalance(user.id, currency as Currency, paymentAmount);
      
      console.log(`User balance updated for ${user.username}, added ${paymentAmount} ${currency}`);
      
      // Now attempt the casino transfer
      try {
        if (!user.casinoId || !user.casinoUsername) {
          throw new Error(`User ${user.username} is missing casino details (ID: ${user.casinoId}, Username: ${user.casinoUsername})`);
        }
        
        // Generate a unique nonce for this transaction
        const nonce = `nonce_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        
        // Create a detailed comment with nonce and payment reference
        const comment = `An amount of ${paymentAmount} ${currency} has been deposited. Nonce: ${nonce}. TMPay Web App Transaction.`;
        
        // Get the top manager for this user (use stored value or default to first allowed top manager)
        const topManager = user.topManager || 'Marcthepogi';
        
        console.log(`Attempting casino transfer for user: ${user.username} (Casino ID: ${user.casinoId})`);
        console.log(`Amount: ${paymentAmount} ${currency}, Top Manager: ${topManager}`);
        
        // Call casino API to transfer funds
        const transferResult = await casino747Api.transferFunds(
          paymentAmount,
          parseInt(user.casinoId),
          user.casinoUsername,
          "PHP",
          topManager,
          comment
        );
        
        console.log(`Casino transfer successful:`, transferResult);
        
        // Update transaction status to fully completed
        const completedMetadata = {
          ...updatedMetadata,
          nonce,
          casinoTransactionId: transferResult.transactionId,
          casinoTransferStatus: 'completed',
          casinoTransferCompletedAt: new Date().toISOString()
        };
        
        await storage.updateTransactionStatus(
          transaction.id,
          "completed",
          transferResult.transactionId || txId,
          completedMetadata
        );
        
        // Generate timeline for UI display
        const timeline = generateTransactionTimeline({
          ...transaction,
          metadata: completedMetadata
        });
        
        // Save timeline to transaction metadata
        await storage.updateTransactionMetadata(transaction.id, {
          ...completedMetadata,
          timeline
        });
        
        // Add a success entry to status history
        await storage.addStatusHistoryEntry(
          transaction.id,
          'casino_transfer_completed',
          `Casino transfer completed with ID ${transferResult.transactionId}`
        );
        
        // Send formatted deposit notification to the player's manager
        try {
          console.log(`📬 Sending deposit notification to manager for player ${user.username}`);
          
          // Determine payment method based on transaction type
          let paymentMethod = "GCash";
          if (transaction.type === "telegram_payment") {
            paymentMethod = "Telegram";
          } else if (transaction.type === "manual_payment") {
            paymentMethod = "Manual Payment";
          } else if (transaction.type === "qr_payment") {
            paymentMethod = "GCash QR";
          }
          
          // Send the notification with details from the payment
          await casino747Api.sendDepositNotification(user.username, {
            amount: paymentAmount,
            currency: currency,
            method: paymentMethod,
            reference: paymentReference,
            timestamp: new Date()
          });
          
          console.log(`✅ Deposit notification sent successfully to manager for ${user.username}`);
        } catch (notificationError) {
          // Log but don't fail if notification sending fails
          console.error(`⚠️ Error sending deposit notification:`, notificationError);
        }
        
        return res.status(200).json({
          success: true, 
          message: "Payment processed and casino transfer completed successfully",
          paymentReference,
          transactionId: transaction.id,
          casinoTransactionId: transferResult.transactionId,
          webhookReceived: true,
          processedAt: new Date().toISOString()
        });
      } catch (casinoError) {
        console.error("Error completing casino transfer:", casinoError);
        
        // Update transaction metadata to reflect the error but keep payment_completed status
        const errorMetadata = {
          ...updatedMetadata,
          casinoTransferStatus: 'failed',
          casinoTransferError: casinoError instanceof Error ? casinoError.message : String(casinoError),
          casinoTransferAttemptedAt: new Date().toISOString()
        };
        
        await storage.updateTransactionStatus(
          transaction.id,
          "payment_completed", // Keep payment_completed status
          txId,
          errorMetadata
        );
        
        // Generate timeline for UI display
        const timeline = generateTransactionTimeline({
          ...transaction,
          metadata: errorMetadata
        });
        
        // Save timeline to transaction metadata
        await storage.updateTransactionMetadata(transaction.id, {
          ...errorMetadata,
          timeline
        });
        
        // Add a failure entry to status history
        await storage.addStatusHistoryEntry(
          transaction.id,
          'casino_transfer_failed',
          `Casino transfer failed: ${casinoError instanceof Error ? casinoError.message : String(casinoError)}`
        );
        
        return res.status(200).json({ 
          success: true, 
          message: "Payment processed but casino transfer failed. Will retry later.",
          paymentReference,
          error: casinoError instanceof Error ? casinoError.message : String(casinoError),
          webhookReceived: true,
          processedAt: new Date().toISOString()
        });
      }
    } else if (gcashStatus === 'failed') {
      // Update transaction status to failed
      const failedMetadata = {
        ...(transaction.metadata as Record<string, any> || {}),
        gcashStatus,
        failedAt: new Date().toISOString(),
        txId,
        txnDate: req.body.txnDate
      };
      
      await storage.updateTransactionStatus(
        transaction.id, 
        "failed",
        undefined,
        failedMetadata
      );
      
      // Add status history entry for payment failure
      await storage.addStatusHistoryEntry(
        transaction.id,
        'payment_failed',
        `Payment failed with status: ${paymentStatus}`
      );
      
      // Generate timeline for UI display
      const timeline = generateTransactionTimeline({
        ...transaction,
        metadata: failedMetadata
      });
      
      // Save timeline to transaction metadata
      await storage.updateTransactionMetadata(transaction.id, {
        ...failedMetadata,
        timeline
      });
      
      console.log("Payment failed via webhook:", { 
        reference: paymentReference, 
        userId: user.id,
        status: paymentStatus
      });
      
      return res.status(200).json({ 
        success: true, 
        message: "Payment failure recorded successfully",
        status: "failed",
        webhookReceived: true,
        processedAt: new Date().toISOString()
      });
    } else {
      // For processing or other states, just update the metadata
      const updatedMetadata = {
        ...(transaction.metadata as Record<string, any> || {}),
        gcashStatus,
        lastUpdated: new Date().toISOString(),
        txId,
        txnDate: req.body.txnDate
      };
      
      // Update transaction metadata
      await storage.updateTransactionMetadata(transaction.id, updatedMetadata);
      
      // Generate timeline for UI display
      const timeline = generateTransactionTimeline({
        ...transaction,
        metadata: updatedMetadata
      });
      
      // Save timeline to transaction metadata
      await storage.updateTransactionMetadata(transaction.id, {
        ...updatedMetadata,
        timeline
      });
      
      return res.status(200).json({ 
        success: true, 
        message: `Payment status updated to ${gcashStatus}`,
        paymentReference,
        webhookReceived: true,
        processedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("DirectPay webhook processing error:", error);
    
    // Even in case of error, return a 200 OK to prevent repeated webhook attempts
    return res.status(200).json({ 
      success: false, 
      message: "Error processing webhook, but acknowledged",
      error: error instanceof Error ? error.message : String(error),
      webhookReceived: true,
      processedAt: new Date().toISOString()
    });
  }
});

export default router;