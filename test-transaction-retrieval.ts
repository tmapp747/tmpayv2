/**
 * Test script to verify transaction retrieval from the database
 * This tests that the newly added gcash_status and casino_status columns are working properly
 */

import { db } from './server/db';
import { transactions } from './shared/schema';
import { eq } from 'drizzle-orm';

async function testTransactionRetrieval() {
  console.log('Starting transaction retrieval test...');
  
  try {
    // Query all transactions from the database
    const allTransactions = await db.select().from(transactions);
    
    console.log(`Retrieved ${allTransactions.length} transactions from database`);
    
    // Print the first transaction details
    if (allTransactions.length > 0) {
      const firstTransaction = allTransactions[0];
      console.log('First transaction details:');
      console.log('ID:', firstTransaction.id);
      console.log('User ID:', firstTransaction.userId);
      console.log('Type:', firstTransaction.type);
      console.log('Method:', firstTransaction.method);
      console.log('Amount:', firstTransaction.amount);
      console.log('Status:', firstTransaction.status);
      console.log('GCash Status:', firstTransaction.gcashStatus);
      console.log('Casino Status:', firstTransaction.casinoStatus);
      console.log('Created At:', firstTransaction.createdAt);
    }
    
    // Test retrieving transactions by user ID
    console.log('\nTesting retrieval by user ID...');
    const userId = 1; // Assuming user ID 1 exists
    const userTransactions = await db.select()
      .from(transactions)
      .where(eq(transactions.userId, userId));
    
    console.log(`Retrieved ${userTransactions.length} transactions for user ID ${userId}`);
    
    console.log('Transaction retrieval test completed successfully!');
    return true;
  } catch (error) {
    console.error('Transaction retrieval test failed:', error);
    return false;
  }
}

// Execute the test
testTransactionRetrieval()
  .then(success => {
    console.log(success ? 'Test completed successfully!' : 'Test failed!');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });