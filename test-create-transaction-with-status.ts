/**
 * Test script to create a transaction with gcash_status and casino_status fields
 * This verifies that we can properly set and retrieve these status fields
 */

import { db } from './server/db';
import { transactions } from './shared/schema';
import { eq } from 'drizzle-orm';

async function createTransactionWithStatus() {
  console.log('Starting test to create a transaction with dual status fields...');
  
  try {
    // Generate a unique reference
    const reference = `TEST_TX_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Create a new test transaction with both status fields
    const newTransaction = await db.insert(transactions).values({
      userId: 1, // Assuming user ID 1 exists
      type: 'deposit',
      method: 'gcash_qr',
      amount: '100.00',
      status: 'processing', // Overall transaction status
      gcashStatus: 'processing', // GCash payment status
      casinoStatus: 'pending', // Casino transfer status
      paymentReference: reference,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    console.log('Created new transaction:');
    console.log('Transaction ID:', newTransaction[0].id);
    console.log('Reference:', newTransaction[0].paymentReference);
    console.log('Status:', newTransaction[0].status);
    console.log('GCash Status:', newTransaction[0].gcashStatus);
    console.log('Casino Status:', newTransaction[0].casinoStatus);
    
    // Retrieve the transaction to verify
    const retrievedTransaction = await db.select()
      .from(transactions)
      .where(eq(transactions.id, newTransaction[0].id));
    
    console.log('\nRetrieved transaction:');
    console.log('Transaction ID:', retrievedTransaction[0].id);
    console.log('Reference:', retrievedTransaction[0].paymentReference);
    console.log('Status:', retrievedTransaction[0].status);
    console.log('GCash Status:', retrievedTransaction[0].gcashStatus);
    console.log('Casino Status:', retrievedTransaction[0].casinoStatus);
    
    // Update the GCash status and verify overall status update
    console.log('\nUpdating GCash status to "success"...');
    await db.update(transactions)
      .set({ 
        gcashStatus: 'success',
        status: 'payment_completed',
        updatedAt: new Date()
      })
      .where(eq(transactions.id, newTransaction[0].id));
    
    const afterGcashUpdate = await db.select()
      .from(transactions)
      .where(eq(transactions.id, newTransaction[0].id));
    
    console.log('After GCash update:');
    console.log('Status:', afterGcashUpdate[0].status);
    console.log('GCash Status:', afterGcashUpdate[0].gcashStatus);
    console.log('Casino Status:', afterGcashUpdate[0].casinoStatus);
    
    // Update the Casino status and verify overall status update
    console.log('\nUpdating Casino status to "completed"...');
    await db.update(transactions)
      .set({ 
        casinoStatus: 'completed',
        status: 'completed',
        updatedAt: new Date()
      })
      .where(eq(transactions.id, newTransaction[0].id));
    
    const afterCasinoUpdate = await db.select()
      .from(transactions)
      .where(eq(transactions.id, newTransaction[0].id));
    
    console.log('After Casino update:');
    console.log('Status:', afterCasinoUpdate[0].status);
    console.log('GCash Status:', afterCasinoUpdate[0].gcashStatus);
    console.log('Casino Status:', afterCasinoUpdate[0].casinoStatus);
    
    console.log('\nTest completed successfully!');
    return true;
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
}

// Execute the test
createTransactionWithStatus()
  .then(success => {
    console.log(success ? 'All steps completed successfully!' : 'Test failed!');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });