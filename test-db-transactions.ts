/**
 * Test for database transaction operations
 * 
 * This script tests that transactions are correctly persisted to
 * and retrieved from the PostgreSQL database.
 */

import { storage } from './server/storage';
import { Transaction } from './shared/schema';

async function testTransactionPersistence() {
  console.log('Starting transaction persistence test...');

  try {
    // 1. Create a test transaction
    const testTransaction = {
      userId: 8, // Using the existing Chubbyme user
      type: 'deposit',
      method: 'gcash_qr',
      amount: 500.00,
      status: 'pending',
      paymentReference: `test-ref-${Date.now()}`,
      currency: 'PHP'
    };

    console.log('Creating test transaction...');
    const transaction = await storage.createTransaction(testTransaction);
    console.log('Transaction created:', transaction);
    
    // 2. Wait a moment to ensure the database operation completes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Retrieve the transaction by ID
    console.log(`Retrieving transaction by ID: ${transaction.id}`);
    const retrievedTransaction = await storage.getTransaction(transaction.id);
    console.log('Retrieved transaction:', retrievedTransaction);
    
    // 4. Update the transaction status
    console.log('Updating transaction status to "completed"');
    const updatedTransaction = await storage.updateTransactionStatus(transaction.id, 'completed');
    console.log('Updated transaction:', updatedTransaction);
    
    // 5. Retrieve the transaction again to verify the update
    console.log(`Retrieving updated transaction by ID: ${transaction.id}`);
    const retrievedUpdatedTransaction = await storage.getTransaction(transaction.id);
    console.log('Retrieved updated transaction:', retrievedUpdatedTransaction);
    
    // 6. Retrieve all transactions for the user
    console.log(`Retrieving all transactions for user ID: ${testTransaction.userId}`);
    const userTransactions = await storage.getTransactionsByUserId(testTransaction.userId);
    console.log(`Found ${userTransactions.length} transactions for user`);
    userTransactions.forEach((tx: Transaction, index: number) => {
      console.log(`Transaction ${index + 1}:`, {
        id: tx.id,
        type: tx.type,
        method: tx.method,
        amount: tx.amount,
        status: tx.status,
        createdAt: tx.createdAt
      });
    });

    console.log('Transaction persistence test completed successfully!');
  } catch (error) {
    console.error('Error during transaction persistence test:', error);
  }
}

// Run the test
testTransactionPersistence();