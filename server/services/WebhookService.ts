/**
 * WebhookService - Enhanced webhook handler for payment systems
 * 
 * This service centralizes webhook processing for different payment providers,
 * with consistent error handling and retry mechanisms.
 */

import { IStorage } from '../storage';
import { Casino747Api } from '../casino747Api-simplified';
import { mapDirectPayStatusToGcashStatus, determineTransactionStatus, generateTransactionTimeline } from '../../shared/api-mapping';

export interface WebhookPayload {
  [key: string]: any;
}

export class WebhookService {
  private storage: IStorage;
  private casinoApi: Casino747Api;
  
  constructor(storage: IStorage, casinoApi: Casino747Api) {
    this.storage = storage;
    this.casinoApi = casinoApi;
  }
  
  /**
   * Process a DirectPay webhook for GCash payments
   * 
   * This method handles webhooks in both the official DirectPay format and our simplified format
   * and ensures successful casino transfers happen automatically.
   * 
   * @param payload The webhook payload from DirectPay
   * @returns Processing result
   */
  public async processDirectPayWebhook(payload: WebhookPayload): Promise<{
    success: boolean;
    message: string;
    status?: string;
    transactionId?: number;
    gcashStatus?: string;
    casinoStatus?: string;
  }> {
    try {
      console.log("💰 Processing DirectPay webhook:", JSON.stringify(payload, null, 2));
      
      // Extract reference from multiple possible fields based on DirectPay format
      // Official DirectPay API sends refId field, but we support legacy fields too
      const reference = payload.refId || payload.reference || payload.ref || payload.invoiceNo;
      
      // Extract additional reference details from official format
      const invoiceNo = payload.invoiceNo || payload.invoice_no;
      const txnDesc = payload.txnDesc || payload.description || payload.txn_desc;
      const txnId = payload.txnId || payload.transaction_id || payload.txn_id;
      const txnDate = payload.txnDate || payload.txn_date || payload.date;
      const merchant = payload.merchant_id || payload.merchantId;
      
      // Extract status from payload - official DirectPay uses uppercase status values
      // Support both lowercase and uppercase status formats
      const status = payload.status;
      
      // Log all identified fields for debugging
      console.log(`📝 Extracted webhook fields:
        Reference: ${reference}
        Invoice: ${invoiceNo}
        Status: ${status}
        Transaction ID: ${txnId}
        Transaction Date: ${txnDate}
        Description: ${txnDesc}
        Merchant: ${merchant}
      `);
      
      // Validate essential fields
      if (!reference || !status) {
        console.error("❌ Invalid webhook payload: missing required fields (reference/status)");
        return { 
          success: false, 
          message: "Invalid webhook payload: missing required fields" 
        };
      }
      
      console.log(`🔄 Processing DirectPay webhook with reference: ${reference}, status: ${status}`);
      
      // Find the QR payment by reference
      const qrPayment = await this.storage.getQrPaymentByReference(reference);
      
      if (!qrPayment) {
        console.error(`❌ QR payment not found for reference: ${reference}`);
        return { 
          success: false, 
          message: "Payment not found" 
        };
      }
      
      console.log(`✅ Found QR payment with ID ${qrPayment.id} for user ${qrPayment.userId}`);
      
      // Map DirectPay status to our standardized gcashStatus
      // This handles case-insensitive status comparison (SUCCESS, Success, success)
      const gcashStatus = mapDirectPayStatusToGcashStatus(status);
      
      console.log(`📊 Mapped DirectPay status "${status}" to internal status "${gcashStatus}"`);
      
      // Update QR payment status
      await this.storage.updateQrPaymentStatus(qrPayment.id, gcashStatus);
      
      // Get associated transaction
      const transaction = await this.storage.getTransaction(qrPayment.transactionId);
      
      if (!transaction) {
        console.error(`❌ Transaction not found for QR payment: ${qrPayment.id}`);
        return { 
          success: false, 
          message: "Transaction not found" 
        };
      }
      
      console.log(`📋 Processing transaction ${transaction.id}`);
      
      // Get current metadata or initialize empty object
      const metadata = transaction.metadata || {};
      
      // Create payload for transaction metadata
      const mappedPayload = {
        webhookReceivedAt: new Date().toISOString(),
        webhookPayload: payload,
        reference,
        paymentStatus: status,
        directPayStatus: status,
        gcashStatus,
        statusUpdatedAt: new Date().toISOString(),
      };
      
      // Update dual-status tracking fields
      const updatedMetadata = {
        ...metadata,
        ...mappedPayload
      };
      
      // Store original status for logging
      const originalStatus = transaction.status;
      
      // Define casino status (pending by default)
      const casinoStatus = metadata.casinoStatus || "pending";
      
      // Determine overall transaction status based on GCash payment status and casino transfer status
      const overallStatus = determineTransactionStatus(gcashStatus, casinoStatus);
      
      console.log(`📊 Status mapping: DirectPay "${status}" → GCash "${gcashStatus}" → Transaction "${overallStatus}"`);
      
      // Generate timeline for UI display
      const timeline = generateTransactionTimeline({
        ...transaction,
        metadata: {
          ...updatedMetadata,
          casinoStatus
        }
      });
      
      // Add timeline to metadata
      updatedMetadata.timeline = timeline;
      
      // Update transaction status and metadata
      const updatedTransaction = await this.storage.updateTransactionStatus(
        transaction.id,
        overallStatus,
        transaction.reference,
        updatedMetadata
      );
      
      console.log(`🔄 Transaction status updated: ${originalStatus} → ${overallStatus}`);
      
      // If payment was successful, process casino transfer immediately
      if (gcashStatus === "completed") {
        console.log(`💰 Payment successful, processing casino transfer for transaction ${transaction.id}`);
        
        try {
          // Get user details
          const user = await this.storage.getUser(transaction.userId);
          
          if (!user) {
            console.error(`❌ User not found for transaction ${transaction.id}`);
            return {
              success: true,
              message: "Payment processed but user not found for casino transfer",
              status: gcashStatus,
              gcashStatus,
              casinoStatus: "error",
              transactionId: transaction.id
            };
          }
          
          // Skip if missing casino details
          if (!user.casinoClientId || !user.casinoUsername) {
            console.error(`❌ Missing casino details for user ${user.id} (${user.username})`);
            
            // Update transaction with error
            await this.storage.updateTransactionMetadata(transaction.id, {
              ...updatedMetadata,
              casinoStatus: "failed",
              casinoError: "Missing casino client ID or username",
              casinoTransferAttemptedAt: new Date().toISOString()
            });
            
            return {
              success: true,
              message: "Payment processed but missing casino details for transfer",
              status: gcashStatus,
              gcashStatus,
              casinoStatus: "failed",
              transactionId: transaction.id
            };
          }
          
          // Execute casino transfer
          const transferResult = await this.casinoApi.transferFunds(
            transaction.amount,
            user.casinoClientId,
            user.casinoUsername
          );
          
          if (transferResult.success) {
            console.log(`✅ Casino transfer successful for transaction ${transaction.id}`);
            
            // Update transaction as completed with casino transfer details
            const finalTransaction = await this.storage.updateTransactionStatus(
              transaction.id,
              "completed",
              transaction.reference,
              {
                ...updatedMetadata,
                casinoStatus: "completed",
                casinoTransferCompletedAt: new Date().toISOString(),
                casinoTransferResponse: transferResult
              }
            );
            
            // Update user's casino balance
            await this.storage.updateUserCasinoBalance(user.id, transaction.amount);
            
            // Generate final timeline
            const finalTimeline = generateTransactionTimeline({
              ...finalTransaction,
              metadata: {
                ...finalTransaction.metadata,
                gcashStatus: "completed",
                casinoStatus: "completed"
              }
            });
            
            // Update with final timeline
            await this.storage.updateTransactionMetadata(transaction.id, {
              ...finalTransaction.metadata,
              timeline: finalTimeline
            });
            
            // Send notification to the user's immediate manager
            try {
              if (user.immediateManager) {
                console.log(`📧 Sending deposit notification to manager: ${user.immediateManager}`);
                
                await this.casinoApi.sendDepositNotification(
                  user.username,
                  {
                    amount: transaction.amount,
                    currency: "PHP",
                    method: "GCash",
                    timestamp: new Date(),
                    reference: transaction.reference,
                    transactionId: transaction.id
                  },
                  user.immediateManager,
                  user
                );
                
                console.log(`✅ Notification sent to manager: ${user.immediateManager}`);
              }
            } catch (notificationError) {
              console.error("⚠️ Error sending notification (non-critical):", notificationError);
              // Continue processing - notification is non-critical
            }
            
            return {
              success: true,
              message: "Payment and casino transfer completed successfully",
              status: "completed",
              gcashStatus: "completed",
              casinoStatus: "completed",
              transactionId: transaction.id
            };
          } else {
            console.error(`❌ Casino transfer failed: ${transferResult.message}`);
            
            // Update transaction with casino transfer error
            await this.storage.updateTransactionMetadata(transaction.id, {
              ...updatedMetadata,
              casinoStatus: "failed",
              casinoError: transferResult.message,
              casinoTransferAttemptedAt: new Date().toISOString(),
              casinoTransferResponse: transferResult
            });
            
            return {
              success: true,
              message: "Payment processed but casino transfer failed",
              status: "payment_completed",
              gcashStatus: "completed",
              casinoStatus: "failed",
              transactionId: transaction.id
            };
          }
        } catch (transferError) {
          console.error(`❌ Error processing casino transfer:`, transferError);
          
          // Update transaction with error but maintain payment_completed status
          await this.storage.updateTransactionMetadata(transaction.id, {
            ...updatedMetadata,
            casinoStatus: "error",
            casinoError: transferError instanceof Error ? transferError.message : String(transferError),
            casinoTransferAttemptedAt: new Date().toISOString()
          });
          
          return {
            success: true,
            message: "Payment processed but casino transfer error occurred",
            status: "payment_completed",
            gcashStatus: "completed",
            casinoStatus: "error",
            transactionId: transaction.id
          };
        }
      } else if (gcashStatus === "failed" || gcashStatus === "expired") {
        // Payment failed - update transaction metadata
        console.log(`❌ Payment ${gcashStatus} for transaction ${transaction.id}`);
        
        await this.storage.updateTransactionMetadata(transaction.id, {
          ...updatedMetadata,
          gcashStatus,
          timeline
        });
        
        return {
          success: true,
          message: `Payment ${gcashStatus}`,
          status: gcashStatus,
          gcashStatus,
          casinoStatus,
          transactionId: transaction.id
        };
      }
      
      // For other statuses (processing, pending), just return current state
      return {
        success: true,
        message: `Webhook processed successfully, payment status: ${gcashStatus}`,
        status: overallStatus,
        gcashStatus,
        casinoStatus,
        transactionId: transaction.id
      };
    } catch (error) {
      console.error("Error processing DirectPay webhook:", error);
      return {
        success: false,
        message: `Error processing webhook: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

// Singleton instance
let instance: WebhookService | null = null;

/**
 * Get or create the webhook service instance
 */
export function getWebhookService(storage: IStorage, casinoApi: Casino747Api): WebhookService {
  if (!instance) {
    instance = new WebhookService(storage, casinoApi);
  }
  return instance;
}