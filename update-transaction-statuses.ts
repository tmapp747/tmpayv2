/**
 * Script to update existing transactions with payment_completed status
 * and add the necessary metadata for the transaction timeline
 */
import { db } from './server/db';
import { transactions } from './shared/schema';
import { eq } from 'drizzle-orm';

async function updateTransactionStatuses() {
  try {
    console.log('Connecting to database...');
    
    // Retrieve completed transactions that don't have timeline metadata
    const existingTransactions = await db.query.transactions.findMany({
      where: eq(transactions.status, 'completed')
    });
    
    console.log(`Found ${existingTransactions.length} completed transactions to update`);
    
    for (const transaction of existingTransactions) {
      // Check if this transaction already has the needed metadata
      const metadata = transaction.metadata || {};
      
      if (!metadata.paymentCompletedAt && !metadata.casinoTransferStatus) {
        console.log(`Updating transaction ID: ${transaction.id}`);
        
        // Create timestamps representing the payment and casino completion times
        // Assume payment was completed 1 minute before transaction completion
        // and casino transfer completed at the time of transaction completion
        const completedAt = transaction.completedAt || transaction.updatedAt || new Date();
        const paymentCompletedAt = new Date(completedAt.getTime() - 60000); // 1 minute before
        
        // Update the transaction status to payment_completed
        // (Note: We're keeping it as 'completed' since this is a backfill)
        await db.update(transactions)
          .set({
            metadata: {
              ...metadata,
              paymentCompletedAt: paymentCompletedAt.toISOString(),
              casinoTransferStatus: 'completed',
              casinoTransferCompletedAt: completedAt.toISOString()
            }
          })
          .where(eq(transactions.id, transaction.id));
        
        console.log(`Updated transaction ID: ${transaction.id}`);
      } else {
        console.log(`Transaction ID: ${transaction.id} already has timeline metadata, skipping`);
      }
    }
    
    // Now update a transaction to have 'payment_completed' status with pending casino transfer
    // Find the most recent transaction to update as an example
    const recentTransaction = await db.query.transactions.findFirst({
      orderBy: (transactions, { desc }) => [desc(transactions.createdAt)]
    });
    
    if (recentTransaction) {
      console.log(`Updating most recent transaction ID: ${recentTransaction.id} to payment_completed status`);
      
      const metadata = recentTransaction.metadata || {};
      const now = new Date();
      
      await db.update(transactions)
        .set({
          status: 'payment_completed',
          metadata: {
            ...metadata,
            paymentCompletedAt: now.toISOString(),
            casinoTransferStatus: 'pending'
          }
        })
        .where(eq(transactions.id, recentTransaction.id));
      
      console.log(`Updated most recent transaction to payment_completed status`);
    }
    
    console.log('Successfully updated transactions with timeline metadata');
  } catch (error) {
    console.error('Error updating transactions:', error);
  }
}

updateTransactionStatuses()
  .then(() => {
    console.log('Update completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });