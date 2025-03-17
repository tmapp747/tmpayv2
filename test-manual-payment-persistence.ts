/**
 * Test script to verify manual payment persistence in database
 * 
 * This test validates that:
 * 1. Manual payments are correctly stored in the database
 * 2. Manual payments can be retrieved from the database
 * 3. Manual payment status updates are reflected in the database
 * 4. Manual payment document uploads are reflected in the database
 */

import { db } from './server/db';
import { 
  manualPayments,
  InsertManualPayment 
} from './shared/schema';
import { eq } from 'drizzle-orm';

function generateTestReference(): string {
  return `TEST-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;
}

async function testManualPaymentPersistence() {
  console.log('=== Testing Manual Payment Persistence ===');
  
  try {
    // Generate a unique reference for this test
    const reference = generateTestReference();
    
    // 1. Create a test manual payment record
    console.log(`Creating test manual payment with reference: ${reference}`);
    
    const manualData: InsertManualPayment = {
      userId: 1,
      transactionId: 1,
      amount: '300.00',
      paymentMethod: 'bank_transfer',
      notes: 'Test manual payment from persistence test',
      proofImageUrl: 'https://example.com/receipt.jpg',
      reference,
      status: 'pending',
      adminId: null,
      adminNotes: null
    };
    
    // Insert directly into the database
    const inserted = await db.insert(manualPayments).values({
      ...manualData,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    if (!inserted || inserted.length === 0) {
      throw new Error('Failed to insert manual payment record');
    }
    
    const manualPaymentId = inserted[0].id;
    console.log(`Manual payment created with ID: ${manualPaymentId}`);
    
    // 2. Retrieve the payment by ID
    const fetchedById = await db.select().from(manualPayments).where(eq(manualPayments.id, manualPaymentId));
    
    if (!fetchedById || fetchedById.length === 0) {
      throw new Error(`Failed to retrieve manual payment by ID: ${manualPaymentId}`);
    }
    
    console.log(`Successfully retrieved manual payment by ID: ${fetchedById[0].id}`);
    console.log(`Amount: ${fetchedById[0].amount}, Status: ${fetchedById[0].status}`);
    
    // 3. Retrieve the payment by reference
    const fetchedByRef = await db.select().from(manualPayments).where(eq(manualPayments.reference, reference));
    
    if (!fetchedByRef || fetchedByRef.length === 0) {
      throw new Error(`Failed to retrieve manual payment by reference: ${reference}`);
    }
    
    console.log(`Successfully retrieved manual payment by reference: ${fetchedByRef[0].reference}`);
    
    // 4. Update payment status
    console.log('Updating payment status to "processing"...');
    
    await db.update(manualPayments)
      .set({
        status: 'processing',
        updatedAt: new Date()
      })
      .where(eq(manualPayments.id, manualPaymentId));
    
    // Verify status update
    const fetchedAfterStatusUpdate = await db.select().from(manualPayments).where(eq(manualPayments.id, manualPaymentId));
    
    if (fetchedAfterStatusUpdate[0].status !== 'processing') {
      throw new Error(`Failed to update manual payment status. Expected "processing", got "${fetchedAfterStatusUpdate[0].status}"`);
    }
    
    console.log(`Successfully updated manual payment status to: ${fetchedAfterStatusUpdate[0].status}`);
    
    // 5. Update receipt image
    console.log('Updating payment receipt image...');
    
    const newImageUrl = 'https://example.com/updated-receipt.jpg';
    
    await db.update(manualPayments)
      .set({
        proofImageUrl: newImageUrl,
        updatedAt: new Date()
      })
      .where(eq(manualPayments.id, manualPaymentId));
    
    // Verify image update
    const fetchedAfterImageUpdate = await db.select().from(manualPayments).where(eq(manualPayments.id, manualPaymentId));
    
    if (fetchedAfterImageUpdate[0].proofImageUrl !== newImageUrl) {
      throw new Error(`Failed to update manual payment receipt image. Expected "${newImageUrl}", got "${fetchedAfterImageUpdate[0].proofImageUrl}"`);
    }
    
    console.log(`Successfully updated manual payment receipt image to: ${fetchedAfterImageUpdate[0].proofImageUrl}`);
    
    // 6. Add admin notes
    console.log('Adding admin review notes...');
    
    const adminNotes = 'Payment verified by admin';
    
    await db.update(manualPayments)
      .set({
        adminId: 999,
        adminNotes,
        status: 'completed',
        updatedAt: new Date()
      })
      .where(eq(manualPayments.id, manualPaymentId));
    
    // Verify admin notes update
    const fetchedAfterAdminUpdate = await db.select().from(manualPayments).where(eq(manualPayments.id, manualPaymentId));
    
    if (fetchedAfterAdminUpdate[0].adminNotes !== adminNotes) {
      throw new Error(`Failed to update admin notes. Expected "${adminNotes}", got "${fetchedAfterAdminUpdate[0].adminNotes}"`);
    }
    
    console.log(`Successfully added admin notes: ${fetchedAfterAdminUpdate[0].adminNotes}`);
    console.log(`Final status: ${fetchedAfterAdminUpdate[0].status}`);
    
    // 7. Clean up test data
    console.log('Cleaning up test data...');
    
    await db.delete(manualPayments).where(eq(manualPayments.id, manualPaymentId));
    
    console.log('Test cleanup complete');
    console.log('All manual payment persistence tests passed successfully!');
    
  } catch (error) {
    console.error('Error during manual payment persistence test:', error);
    throw error;
  }
}

async function runTests() {
  try {
    await testManualPaymentPersistence();
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test suite failed:', error);
  } finally {
    // Close database connection
    process.exit(0);
  }
}

// Run the tests
runTests();