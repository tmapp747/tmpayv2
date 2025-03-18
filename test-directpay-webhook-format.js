/**
 * Test script for the DirectPay webhook handler
 * with the official DirectPay API payload format
 * 
 * This script:
 * 1. Creates a test GCash QR payment
 * 2. Simulates an official DirectPay webhook payload format
 * 3. Verifies the transaction is processed properly
 */

import fetch from 'node-fetch';

const baseUrl = 'http://localhost:5000';
const testUsername = 'Athan45';
const testPassword = 'pass123';
const depositAmount = 100;

// Storage for payment references and tokens
let accessToken = null;
let paymentReference = null;
let transactionId = null;

async function login() {
  try {
    console.log('🔑 Logging in as', testUsername);
    
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        password: testPassword
      })
    });
    
    const data = await response.json();
    
    if (!data.success || !data.accessToken) {
      console.error('❌ Login failed:', data.message);
      return false;
    }
    
    accessToken = data.accessToken;
    console.log('✅ Login successful. Access token:', accessToken.substring(0, 8) + '...');
    return true;
  } catch (error) {
    console.error('❌ Login error:', error);
    return false;
  }
}

async function makeAuthenticatedRequest(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    return await response.json();
  } catch (error) {
    console.error(`❌ Request error for ${endpoint}:`, error);
    return { success: false, error: error.message };
  }
}

async function generateGCashQR() {
  try {
    console.log(`💰 Generating GCash QR for PHP ${depositAmount}`);
    
    const result = await makeAuthenticatedRequest('/api/payments/gcash/generate-qr', 'POST', {
      amount: depositAmount
    });
    
    if (!result.success) {
      console.error('❌ Failed to generate GCash QR:', result.message);
      return false;
    }
    
    paymentReference = result.payment.reference;
    transactionId = result.transaction.id;
    
    console.log('✅ GCash QR generated successfully');
    console.log(`📝 Reference: ${paymentReference}`);
    console.log(`📝 Transaction ID: ${transactionId}`);
    console.log(`🔗 Payment URL: ${result.payment.payUrl}`);
    
    return true;
  } catch (error) {
    console.error('❌ GCash QR generation error:', error);
    return false;
  }
}

async function simulateOfficialWebhook() {
  try {
    console.log('🔄 Simulating official DirectPay webhook payload format...');
    
    // Create webhook payload matching DirectPay's official format
    const webhookPayload = {
      refId: paymentReference,
      invoiceNo: `INV-${Date.now()}`,
      txnDesc: `Deposit payment for ${testUsername}`,
      txnDate: new Date().toISOString(),
      txnId: `DP-${Date.now()}`,
      status: 'SUCCESS',  // Official format uses uppercase status values
      merchant_id: 'TM747',
      amount: depositAmount,
      currency: 'PHP',
      timestamp: new Date().toISOString()
    };
    
    console.log('📝 Official webhook payload:', JSON.stringify(webhookPayload, null, 2));
    
    const response = await fetch(`${baseUrl}/api/webhook/directpay/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload)
    });
    
    const result = await response.json();
    
    console.log('🔄 Webhook response:', result);
    
    return result.success;
  } catch (error) {
    console.error('❌ Webhook simulation error:', error);
    return false;
  }
}

async function verifyTransactionStatus() {
  try {
    console.log(`🔍 Checking transaction ${transactionId} status after webhook...`);
    
    // Small delay to allow database updates to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const transaction = await makeAuthenticatedRequest(`/api/transactions/${transactionId}`);
    
    if (!transaction.success) {
      console.error('❌ Failed to get transaction:', transaction.message);
      return null;
    }
    
    console.log('📝 Transaction status:', transaction.transaction.status);
    console.log('📝 Transaction metadata:', JSON.stringify(transaction.transaction.metadata, null, 2));
    
    return transaction.transaction;
  } catch (error) {
    console.error('❌ Transaction status check error:', error);
    return null;
  }
}

async function runTest() {
  console.log('🚀 Starting DirectPay official webhook format test...');
  
  // Step 1: Login
  if (!await login()) {
    console.error('❌ Test failed at login step');
    return;
  }
  
  // Step 2: Generate GCash QR
  if (!await generateGCashQR()) {
    console.error('❌ Test failed at QR generation step');
    return;
  }
  
  // Step 3: Simulate official webhook format
  if (!await simulateOfficialWebhook()) {
    console.error('❌ Test failed at webhook simulation step');
    return;
  }
  
  // Step 4: Verify transaction status
  const transaction = await verifyTransactionStatus();
  if (!transaction) {
    console.error('❌ Test failed at transaction verification step');
    return;
  }
  
  // Check if the transaction was processed correctly
  const metadata = transaction.metadata || {};
  
  // Verify that gcashStatus was properly mapped from uppercase SUCCESS to our internal format
  if (metadata.gcashStatus === 'completed') {
    console.log('✅ SUCCESS: Payment status mapped correctly from uppercase "SUCCESS" to "completed"');
  } else {
    console.log(`❌ FAILED: Payment status not mapped correctly. Expected "completed" but got "${metadata.gcashStatus}"`);
  }
  
  // Verify that additional DirectPay fields were properly captured
  if (metadata.invoiceNo && metadata.txnId && metadata.txnDate && metadata.txnDesc) {
    console.log('✅ SUCCESS: DirectPay additional fields captured correctly');
    console.log(`  - Invoice: ${metadata.invoiceNo}`);
    console.log(`  - Transaction ID: ${metadata.txnId}`);
    console.log(`  - Description: ${metadata.txnDesc}`);
  } else {
    console.log('❌ FAILED: DirectPay additional fields not captured correctly');
  }
  
  // Verify that casino transfer was attempted
  if (metadata.casinoTransferAttemptedAt) {
    console.log('✅ SUCCESS: Casino transfer was automatically attempted');
    console.log(`  - Casino Status: ${metadata.casinoStatus}`);
    
    if (metadata.casinoStatus === 'completed') {
      console.log('✅ SUCCESS: Casino transfer completed successfully');
    } else {
      console.log(`ℹ️ INFO: Casino transfer status: ${metadata.casinoStatus}`);
    }
  } else {
    console.log('❌ FAILED: Casino transfer was not automatically attempted');
  }
  
  console.log('🏁 Test completed!');
}

// Run the test
runTest().catch(error => {
  console.error('❌ Unhandled test error:', error);
});