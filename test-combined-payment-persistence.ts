/**
 * Comprehensive test script to verify persistence of all payment types
 * 
 * This test validates that:
 * 1. QR payments are correctly stored and retrieved from the database
 * 2. Telegram payments are correctly stored and retrieved from the database
 * 3. Manual payments are correctly stored and retrieved from the database
 * 4. Status updates for all payment types work correctly
 */

import { db } from './server/db';
import { 
  qrPayments, 
  telegramPayments,
  manualPayments,
  transactions,
  InsertQrPayment,
  InsertTelegramPayment,
  InsertManualPayment,
  InsertTransaction
} from './shared/schema';
import { eq } from 'drizzle-orm';

function generateTestReference(): string {
  return `TEST-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;
}

async function testTransactionPersistence() {
  console.log('=== Testing Transaction Persistence ===');
  
  try {
    // Generate a unique reference for this test
    const reference = generateTestReference();
    
    // 1. Create a test transaction record
    console.log(`Creating test transaction with reference: ${reference}`);
    
    const transactionData: InsertTransaction = {
      userId: 1,
      type: 'deposit',
      method: 'bank_transfer',
      amount: '500.00',
      status: 'pending',
      currency: 'PHP',
      paymentReference: reference,
      metadata: { test: true }
    };
    
    // Insert directly into the database
    const inserted = await db.insert(transactions).values({
      ...transactionData,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    if (!inserted || inserted.length === 0) {
      throw new Error('Failed to insert transaction record');
    }
    
    const transactionId = inserted[0].id;
    console.log(`Transaction created with ID: ${transactionId}`);
    
    // Return the transaction ID for use in other tests
    return transactionId;
    
  } catch (error) {
    console.error('Error during transaction persistence test:', error);
    throw error;
  }
}

async function testQrPaymentPersistence(transactionId: number) {
  console.log('\n=== Testing QR Payment Persistence ===');
  
  try {
    // Generate a unique reference for this test
    const reference = generateTestReference();
    
    // 1. Create a test QR payment record
    console.log(`Creating test QR payment with reference: ${reference}`);
    
    const qrData: InsertQrPayment = {
      userId: 1,
      transactionId,
      qrCodeData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAABlBMVEX///8AAABVwtN+AAAByklEQVR4nO2ZMWobURSGv7kZD+5VFOjpBtpAcOnGlaFQp1JNbmAEgvUdcgvhQs0U6gSrTpBCjZvpXOgCUbDFTDITFkZoQoprz/P/zdtYOr/eu+/BfffChg0bNmzYsGHDhg0bNmz8f8YiZFU9wSLXW7wZrfn2oA8yP9/Y2MvW1jj6oJfZ2V7hx6Gq8c5yXO9DxvwXOagsNu+Dvfed8znKXKlsR+p+e7LOuPeh6/wDZ2e33U14SyPZp+v5qsJ1r5mXh676nIe+I9nZ+mVvM+qD6t1dXZ4K+dAzjucWF7GQj+C9tz1mVL7+LnLF94vvr9TuJrt0N+HUZ4I2YWK8GlR3YabjbsLUb1lVVXXL5gfHFmTe25B1n0dZsQwC7fqgxGzxFmbUh7r1ZZT/9hl1Nz3XO9Y+p3qo6W5U2Vbcbz7pYBEe3Lvbjxs5jX3WQx9E8tHD+Yw96CwOW1MttPQtjbcNa/xkUbONdaavX+x8fIsdO3oLPusuKAubF9aZzl5V2U7GsxCfPa2wvSs4fnacP/QW2vQxLRc+a6KnTFD7u9EHvWNtzLeGrCp9/Zps/o2ybzTZs+e2jI2PPxtf5P+J2LBhw4YNGzZs2LBhw4aNfxk/AaZn4Ew4ERLfAAAAAElFTkSuQmCC',
      payUrl: 'https://payment.example.com/qr/' + reference,
      amount: '200.00',
      directPayReference: reference,
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
    };
    
    // Insert directly into the database but let the database auto-generate the ID
    // Do not specify the id field to allow auto-increment
    const inserted = await db.insert(qrPayments).values({
      userId: qrData.userId,
      transactionId: qrData.transactionId,
      qrCodeData: qrData.qrCodeData,
      payUrl: qrData.payUrl,
      amount: qrData.amount,
      directPayReference: qrData.directPayReference,
      status: qrData.status,
      expiresAt: qrData.expiresAt,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    if (!inserted || inserted.length === 0) {
      throw new Error('Failed to insert QR payment record');
    }
    
    const qrPaymentId = inserted[0].id;
    console.log(`QR payment created with ID: ${qrPaymentId}`);
    
    // 2. Retrieve the payment by ID
    const fetchedById = await db.select().from(qrPayments).where(eq(qrPayments.id, qrPaymentId));
    
    if (!fetchedById || fetchedById.length === 0) {
      throw new Error(`Failed to retrieve QR payment by ID: ${qrPaymentId}`);
    }
    
    console.log(`Successfully retrieved QR payment by ID: ${fetchedById[0].id}`);
    console.log(`Amount: ${fetchedById[0].amount}, Status: ${fetchedById[0].status}`);
    
    // 3. Retrieve the payment by reference
    const fetchedByRef = await db.select().from(qrPayments).where(eq(qrPayments.directPayReference, reference));
    
    if (!fetchedByRef || fetchedByRef.length === 0) {
      throw new Error(`Failed to retrieve QR payment by reference: ${reference}`);
    }
    
    console.log(`Successfully retrieved QR payment by reference: ${fetchedByRef[0].directPayReference}`);
    
    // 4. Update payment status
    console.log('Updating QR payment status to "completed"...');
    
    await db.update(qrPayments)
      .set({
        status: 'completed',
        updatedAt: new Date()
      })
      .where(eq(qrPayments.id, qrPaymentId));
    
    // Verify status update
    const fetchedAfterStatusUpdate = await db.select().from(qrPayments).where(eq(qrPayments.id, qrPaymentId));
    
    if (fetchedAfterStatusUpdate[0].status !== 'completed') {
      throw new Error(`Failed to update QR payment status. Expected "completed", got "${fetchedAfterStatusUpdate[0].status}"`);
    }
    
    console.log(`Successfully updated QR payment status to: ${fetchedAfterStatusUpdate[0].status}`);
    
    // Return QR payment ID for cleanup
    return qrPaymentId;
    
  } catch (error) {
    console.error('Error during QR payment persistence test:', error);
    throw error;
  }
}

async function testTelegramPaymentPersistence(transactionId: number) {
  console.log('\n=== Testing Telegram Payment Persistence ===');
  
  try {
    // Generate a unique reference for this test
    const reference = generateTestReference();
    const invoiceCode = 'INV-' + Date.now();
    
    // 1. Create a test Telegram payment record
    console.log(`Creating test Telegram payment with reference: ${reference}`);
    
    const telegramData: InsertTelegramPayment = {
      userId: 1,
      transactionId,
      payUrl: 'https://t.me/payment/' + invoiceCode,
      amount: '150.00',
      currency: 'PHPT',
      telegramReference: reference,
      invoiceId: invoiceCode,
      status: 'pending',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    };
    
    // Insert directly into the database but let the database auto-generate the ID
    const inserted = await db.insert(telegramPayments).values({
      userId: telegramData.userId,
      transactionId: telegramData.transactionId,
      payUrl: telegramData.payUrl,
      amount: telegramData.amount,
      currency: telegramData.currency,
      telegramReference: telegramData.telegramReference,
      invoiceId: telegramData.invoiceId,
      status: telegramData.status,
      expiresAt: telegramData.expiresAt,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    if (!inserted || inserted.length === 0) {
      throw new Error('Failed to insert Telegram payment record');
    }
    
    const telegramPaymentId = inserted[0].id;
    console.log(`Telegram payment created with ID: ${telegramPaymentId}`);
    
    // 2. Retrieve the payment by ID
    const fetchedById = await db.select().from(telegramPayments).where(eq(telegramPayments.id, telegramPaymentId));
    
    if (!fetchedById || fetchedById.length === 0) {
      throw new Error(`Failed to retrieve Telegram payment by ID: ${telegramPaymentId}`);
    }
    
    console.log(`Successfully retrieved Telegram payment by ID: ${fetchedById[0].id}`);
    console.log(`Amount: ${fetchedById[0].amount}, Status: ${fetchedById[0].status}`);
    
    // 3. Retrieve the payment by invoice code
    const fetchedByInvoice = await db.select().from(telegramPayments).where(eq(telegramPayments.invoiceId, invoiceCode));
    
    if (!fetchedByInvoice || fetchedByInvoice.length === 0) {
      throw new Error(`Failed to retrieve Telegram payment by invoice code: ${invoiceCode}`);
    }
    
    console.log(`Successfully retrieved Telegram payment by invoice code: ${fetchedByInvoice[0].invoiceId}`);
    
    // 4. Update payment status
    console.log('Updating Telegram payment status to "completed"...');
    
    await db.update(telegramPayments)
      .set({
        status: 'completed',
        updatedAt: new Date()
      })
      .where(eq(telegramPayments.id, telegramPaymentId));
    
    // Verify status update
    const fetchedAfterStatusUpdate = await db.select().from(telegramPayments).where(eq(telegramPayments.id, telegramPaymentId));
    
    if (fetchedAfterStatusUpdate[0].status !== 'completed') {
      throw new Error(`Failed to update Telegram payment status. Expected "completed", got "${fetchedAfterStatusUpdate[0].status}"`);
    }
    
    console.log(`Successfully updated Telegram payment status to: ${fetchedAfterStatusUpdate[0].status}`);
    
    // Return Telegram payment ID for cleanup
    return telegramPaymentId;
    
  } catch (error) {
    console.error('Error during Telegram payment persistence test:', error);
    throw error;
  }
}

async function testManualPaymentPersistence(transactionId: number) {
  console.log('\n=== Testing Manual Payment Persistence ===');
  
  try {
    // Generate a unique reference for this test
    const reference = generateTestReference();
    
    // 1. Create a test manual payment record
    console.log(`Creating test manual payment with reference: ${reference}`);
    
    const manualData: InsertManualPayment = {
      userId: 1,
      transactionId,
      amount: '300.00',
      paymentMethod: 'bank_transfer',
      notes: 'Test manual payment from integrated test',
      proofImageUrl: 'https://example.com/receipt.jpg',
      reference,
      status: 'pending',
      adminId: null,
      adminNotes: null
    };
    
    // Insert directly into the database but let the database auto-generate the ID
    const inserted = await db.insert(manualPayments).values({
      userId: manualData.userId,
      transactionId: manualData.transactionId,
      amount: manualData.amount,
      paymentMethod: manualData.paymentMethod,
      notes: manualData.notes,
      proofImageUrl: manualData.proofImageUrl,
      reference: manualData.reference,
      status: manualData.status,
      adminId: manualData.adminId,
      adminNotes: manualData.adminNotes,
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
    
    // 3. Update payment status
    console.log('Updating manual payment status to "processing"...');
    
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
    
    // Return manual payment ID for cleanup
    return manualPaymentId;
    
  } catch (error) {
    console.error('Error during manual payment persistence test:', error);
    throw error;
  }
}

async function cleanupTestData(transactionId: number, qrPaymentId: number, telegramPaymentId: number, manualPaymentId: number) {
  console.log('\n=== Cleaning up test data ===');
  
  try {
    // Delete the test payment records
    await db.delete(qrPayments).where(eq(qrPayments.id, qrPaymentId));
    console.log(`Deleted QR payment with ID: ${qrPaymentId}`);
    
    await db.delete(telegramPayments).where(eq(telegramPayments.id, telegramPaymentId));
    console.log(`Deleted Telegram payment with ID: ${telegramPaymentId}`);
    
    await db.delete(manualPayments).where(eq(manualPayments.id, manualPaymentId));
    console.log(`Deleted Manual payment with ID: ${manualPaymentId}`);
    
    // Delete the test transaction record
    await db.delete(transactions).where(eq(transactions.id, transactionId));
    console.log(`Deleted Transaction with ID: ${transactionId}`);
    
    console.log('Test cleanup complete');
  } catch (error) {
    console.error('Error during test cleanup:', error);
  }
}

async function runTests() {
  try {
    // Run the transaction test first
    const transactionId = await testTransactionPersistence();
    
    // Run the payment tests using the transaction ID
    const qrPaymentId = await testQrPaymentPersistence(transactionId);
    const telegramPaymentId = await testTelegramPaymentPersistence(transactionId);
    const manualPaymentId = await testManualPaymentPersistence(transactionId);
    
    // Clean up all test data
    await cleanupTestData(transactionId, qrPaymentId, telegramPaymentId, manualPaymentId);
    
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