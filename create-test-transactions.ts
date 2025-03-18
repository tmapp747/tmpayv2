/**
 * Script to create test transactions with different statuses to verify the UI
 */
import { db } from './server/db';
import { transactions } from './shared/schema';

async function createTestTransactions() {
  try {
    console.log('Connecting to database...');
    
    // Create a transaction with payment_completed status (payment done, casino transfer pending)
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
    
    // Transaction 1: payment_completed with pending casino transfer
    const transaction1 = await db.insert(transactions)
      .values({
        userId: 8, // Make sure this user exists in your database
        type: 'casino_deposit',
        method: 'gcash',
        amount: '1000.00',
        currency: 'PHP',
        status: 'payment_completed',
        reference: `TEST-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        metadata: {
          paymentCompletedAt: fiveMinutesAgo.toISOString(),
          casinoTransferStatus: 'pending'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    console.log('Created transaction with payment_completed status:', transaction1);
    
    // Transaction 2: payment_completed with failed casino transfer
    const transaction2 = await db.insert(transactions)
      .values({
        userId: 8, // Same user
        type: 'casino_deposit',
        method: 'gcash',
        amount: '500.00',
        currency: 'PHP',
        status: 'payment_completed',
        reference: `TEST-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        metadata: {
          paymentCompletedAt: fiveMinutesAgo.toISOString(),
          casinoTransferStatus: 'failed',
          casinoTransferError: 'Casino API temporarily unavailable'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    console.log('Created transaction with failed casino transfer:', transaction2);
    
    // Transaction 3: Fully completed transaction (both payment and casino transfer)
    const transaction3 = await db.insert(transactions)
      .values({
        userId: 8, // Same user
        type: 'casino_deposit',
        method: 'gcash',
        amount: '2000.00',
        currency: 'PHP',
        status: 'completed',
        reference: `TEST-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        metadata: {
          paymentCompletedAt: fiveMinutesAgo.toISOString(),
          casinoTransferStatus: 'completed',
          casinoTransferCompletedAt: now.toISOString()
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: now
      })
      .returning();
    
    console.log('Created fully completed transaction:', transaction3);
    
    console.log('Successfully created test transactions');
  } catch (error) {
    console.error('Error creating test transactions:', error);
  }
}

createTestTransactions()
  .then(() => {
    console.log('Creation completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });