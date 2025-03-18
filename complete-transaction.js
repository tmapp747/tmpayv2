/**
 * Simple script to manually complete a transaction
 * This bypasses the casino API and directly updates the transaction in the database
 */

// ES Module imports
import { db } from './server/db';
import { eq } from 'drizzle-orm';
import { transactions, users } from './shared/schema';

async function completeTransaction(transactionId) {
  try {
    console.log(`Starting manual transaction completion for ID: ${transactionId}`);
    
    // 1. Fetch the transaction from the database
    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, transactionId)
    });
    
    if (!transaction) {
      console.error(`❌ Transaction with ID ${transactionId} not found`);
      return { success: false, message: 'Transaction not found' };
    }
    
    console.log(`📄 Found transaction: ${JSON.stringify(transaction, null, 2)}`);
    
    // 2. Check if transaction is in the correct state
    if (transaction.status !== 'payment_completed') {
      console.error(`❌ Transaction is not in payment_completed status. Current status: ${transaction.status}`);
      return { success: false, message: `Transaction is in ${transaction.status} status, not payment_completed` };
    }
    
    // 3. Fetch the user
    const user = await db.query.users.findFirst({
      where: eq(users.id, transaction.userId)
    });
    
    if (!user) {
      console.error(`❌ User with ID ${transaction.userId} not found`);
      return { success: false, message: 'User not found' };
    }
    
    console.log(`👤 Found user: ${user.username}`);
    
    // 4. Prepare completion metadata
    const amount = parseFloat(transaction.amount);
    const balanceBefore = parseFloat(user.balance);
    const balanceAfter = balanceBefore + amount;
    
    const completionMetadata = {
      casinoNonce: `manual-${Date.now()}`,
      casinoTransactionId: `manual-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      casinoTransferStatus: 'completed',
      casinoTransferCompletedAt: new Date(),
      manuallyCompleted: true,
      paymentCompletedAt: new Date(),
      completedByScript: true
    };
    
    // 5. Update transaction status to completed
    await db.update(transactions)
      .set({
        status: 'completed',
        updatedAt: new Date(),
        completedAt: new Date(),
        metadata: completionMetadata,
        balanceBefore: balanceBefore.toString(),
        balanceAfter: balanceAfter.toString()
      })
      .where(eq(transactions.id, transactionId));
    
    console.log(`✅ Updated transaction status to completed`);
    
    // 6. Update user balance
    await db.update(users)
      .set({
        balance: balanceAfter.toString(),
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));
    
    console.log(`💰 Updated user balance from ${balanceBefore} to ${balanceAfter}`);
    
    // 7. Verify the transaction was completed successfully
    const updatedTransaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, transactionId)
    });
    
    console.log(`📄 Updated transaction: ${JSON.stringify(updatedTransaction, null, 2)}`);
    
    return { 
      success: true, 
      message: 'Transaction completed successfully',
      transaction: updatedTransaction
    };
  } catch (error) {
    console.error(`❌ Error completing transaction: ${error.message}`);
    console.error(error.stack);
    return { success: false, message: `Error: ${error.message}` };
  }
}

// Run the script with transaction ID 24
const transactionId = 24;

console.log(`🔄 Starting manual completion for transaction ID: ${transactionId}`);
completeTransaction(transactionId)
  .then(result => {
    console.log(`\n🔍 RESULT: ${result.success ? '✅ Success' : '❌ Failed'}`);
    console.log(result.message);
    if (result.transaction) {
      console.log(`Final status: ${result.transaction.status}`);
      console.log(`Metadata: ${JSON.stringify(result.transaction.metadata, null, 2)}`);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error(`❌ Fatal error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  });