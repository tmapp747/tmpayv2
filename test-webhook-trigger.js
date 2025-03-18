/**
 * Test script to simulate a DirectPay webhook for GCash payment
 * 
 * This script:
 * 1. Authenticates a user (Athan45)
 * 2. Creates a new GCash QR payment
 * 3. Simulates a webhook callback with successful payment status
 * 4. Checks the transaction status to verify the flow
 */

import fetch from 'node-fetch';
const baseUrl = 'http://localhost:5000';

// Sample test data
const testUser = {
  username: 'Athan45',
  password: 'password123'
};

const depositAmount = 100; // PHP

// Authentication store
let authToken = null;
let userId = null;
let transactionId = null;
let paymentReference = null;

async function login() {
  try {
    console.log(`Logging in as ${testUser.username}...`);
    
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Login failed: ${result.message}`);
    }
    
    authToken = result.user.accessToken;
    userId = result.user.id;
    
    console.log(`Login successful. User ID: ${userId}`);
    return true;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
}

async function generateGCashQR() {
  try {
    console.log(`Generating GCash QR for ₱${depositAmount}...`);
    
    const response = await fetch(`${baseUrl}/api/payments/gcash/generate-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        amount: depositAmount,
        currency: 'PHP'
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`QR generation failed: ${result.message}`);
    }
    
    transactionId = result.transactionId;
    paymentReference = result.qrPayment.reference;
    
    console.log('GCash QR generated successfully:');
    console.log(`- Transaction ID: ${transactionId}`);
    console.log(`- Payment Reference: ${paymentReference}`);
    console.log(`- Payment URL: ${result.qrPayment.payUrl}`);
    console.log(`- Expires At: ${result.qrPayment.expiresAt}`);
    
    return true;
  } catch (error) {
    console.error('QR generation error:', error);
    return false;
  }
}

async function simulateWebhook() {
  try {
    console.log('Simulating DirectPay webhook with successful payment...');
    
    // Create webhook payload similar to what DirectPay would send
    const webhookPayload = {
      reference: paymentReference,
      status: 'success',
      transaction_id: `dp_${Date.now()}`,
      amount: depositAmount,
      currency: 'PHP',
      timestamp: new Date().toISOString()
    };
    
    console.log('Webhook payload:', webhookPayload);
    
    const response = await fetch(`${baseUrl}/api/webhook/directpay/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload)
    });
    
    const result = await response.json();
    
    console.log('Webhook response:', result);
    
    return result.success;
  } catch (error) {
    console.error('Webhook simulation error:', error);
    return false;
  }
}

async function checkTransactionStatus() {
  try {
    console.log(`Checking transaction status for ID: ${transactionId}...`);
    
    const response = await fetch(`${baseUrl}/api/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Status check failed: ${result.message}`);
    }
    
    const transaction = result.transaction;
    
    console.log(`Transaction status: ${transaction.status}`);
    console.log('Transaction details:', JSON.stringify(transaction, null, 2));
    
    return transaction;
  } catch (error) {
    console.error('Status check error:', error);
    return null;
  }
}

async function runTest() {
  console.log('🚀 Starting DirectPay webhook test...');
  
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
  
  // Step 3: Simulate webhook
  if (!await simulateWebhook()) {
    console.error('❌ Test failed at webhook simulation step');
    return;
  }
  
  // Small delay to allow server to process the webhook
  console.log('Waiting 2 seconds for server to process the webhook...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 4: Check transaction status
  const transaction = await checkTransactionStatus();
  if (!transaction) {
    console.error('❌ Test failed at transaction status check');
    return;
  }
  
  // Verify final status
  if (transaction.status === 'completed') {
    console.log('✅ TEST PASSED: Transaction completed successfully!');
    
    // Check if casino transfer was successful
    const metadata = transaction.metadata || {};
    if (metadata.casinoTransferStatus === 'completed') {
      console.log('✅ Casino transfer completed successfully!');
      console.log(`- Casino Transaction ID: ${metadata.casinoTransactionId}`);
      console.log(`- Nonce: ${metadata.nonce}`);
    } else if (metadata.casinoTransferStatus === 'failed') {
      console.log('⚠️ Payment completed but casino transfer failed.');
      console.log(`- Error: ${metadata.casinoTransferError}`);
    } else {
      console.log('⚠️ Payment completed but casino transfer status unknown.');
    }
  } else if (transaction.status === 'payment_completed') {
    console.log('⚠️ Payment completed but casino transfer is pending.');
    console.log('Transaction will be processed by the background job.');
  } else {
    console.log(`❌ TEST FAILED: Unexpected transaction status: ${transaction.status}`);
  }
}

// Run the test
runTest();