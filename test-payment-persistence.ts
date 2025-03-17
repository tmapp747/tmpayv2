/**
 * Test script to verify QR payment and Telegram payment persistence in database
 * 
 * This test validates that:
 * 1. QR payments are correctly stored in the database
 * 2. QR payments can be retrieved from the database
 * 3. Telegram payments are correctly stored in the database
 * 4. Telegram payments can be retrieved from the database
 */

import { storage } from './server/storage';
import { db } from './server/db';
import { qrPayments, telegramPayments } from './shared/schema';
import { InsertQrPayment, InsertTelegramPayment } from './shared/schema';
import { eq } from 'drizzle-orm';

// Helper function to generate a test reference
function generateTestReference(): string {
  return `TEST-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
}

// Test QR payment persistence
async function testQrPaymentPersistence() {
  console.log('-------------------------------------------');
  console.log('TESTING QR PAYMENT DATABASE PERSISTENCE');
  console.log('-------------------------------------------');
  
  try {
    // Generate test data
    const userId = 1; // Use an existing user
    const amount = 100;
    const reference = generateTestReference();
    const transactionId = 1; // Use an existing transaction
    
    // 1. Create QR payment in storage
    const qrData: InsertQrPayment = {
      userId,
      transactionId,
      amount: amount.toString(),
      qrCodeData: 'data:image/png;base64,TEST_QR_DATA',
      payUrl: 'https://test.payment.url',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      directPayReference: reference,
      status: 'pending',
    };
    
    console.log('Creating test QR payment...');
    const createdQrPayment = await storage.createQrPayment(qrData);
    console.log(`Created QR payment with ID: ${createdQrPayment.id}`);
    
    // 2. Verify we can find the QR payment by reference
    console.log('Verifying QR payment reference lookup...');
    const foundQrPayment = await storage.getQrPaymentByReference(reference);
    
    if (foundQrPayment) {
      console.log('✅ Successfully retrieved QR payment by reference');
      console.log(`QR Payment ID: ${foundQrPayment.id}`);
      console.log(`Reference: ${foundQrPayment.directPayReference}`);
    } else {
      console.error('❌ Failed to retrieve QR payment by reference');
    }
    
    // 3. Update the payment status
    console.log('Updating QR payment status...');
    await storage.updateQrPaymentStatus(createdQrPayment.id, 'expired');
    
    // 4. Verify the status update
    const updatedQrPayment = await storage.getQrPayment(createdQrPayment.id);
    if (updatedQrPayment && updatedQrPayment.status === 'expired') {
      console.log('✅ Successfully updated QR payment status');
    } else {
      console.error('❌ Failed to update QR payment status');
    }
    
    // 5. Check with direct database query
    console.log('Verifying with direct database query...');
    const dbResult = await db.select().from(qrPayments).where(eq(qrPayments.id, createdQrPayment.id));
    
    if (dbResult.length > 0) {
      console.log('✅ QR payment found in database');
      console.log(`Database record status: ${dbResult[0].status}`);
    } else {
      console.error('❌ QR payment not found in database');
    }
    
    return true;
  } catch (error) {
    console.error('Error in QR payment persistence test:', error);
    return false;
  }
}

// Test Telegram payment persistence
async function testTelegramPaymentPersistence() {
  console.log('-------------------------------------------');
  console.log('TESTING TELEGRAM PAYMENT DATABASE PERSISTENCE');
  console.log('-------------------------------------------');
  
  try {
    // Generate test data
    const userId = 1; // Use an existing user
    const amount = 150;
    const reference = generateTestReference();
    const transactionId = 1; // Use an existing transaction
    
    // 1. Create Telegram payment in storage
    const telegramData: InsertTelegramPayment = {
      userId,
      transactionId,
      amount: amount.toString(),
      currency: 'PHPT',
      payUrl: 'https://test.payment.url',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 60 minutes from now
      telegramReference: reference,
      invoiceId: `INV-${Date.now()}`,
      status: 'pending',
    };
    
    console.log('Creating test Telegram payment...');
    const createdTelegramPayment = await storage.createTelegramPayment(telegramData);
    console.log(`Created Telegram payment with ID: ${createdTelegramPayment.id}`);
    
    // 2. Verify we can find the Telegram payment by reference
    console.log('Verifying Telegram payment reference lookup...');
    const foundTelegramPayment = await storage.getTelegramPaymentByReference(reference);
    
    if (foundTelegramPayment) {
      console.log('✅ Successfully retrieved Telegram payment by reference');
      console.log(`Telegram Payment ID: ${foundTelegramPayment.id}`);
      console.log(`Reference: ${foundTelegramPayment.telegramReference}`);
    } else {
      console.error('❌ Failed to retrieve Telegram payment by reference');
    }
    
    // 3. Update the payment status
    console.log('Updating Telegram payment status...');
    await storage.updateTelegramPaymentStatus(createdTelegramPayment.id, 'completed');
    
    // 4. Verify the status update
    const updatedTelegramPayment = await storage.getTelegramPayment(createdTelegramPayment.id);
    if (updatedTelegramPayment && updatedTelegramPayment.status === 'completed') {
      console.log('✅ Successfully updated Telegram payment status');
    } else {
      console.error('❌ Failed to update Telegram payment status');
    }
    
    // 5. Check with direct database query
    console.log('Verifying with direct database query...');
    const dbResult = await db.select().from(telegramPayments).where(tp => tp.id.equals(createdTelegramPayment.id));
    
    if (dbResult.length > 0) {
      console.log('✅ Telegram payment found in database');
      console.log(`Database record status: ${dbResult[0].status}`);
    } else {
      console.error('❌ Telegram payment not found in database');
    }
    
    return true;
  } catch (error) {
    console.error('Error in Telegram payment persistence test:', error);
    return false;
  }
}

// Test refreshing data from database
async function testRefreshFromDatabase() {
  console.log('-------------------------------------------');
  console.log('TESTING DATABASE REFRESH FUNCTIONALITY');
  console.log('-------------------------------------------');
  
  try {
    // 1. Get all QR payments
    console.log('Getting all QR payments...');
    const qrPaymentsMap = storage.getAllQrPayments();
    console.log(`Number of QR payments in memory: ${qrPaymentsMap.size}`);
    
    // 2. Get all Telegram payments
    console.log('Getting all Telegram payments...');
    const telegramPaymentsMap = storage.getAllTelegramPayments();
    console.log(`Number of Telegram payments in memory: ${telegramPaymentsMap.size}`);
    
    // 3. Check actual counts in database directly
    console.log('Checking database counts directly...');
    const qrCount = await db.select().from(qrPayments).then(rows => rows.length);
    const telegramCount = await db.select().from(telegramPayments).then(rows => rows.length);
    
    console.log(`Number of QR payments in database: ${qrCount}`);
    console.log(`Number of Telegram payments in database: ${telegramCount}`);
    
    // 4. Verify that counts match or at least database has at least as many as memory
    if (qrCount >= qrPaymentsMap.size) {
      console.log('✅ QR payments database count is consistent with memory');
    } else {
      console.error('❌ QR payments count mismatch between database and memory');
    }
    
    if (telegramCount >= telegramPaymentsMap.size) {
      console.log('✅ Telegram payments database count is consistent with memory');
    } else {
      console.error('❌ Telegram payments count mismatch between database and memory');
    }
    
    return true;
  } catch (error) {
    console.error('Error in database refresh test:', error);
    return false;
  }
}

// Run all tests
async function runTests() {
  try {
    console.log('===== PAYMENT PERSISTENCE TESTS =====');
    
    // Test QR payment persistence
    const qrResult = await testQrPaymentPersistence();
    console.log(qrResult ? '✅ QR Payment persistence test succeeded' : '❌ QR Payment persistence test failed');
    
    // Test Telegram payment persistence
    const telegramResult = await testTelegramPaymentPersistence();
    console.log(telegramResult ? '✅ Telegram Payment persistence test succeeded' : '❌ Telegram Payment persistence test failed');
    
    // Test refreshing from database
    const refreshResult = await testRefreshFromDatabase();
    console.log(refreshResult ? '✅ Database refresh test succeeded' : '❌ Database refresh test failed');
    
    console.log('===== ALL TESTS COMPLETED =====');
    
  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    // Close database connection
    await db.end();
  }
}

// Run the tests
runTests();