/**
 * Automatic Payment Processor Service
 * 
 * This service handles automatic processing of payments and casino transfers,
 * with built-in retry capabilities and background processing.
 */

import { db } from '../db';
import { IStorage } from '../storage';
import { Casino747Api } from '../casino747Api-simplified';
import { mapDirectPayStatusToGcashStatus, determineTransactionStatus, generateTransactionTimeline } from '../../shared/api-mapping';
import { eq, and, inArray, isNull, or, lt, sql } from 'drizzle-orm';
import { transactions, qrPayments } from '../../shared/schema';

// Processing intervals
const PAYMENT_CHECK_INTERVAL_MS = 10000; // 10 seconds
const PROCESSING_LIMIT = 10; // Number of items to process in each batch

export class AutomaticPaymentProcessor {
  private storage: IStorage;
  private casinoApi: Casino747Api;
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(storage: IStorage, casinoApi: Casino747Api) {
    this.storage = storage;
    this.casinoApi = casinoApi;
  }

  /**
   * Start automatic payment processing
   */
  public start(): void {
    if (this.processingInterval) {
      console.log("🔄 Automatic payment processor already running");
      return;
    }

    console.log("🚀 Starting automatic payment processor");
    
    // Initial processing
    this.processPayments();
    
    // Set up interval for continuous processing
    this.processingInterval = setInterval(() => {
      this.processPayments();
    }, PAYMENT_CHECK_INTERVAL_MS);
  }

  /**
   * Stop automatic payment processing
   */
  public stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log("⏹️ Automatic payment processor stopped");
    }
  }

  /**
   * Process pending payments and transfers
   */
  private async processPayments(): Promise<void> {
    // Prevent overlapping processing
    if (this.isProcessing) {
      return;
    }

    try {
      this.isProcessing = true;

      // Process QR payments with "completed" GCash status but pending casino transfers
      await this.processPendingCasinoTransfers();

      // Process expired QR payments
      await this.processExpiredPayments();

    } catch (error) {
      console.error("Error in automatic payment processor:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process QR payments with "completed" status but pending casino transfers
   */
  private async processPendingCasinoTransfers(): Promise<void> {
    try {
      // Find transactions with completed payment but pending casino transfer
      // Using direct query without 'with' relation to avoid relation issues
      const pendingTransfers = await db.query.transactions.findMany({
        where: and(
          or(
            eq(transactions.status, "payment_completed"),
            eq(transactions.status, "pending_transfer")
          ),
          eq(transactions.type, "deposit")
        ),
        limit: PROCESSING_LIMIT
      });

      if (pendingTransfers.length === 0) {
        return;
      }

      console.log(`🔄 Found ${pendingTransfers.length} pending casino transfers to process`);

      for (const transaction of pendingTransfers) {
        try {
          // Fetch user details
          const user = await this.storage.getUser(transaction.userId);
          if (!user) {
            console.error(`❌ User not found for transaction ${transaction.id}`);
            continue;
          }

          // Skip if missing casino details
          if (!user.casinoClientId || !user.casinoUsername) {
            console.error(`❌ Missing casino details for user ${user.id} (${user.username})`);
            
            // Mark as failed so we don't retry indefinitely
            await this.storage.updateTransactionStatus(
              transaction.id,
              "failed",
              transaction.reference,
              {
                ...transaction.metadata,
                casinoStatus: "failed",
                casinoError: "Missing casino client ID or username",
                casinoTransferAttemptedAt: new Date().toISOString()
              }
            );
            continue;
          }

          console.log(`🎮 Processing casino transfer for transaction ${transaction.id} (${transaction.reference})`);
          console.log(`👤 User: ${user.username} (${user.casinoUsername}), Casino ID: ${user.casinoClientId}`);

          // Complete the casino transfer
          try {
            const transferResult = await this.casinoApi.transferFunds(
              transaction.amount,
              user.casinoClientId,
              user.casinoUsername
            );

            if (transferResult.success) {
              console.log(`✅ Casino transfer successful for transaction ${transaction.id}`);
              
              // Update transaction as completed
              const updatedTransaction = await this.storage.updateTransactionStatus(
                transaction.id,
                "completed",
                transaction.reference,
                {
                  ...transaction.metadata,
                  casinoStatus: "completed",
                  casinoTransferCompletedAt: new Date().toISOString(),
                  casinoTransferResponse: transferResult
                }
              );

              // Generate updated timeline
              const timeline = generateTransactionTimeline({
                ...updatedTransaction,
                metadata: {
                  ...updatedTransaction.metadata,
                  gcashStatus: "completed",
                  casinoStatus: "completed"
                }
              });

              // Update with timeline
              await this.storage.updateTransactionMetadata(transaction.id, {
                ...updatedTransaction.metadata,
                timeline
              });

              // Update user balances
              await this.storage.updateUserCasinoBalance(user.id, transaction.amount);
            } else {
              console.error(`❌ Casino transfer failed for transaction ${transaction.id}: ${transferResult.message}`);
              
              // Update transaction with error but keep status for retry
              await this.storage.updateTransactionMetadata(transaction.id, {
                ...transaction.metadata,
                casinoStatus: "failed",
                casinoError: transferResult.message,
                casinoTransferAttemptedAt: new Date().toISOString(),
                casinoTransferResponse: transferResult
              });
            }
          } catch (error) {
            console.error(`❌ Error processing casino transfer for transaction ${transaction.id}:`, error);
            
            // Update transaction with error but keep status for retry
            await this.storage.updateTransactionMetadata(transaction.id, {
              ...transaction.metadata,
              casinoStatus: "error",
              casinoError: error instanceof Error ? error.message : String(error),
              casinoTransferAttemptedAt: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error(`❌ Error processing transaction ${transaction.id}:`, error);
        }
      }
    } catch (error) {
      console.error("Error processing pending casino transfers:", error);
    }
  }

  /**
   * Process expired QR payments
   */
  private async processExpiredPayments(): Promise<void> {
    try {
      // Get current timestamp
      const now = new Date();
      
      // Find QR payments that have expired (older than 30 minutes) and still in pending status
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
      const expiredPayments = await db.query.qrPayments.findMany({
        where: and(
          inArray(qrPayments.status, ["pending", "processing"]),
          // Payments created more than 30 minutes ago - simplify the query to avoid sql function errors
          lt(qrPayments.createdAt, thirtyMinutesAgo)
        ),
        limit: PROCESSING_LIMIT
      });

      if (expiredPayments.length === 0) {
        return;
      }

      console.log(`⏱️ Found ${expiredPayments.length} expired QR payments to process`);

      for (const payment of expiredPayments) {
        try {
          console.log(`⏱️ Marking QR payment ${payment.id} (${payment.directPayReference}) as expired`);
          
          // Update QR payment status
          await this.storage.updateQrPaymentStatus(payment.id, "expired");
          
          // Get associated transaction
          const transaction = await this.storage.getTransaction(payment.transactionId);
          if (!transaction) {
            console.error(`❌ Transaction not found for QR payment ${payment.id}`);
            continue;
          }
          
          // Update transaction status
          const metadata = transaction.metadata || {};
          
          // Update status based on dual-status tracking
          const updatedMetadata = {
            ...metadata,
            gcashStatus: "expired",
            statusUpdatedAt: new Date().toISOString()
          };
          
          // Determine overall status based on GCash and Casino statuses
          const overallStatus = determineTransactionStatus(
            "expired",
            metadata.casinoStatus || "pending"
          );
          
          // Generate timeline for UI display
          const timeline = generateTransactionTimeline({
            ...transaction,
            metadata: updatedMetadata
          });
          
          // Save timeline to transaction metadata
          await this.storage.updateTransactionStatus(
            transaction.id,
            overallStatus,
            transaction.reference,
            {
              ...updatedMetadata,
              timeline
            }
          );
          
          console.log(`⏱️ Updated transaction ${transaction.id} status to ${overallStatus} (expired payment)`);
        } catch (error) {
          console.error(`❌ Error processing expired QR payment ${payment.id}:`, error);
        }
      }
    } catch (error) {
      console.error("Error processing expired payments:", error);
    }
  }
}

// Singleton instance
let instance: AutomaticPaymentProcessor | null = null;

/**
 * Get or create the automatic payment processor instance
 */
export function getAutomaticPaymentProcessor(storage: IStorage, casinoApi: Casino747Api): AutomaticPaymentProcessor {
  if (!instance) {
    instance = new AutomaticPaymentProcessor(storage, casinoApi);
  }
  return instance;
}