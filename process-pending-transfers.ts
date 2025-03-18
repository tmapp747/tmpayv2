/**
 * Script to process payments with completed payment status but pending casino transfers
 * 
 * This script:
 * 1. Identifies transactions with "payment_completed" status and "pending" casinoTransferStatus
 * 2. Attempts to complete the casino transfer for these transactions
 * 3. Updates the transaction status based on the result
 */

import { db } from './server/db';
import { eq } from 'drizzle-orm';
import { transactions, Currency } from './shared/schema';
import { casino747Api } from './server/casino747Api';
import { DbStorage } from './server/DbStorage';

async function processPendingCasinoTransfers() {
  try {
    console.log('Starting to process pending casino transfers...');
    
    // Initialize storage instance
    const storage = new DbStorage(db);
    
    // Find all transactions with payment_completed status
    const completedPayments = await db.query.transactions.findMany({
      where: eq(transactions.status, 'payment_completed')
    });
    
    console.log(`Found ${completedPayments.length} transactions with payment_completed status`);
    
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    
    // Process each transaction with payment_completed status
    for (const transaction of completedPayments) {
      // Check if the casino transfer is still pending
      const metadata = (transaction.metadata as Record<string, any> | null) || {};
      const casinoTransferStatus = metadata.casinoTransferStatus || 'pending';
      
      if (casinoTransferStatus === 'pending') {
        console.log(`Processing transaction ID: ${transaction.id} for user ID: ${transaction.userId}`);
        processed++;
        
        try {
          // Get user details from database
          const user = await storage.getUser(transaction.userId);
          if (!user || !user.casinoId || !user.casinoUsername) {
            console.error(`User not found or missing casino details for transaction ID: ${transaction.id}`);
            continue;
          }
          
          // Extract transaction amount
          const amount = parseFloat(transaction.amount.toString());
          if (isNaN(amount) || amount <= 0) {
            console.error(`Invalid amount for transaction ID: ${transaction.id}`);
            continue;
          }
          
          console.log(`Attempting casino transfer for user: ${user.username} (Casino ID: ${user.casinoId})`);
          console.log(`Amount: ${amount} ${transaction.currency}`);
          
          // Generate a unique nonce
          const nonce = `nonce_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
          
          // Create a detailed comment with nonce and payment reference
          const comment = `An amount of ${amount} ${transaction.currency || 'PHP'} has been deposited. Nonce: ${nonce}. TMPay Web App Transaction.`;
          
          // Get the top manager for this user (use stored value or default to first allowed top manager)
          // Make sure we're using the correct top manager that has a valid token
          const topManager = user.topManager || 'Marcthepogi';
          console.log(`Using top manager '${topManager}' for casino transfer`);
          
          // Call casino API to transfer funds
          // The API will handle getting the correct token for this top manager
          const transferResult = await casino747Api.transferFunds(
            amount,
            parseInt(user.casinoId),
            user.casinoUsername,
            "PHP",
            topManager,
            comment
          );
          
          console.log(`Casino transfer successful:`, transferResult);
          
          // Update transaction status to completed
          await storage.updateTransactionStatus(
            transaction.id,
            "completed",
            transferResult.transactionId || undefined,
            { 
              nonce,
              casinoTransactionId: transferResult.transactionId,
              casinoTransferStatus: 'completed',
              casinoTransferCompletedAt: new Date().toISOString()
            }
          );
          
          // Success entry is added through the transaction status update
          console.log(`Casino transfer completed with ID ${transferResult.transactionId}`);
          
          // Update user balance records if needed
          // This depends on when the balance was updated (at payment completion or should be at casino transfer)
          
          succeeded++;
        } catch (error) {
          console.error(`Error processing casino transfer for transaction ID: ${transaction.id}:`, error);
          
          // Update transaction metadata to reflect the error
          await storage.updateTransactionStatus(
            transaction.id,
            "payment_completed", // Keep payment_completed status
            undefined,
            { 
              casinoTransferStatus: 'failed',
              casinoTransferError: error instanceof Error ? error.message : String(error),
              casinoTransferAttemptedAt: new Date().toISOString()
            }
          );
          
          // Failure entry is recorded through transaction status update
          console.log(`Casino transfer failed: ${error instanceof Error ? error.message : String(error)}`);
          
          failed++;
        }
      }
    }
    
    console.log(`Processed ${processed} transactions with pending casino transfers`);
    console.log(`- Successful transfers: ${succeeded}`);
    console.log(`- Failed transfers: ${failed}`);
    
  } catch (error) {
    console.error('Error while processing pending casino transfers:', error);
  }
}

// When running with node -e or as a module, this will execute the function
processPendingCasinoTransfers()
  .then(() => {
    console.log('Finished processing pending casino transfers');
    // Don't exit if imported as a module
  })
  .catch(error => {
    console.error('Fatal error during processing:', error);
    // Don't exit if imported as a module
  });

export { processPendingCasinoTransfers };