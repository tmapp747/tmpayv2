/**
 * Test script for GCash deposit flow
 */

import axios from 'axios';
import { setTimeout } from 'timers/promises';

// Configuration
const config = {
  baseUrl: 'http://0.0.0.0:5000',
  username: 'beding1948',
  password: 'pass123',
  depositAmount: 100,
  pollInterval: 5000, // 5 seconds
  maxAttempts: 12 // 1 minute total polling time
};

// Create axios instance
const api = axios.create({
  baseURL: config.baseUrl,
  timeout: 10000,
  withCredentials: true
});

// Logging utility
function log(message, data = null, type = 'INFO') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${type}: ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

// Step 1: Authentication
async function authenticate() {
  try {
    log('Beginning authentication process...');

    const response = await api.post('/api/auth/login', {
      username: config.username,
      password: config.password
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Authentication failed');
    }

    const { user } = response.data;
    log('Authentication successful', { userId: user.id, username: user.username }, 'SUCCESS');

    // Set auth token for subsequent requests
    api.defaults.headers.common['Authorization'] = `Bearer ${user.accessToken}`;

    return true;
  } catch (error) {
    log('Authentication error', error.message, 'ERROR');
    throw error;
  }
}

// Step 2: Generate GCash QR
async function generateGCashQR() {
  try {
    log('Generating GCash QR code...');

    const response = await api.post('/api/payments/gcash/generate-qr', {
      amount: config.depositAmount
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'QR generation unsuccessful');
    }

    const { qrPayment, transaction } = response.data;
    log('QR code generated successfully', { 
      transactionId: transaction.id,
      amount: qrPayment.amount,
      reference: qrPayment.directPayReference,
      payUrl: qrPayment.payUrl
    }, 'SUCCESS');

    return qrPayment.directPayReference;
  } catch (error) {
    log('QR generation error', error.message, 'ERROR');
    throw error;
  }
}

// Step 3: Check payment status
async function checkPaymentStatus(reference) {
  try {
    log(`Checking payment status for reference: ${reference}...`);

    const response = await api.get(`/api/payments/status/${reference}`);
    return response.data;
  } catch (error) {
    log('Status check error', error.message, 'ERROR');
    throw error;
  }
}

// Main test function
async function runTest() {
  try {
    log('=== STARTING GCASH DEPOSIT FLOW TEST ===');

    // Step 1: Authentication
    await authenticate();

    // Step 2: Generate QR
    const reference = await generateGCashQR();

    // Step 3: Poll for status
    let attempts = 0;
    while (attempts < config.maxAttempts) {
      const result = await checkPaymentStatus(reference);

      if (result.status === 'completed') {
        log('Payment completed successfully!', result, 'SUCCESS');
        return true;
      } else if (result.status === 'failed' || result.status === 'expired') {
        log('Payment failed or expired', result, 'ERROR');
        return false;
      }

      log(`Payment still ${result.status}. Checking again in ${config.pollInterval/1000} seconds...`);
      await setTimeout(config.pollInterval);
      attempts++;
    }

    log('Test timeout: Payment not completed within time limit', null, 'ERROR');
    return false;
  } catch (error) {
    log('Test failed', error.message, 'ERROR');
    return false;
  }
}

// Execute test
runTest()
  .then(success => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch(error => {
    log('Fatal test error', error.message, 'ERROR');
    process.exit(1);
  });