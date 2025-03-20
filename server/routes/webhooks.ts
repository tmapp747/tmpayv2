import express, { Request, Response } from 'express';
import { db } from '../db';
import { storage } from '../storage';
import { mapDirectPayWebhookToDbFields } from '../utils/api-mapper';
import { casino747CompleteTopup } from '../routes';
import { determineTransactionStatus, mapDirectPayStatusToGcashStatus } from '../../shared/api-mapping';

const router = express.Router();

/**
 * DirectPay webhook handler
 * 
 * This endpoint processes payment status updates from DirectPay in their official format.
 * It updates the transaction status and triggers casino transfer if payment is successful.
 */
router.post('/direct-pay', async (req: Request, res: Response) => {
  try {
    console.log('DirectPay webhook received:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    const { refId, status } = req.body;
    if (!refId || !status) {
      console.error('Invalid DirectPay webhook payload - missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid webhook payload, missing required fields' 
      });
    }
    
    // Find the transaction by reference ID
    const transaction = await storage.getTransactionByReference(refId);
    if (!transaction) {
      console.error(`Transaction not found for reference: ${refId}`);
      return res.status(404).json({ 
        success: false, 
        message: `Transaction not found for reference: ${refId}` 
      });
    }
    
    // Map DirectPay status to our gcashStatus
    const gcashStatus = mapDirectPayStatusToGcashStatus(status);
    console.log(`Mapping DirectPay status ${status} to gcashStatus ${gcashStatus}`);
    
    // Transform the webhook payload
    const mappedPayload = mapDirectPayWebhookToDbFields(req.body);
    console.log('Mapped webhook payload:', mappedPayload);
    
    // Update transaction with webhook data
    const updatedTransaction = await storage.updateTransactionGCashStatus(
      transaction.id,
      gcashStatus,
      mappedPayload
    );
    
    // If payment was successful, process casino transfer
    if (gcashStatus === 'success') {
      console.log(`Payment successful for transaction ${transaction.id}, processing casino transfer`);
      try {
        const user = await storage.getUser(transaction.userId);
        if (!user) {
          console.error(`User not found for transaction ${transaction.id}`);
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
        
        // Complete the casino topup
        await casino747CompleteTopup(
          user.casinoClientId!.toString(),
          transaction.amount,
          transaction.reference
        );
        
        console.log(`Casino transfer completed for transaction ${transaction.id}`);
        
        // Update transaction status
        await storage.updateTransactionStatus(
          transaction.id,
          'completed',
          transaction.reference,
          {
            ...transaction.metadata,
            paymentCompletedAt: new Date().toISOString(),
            casinoTransferCompletedAt: new Date().toISOString()
          }
        );
      } catch (error) {
        console.error(`Error processing casino transfer: ${error}`);
        // Update only the GCash status, casino transfer will be retried later
        await storage.updateTransactionCasinoStatus(
          transaction.id,
          'failed',
          { 
            ...transaction.metadata,
            casinoTransferError: (error as Error).message
          }
        );
      }
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      status: gcashStatus,
      transactionId: transaction.id
    });
    
  } catch (error) {
    console.error('Error processing DirectPay webhook:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error processing webhook',
      error: (error as Error).message
    });
  }
});

/**
 * Simple webhook handler
 * 
 * This endpoint processes payment status updates in a simplified format.
 * It's designed for easier integration with basic testing scripts.
 */
router.post('/simple', async (req: Request, res: Response) => {
  try {
    console.log('Simple webhook received:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    const { reference, status } = req.body;
    if (!reference || !status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid webhook payload, missing required fields' 
      });
    }
    
    // Find the transaction by reference ID
    const transaction = await storage.getTransactionByReference(reference);
    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        message: `Transaction not found for reference: ${reference}` 
      });
    }
    
    // Map status to our standardized format
    const normalizedStatus = status.toLowerCase();
    const gcashStatus = normalizedStatus === 'success' ? 'success' : 
                        normalizedStatus === 'pending' ? 'pending' : 
                        normalizedStatus === 'cancelled' ? 'cancelled' : 'failed';
    
    // Update transaction with webhook data
    const updatedTransaction = await storage.updateTransactionGCashStatus(
      transaction.id,
      gcashStatus,
      { ...transaction.metadata, simpleWebhookReceived: new Date().toISOString() }
    );
    
    // If payment was successful, process casino transfer
    if (gcashStatus === 'success') {
      try {
        const user = await storage.getUser(transaction.userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
        
        // Complete the casino topup
        await casino747CompleteTopup(
          user.casinoClientId!.toString(),
          transaction.amount,
          transaction.reference
        );
        
        // Update transaction status
        await storage.updateTransactionStatus(
          transaction.id,
          'completed',
          transaction.reference,
          {
            ...transaction.metadata,
            paymentCompletedAt: new Date().toISOString(),
            casinoTransferCompletedAt: new Date().toISOString()
          }
        );
      } catch (error) {
        // Update only the GCash status, casino transfer will be retried later
        await storage.updateTransactionCasinoStatus(
          transaction.id,
          'failed',
          { 
            ...transaction.metadata,
            casinoTransferError: (error as Error).message
          }
        );
      }
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      status: gcashStatus,
      transactionId: transaction.id
    });
    
  } catch (error) {
    console.error('Error processing simple webhook:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error processing webhook',
      error: (error as Error).message
    });
  }
});

/**
 * Paygram webhook handler
 * 
 * This endpoint processes payment status updates from Paygram.
 */
router.post('/paygram', async (req: Request, res: Response) => {
  try {
    console.log('Paygram webhook received:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    const { invoiceCode, status, referenceId } = req.body;
    if (!invoiceCode || !status || !referenceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid webhook payload, missing required fields' 
      });
    }
    
    // Find the transaction by reference ID
    const transaction = await storage.getTransactionByReference(referenceId);
    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        message: `Transaction not found for reference: ${referenceId}` 
      });
    }
    
    // Map status to our standardized format
    const paygramStatus = status.toLowerCase();
    const mappedStatus = paygramStatus === 'paid' ? 'success' : 
                        paygramStatus === 'pending' ? 'pending' : 
                        paygramStatus === 'expired' ? 'cancelled' : 'failed';
    
    // Update transaction with webhook data
    const updatedTransaction = await storage.updateTransactionStatus(
      transaction.id,
      paygramStatus === 'paid' ? 'completed' : mappedStatus,
      transaction.reference,
      { ...transaction.metadata, paygramWebhookReceived: new Date().toISOString() }
    );
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      status: mappedStatus,
      transactionId: transaction.id
    });
    
  } catch (error) {
    console.error('Error processing Paygram webhook:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error processing webhook',
      error: (error as Error).message
    });
  }
});

export default router;