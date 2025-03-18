/**
 * Simple script to check transaction 29 status and try to complete it if needed
 */

import { db } from './server/db.js';
import * as schema from './shared/schema.js';
import { eq } from 'drizzle-orm';
import { Casino747Api } from './server/casino747Api.js';

// Create a casino API instance
const casino747Api = new Casino747Api();

async function checkTransaction() {
  console.log("Checking transaction 29...");
  
  // Find the transaction
  const transaction = await db.query.transactions.findFirst({
    where: eq(schema.transactions.id, 29)
  });
  
  if (!transaction) {
    console.error("Transaction 29 not found");
    return;
  }
  
  console.log("Transaction found:");
  console.log(`ID: ${transaction.id}`);
  console.log(`Status: ${transaction.status}`);
  console.log(`GCash Status: ${transaction.gcashStatus}`);
  console.log(`Casino Status: ${transaction.casinoStatus}`);
  console.log(`User ID: ${transaction.userId}`);
  console.log(`Metadata:`, transaction.metadata);
  
  // Get the user
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, transaction.userId)
  });
  
  if (!user) {
    console.error(`User ${transaction.userId} not found`);
    return;
  }
  
  console.log("\nUser details:");
  console.log(`Username: ${user.username}`);
  console.log(`Casino ID: ${user.casinoId}`);
  console.log(`Casino Username: ${user.casinoUsername}`);
  console.log(`Top Manager: ${user.topManager}`);
  
  // If transaction is already completed, just report that
  if (transaction.status === 'completed') {
    console.log("\nTransaction is already completed.");
    return;
  }
  
  // If transaction is payment_completed but casino_transfer_pending, try to complete it
  if (transaction.status === 'payment_completed' || transaction.casinoStatus === 'pending') {
    console.log("\nAttempting to complete casino transfer...");
    
    try {
      // Create a nonce to track this attempt
      const nonce = `retry_nonce_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const paymentAmount = parseFloat(transaction.amount.toString());
      const currency = transaction.currency || 'PHP';
      const topManager = user.topManager || 'Marcthepogi';
      
      // Comment for the transfer
      const comment = `Retry: Amount ${paymentAmount} ${currency} deposit. Nonce: ${nonce}. TMPay Web App Transaction.`;
      
      console.log(`Attempting casino transfer with nonce: ${nonce}`);
      console.log(`Amount: ${paymentAmount} ${currency}`);
      console.log(`From: ${topManager} to ${user.casinoUsername} (ID: ${user.casinoId})`);
      
      // Make the casino transfer
      const transferResult = await casino747Api.transferFunds(
        paymentAmount,
        parseInt(user.casinoId),
        user.casinoUsername,
        "PHP",
        topManager,
        comment
      );
      
      console.log("Transfer result:", transferResult);
      
      // Update the transaction
      const updateResult = await db.update(schema.transactions)
        .set({
          status: 'completed',
          casinoStatus: 'completed',
          metadata: {
            ...(transaction.metadata || {}),
            nonce,
            casinoTransactionId: transferResult.transactionId,
            casinoTransferStatus: 'completed',
            casinoTransferCompletedAt: new Date().toISOString(),
            retryAttempt: true
          }
        })
        .where(eq(schema.transactions.id, transaction.id))
        .returning();
      
      console.log("Transaction successfully updated:", updateResult);
      
    } catch (error) {
      console.error("Error completing casino transfer:", error.message);
    }
  } else {
    console.log(`\nTransaction status (${transaction.status}) doesn't support retry.`);
  }
}

// Run the check
checkTransaction()
  .then(() => console.log("Done"))
  .catch(err => console.error("Error:", err))
  .finally(() => process.exit());