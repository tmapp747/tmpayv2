/**
 * Simple test script to verify QR code generation
 * 
 * This script attempts to:
 * 1. Log in with test credentials
 * 2. Generate a GCash QR code
 * 3. Print the payment URL
 */

import axios from 'axios';

// Test user credentials
const credentials = {
  username: 'athan45',
  password: 'A123456@'
};

// Base URL for the API
const API_URL = 'http://localhost:5000';
const DEPOSIT_AMOUNT = 100;

// Create axios instance with short timeout
const api = axios.create({
  baseURL: API_URL,
  timeout: 8000, // 8 second timeout
  withCredentials: true
});

// Main test function
async function testQrGeneration() {
  console.log('--- Starting GCash QR Code Generation Test ---');
  
  try {
    // Step 1: Login
    console.log(`Logging in with username: ${credentials.username}`);
    
    const loginResult = await api.post('/api/auth/login', credentials);
    
    if (!loginResult.data.success) {
      throw new Error(`Login failed: ${loginResult.data.message}`);
    }
    
    console.log('✓ Login successful');
    
    // Step 2: Generate QR code
    console.log(`Generating QR code for PHP ${DEPOSIT_AMOUNT}...`);
    
    const qrResult = await api.post('/api/payments/gcash/generate-qr', {
      amount: DEPOSIT_AMOUNT
    });
    
    if (!qrResult.data.success) {
      throw new Error(`QR generation failed: ${qrResult.data.message}`);
    }
    
    // Extract important data
    const { qrPayment, transaction } = qrResult.data;
    
    console.log('✓ QR code generated successfully');
    console.log('\nTransaction details:');
    console.log(`- Transaction ID: ${transaction?.id}`);
    console.log(`- Amount: PHP ${qrPayment?.amount}`);
    console.log(`- Reference: ${qrPayment?.directPayReference}`);
    console.log(`- Expires at: ${new Date(qrPayment?.expiresAt).toLocaleString()}`);
    
    console.log('\n=== PAYMENT URL ===');
    console.log(qrPayment?.payUrl);
    console.log('===================');
    
    return {
      success: true,
      referenceId: qrPayment?.directPayReference,
      paymentUrl: qrPayment?.payUrl,
      transactionId: transaction?.id
    };
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }
    
    return {
      success: false,
      error: error.message,
      details: error.response?.data || {}
    };
  }
}

// Execute the test
testQrGeneration()
  .then(result => {
    if (result.success) {
      console.log('\n✓ Test completed successfully');
      console.log('Please copy the payment URL to make the GCash payment');
    } else {
      console.log('\n❌ Test failed');
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
  });