/**
 * Test script for GCash QR code generation and payment flow
 * 
 * This script:
 * 1. Authenticates using the provided credentials (athan45)
 * 2. Generates a GCash QR code for PHP 100
 * 3. Displays the payment URL and QR code data
 * 
 * Usage: node test-gcash-payment.js
 */

import axios from 'axios';

// Configuration
const config = {
  baseUrl: 'http://localhost:5000', // App is running on port 5000 on Replit
  username: 'athan45',
  password: 'A123456@',
  depositAmount: 100
};

// Setup API client
const api = axios.create({
  baseURL: config.baseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper function for logging with timestamps
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Step 1: Login to get authenticated session
async function login() {
  try {
    // First verify the username
    const verifyResponse = await api.post('/api/auth/verify-username', {
      username: config.username
    });
    
    log('Username verification:', verifyResponse.data);
    
    // Then login
    const loginResponse = await api.post('/api/auth/login', {
      username: config.username,
      password: config.password
    });
    
    log('Login successful:', {
      username: loginResponse.data.user.username,
      balance: loginResponse.data.user.balance
    });
    
    return true;
  } catch (error) {
    log('Login error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return false;
  }
}

// Step 2: Generate GCash QR Code
async function generateGCashQr() {
  try {
    log(`Generating GCash QR code for PHP ${config.depositAmount}...`);
    
    const response = await api.post('/api/payments/gcash/generate-qr', {
      amount: config.depositAmount
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to generate QR code');
    }
    
    const qrPayment = response.data.qrPayment;
    
    // Output important details
    log('GCash QR Code generated successfully:', {
      reference: qrPayment.directPayReference,
      amount: qrPayment.amount,
      expiresAt: qrPayment.expiresAt,
      payUrl: qrPayment.payUrl
    });
    
    // Print QR code URL and instruction
    log('-'.repeat(80));
    log('🔵 PAYMENT URL:');
    log(qrPayment.payUrl);
    log('-'.repeat(80));
    log('👉 Instructions:');
    log('1. Open the above URL on your phone or scan the QR code with GCash app');
    log('2. Complete the payment in the GCash app');
    log('3. The system will automatically detect the payment');
    log('-'.repeat(80));
    
    return qrPayment.directPayReference;
  } catch (error) {
    log('Error generating GCash QR code:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return null;
  }
}

// Step 3: Check payment status
async function checkPaymentStatus(referenceId) {
  if (!referenceId) {
    log('No reference ID provided');
    return;
  }
  
  try {
    log(`Checking payment status for reference: ${referenceId}...`);
    
    const response = await api.get(`/api/payments/status/${referenceId}`);
    
    log('Payment status:', {
      status: response.data.status,
      qrPayment: {
        status: response.data.qrPayment?.status,
        updatedAt: response.data.qrPayment?.updatedAt
      }
    });
    
    return response.data.status;
  } catch (error) {
    log('Error checking payment status:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return 'error';
  }
}

// Main function
async function main() {
  log('Starting GCash payment test...');
  
  // Step 1: Login
  const loggedIn = await login();
  if (!loggedIn) {
    log('Test failed: Could not login');
    return;
  }
  
  // Step 2: Generate QR code
  const referenceId = await generateGCashQr();
  if (!referenceId) {
    log('Test failed: Could not generate QR code');
    return;
  }
  
  // Step 3: Initial payment status check
  await checkPaymentStatus(referenceId);
  
  log('✅ Test completed successfully');
  log('The QR code has been generated and is ready for payment');
  log(`Please use the payment URL to complete the GCash payment of PHP ${config.depositAmount}`);
}

// Run the test
main().catch(error => {
  log('Unexpected error:', {
    message: error.message,
    stack: error.stack
  });
});