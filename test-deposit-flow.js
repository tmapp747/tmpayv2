/**
 * Comprehensive test for the GCash deposit flow
 * 
 * This script tests the complete payment process:
 * 1. Authentication with test credentials
 * 2. GCash QR code generation
 * 3. Payment status monitoring
 * 4. Optional simulated payment completion
 */

import axios from 'axios';

// Configuration
const config = {
  baseUrl: 'http://localhost:5000',
  username: 'athan45',
  password: 'A123456@',
  depositAmount: 100,
  simulatePayment: false, // Set to true to simulate payment completion
  pollInterval: 5000, // Poll every 5 seconds
  timeout: 10 * 60 * 1000 // 10 minutes timeout
};

// Storage for transaction data
const storage = {
  accessToken: null,
  refreshToken: null,
  userId: null,
  transactionId: null,
  referenceId: null,
  qrCodeData: null,
  payUrl: null
};

// Create axios instance with cookies
const api = axios.create({
  baseURL: config.baseUrl,
  timeout: 10000,
  withCredentials: true
});

// Utility for logging
function log(message, data = null, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `[${timestamp}] ${type.toUpperCase()}:`;
  
  console.log(`${prefix} ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Step 1: Authenticate
async function authenticate() {
  log('Beginning authentication process...');
  
  try {
    const response = await api.post('/api/auth/login', {
      username: config.username,
      password: config.password
    });
    
    if (!response.data.success) {
      log('Authentication failed', response.data, 'error');
      return false;
    }
    
    storage.userId = response.data.user.id;
    log('Authentication successful', { 
      userId: storage.userId,
      username: response.data.user.username
    }, 'success');
    
    return true;
  } catch (error) {
    log('Authentication error', error.message, 'error');
    return false;
  }
}

// Step 2: Initiate deposit and generate QR
async function generateGCashQR() {
  log('Generating GCash QR code...');
  
  try {
    const response = await api.post('/api/payments/gcash/generate-qr', {
      amount: config.depositAmount
    });
    
    if (!response.data.success && !response.data.qrPayment) {
      log('Failed to generate QR code', response.data, 'error');
      return false;
    }
    
    // Store transaction data
    storage.transactionId = response.data.transaction.id;
    storage.referenceId = response.data.qrPayment.directPayReference;
    storage.qrCodeData = response.data.qrPayment.qrCodeData;
    storage.payUrl = response.data.qrPayment.payUrl;
    
    log('GCash QR generated successfully', {
      transactionId: storage.transactionId,
      reference: storage.referenceId,
      paymentUrl: storage.payUrl,
      expiresAt: response.data.qrPayment.expiresAt
    }, 'success');
    
    return true;
  } catch (error) {
    log('QR generation error', error.message, 'error');
    return false;
  }
}

// Step 3: Check payment status
async function checkPaymentStatus() {
  if (!storage.referenceId) {
    log('No reference ID available', null, 'error');
    return null;
  }
  
  log(`Checking payment status for reference: ${storage.referenceId}...`);
  
  try {
    const response = await api.get(`/api/payments/status/${storage.referenceId}`);
    log('Payment status', {
      status: response.data.status,
      paymentDetails: response.data.qrPayment
    });
    
    return response.data;
  } catch (error) {
    log('Status check error', error.message, 'error');
    return null;
  }
}

// Step 4: Simulate payment (for testing only)
async function simulatePaymentCompletion() {
  if (!config.simulatePayment || !storage.referenceId) {
    return false;
  }
  
  log('Simulating payment completion...', null, 'warning');
  try {
    const response = await api.post('/api/payments/simulate-completion', {
      reference: storage.referenceId,
      amount: config.depositAmount
    });
    
    if (response.data.success) {
      log('Payment simulation successful', response.data, 'success');
      return true;
    } else {
      log('Payment simulation failed', response.data, 'error');
      return false;
    }
  } catch (error) {
    log('Simulation error', error.message, 'error');
    return false;
  }
}

// Step 5: Poll for payment status updates
async function monitorPaymentStatus() {
  const startTime = Date.now();
  let completed = false;
  
  log('Starting payment status monitoring...');
  log(`Scan this QR or visit: ${storage.payUrl}`, null, 'info');
  
  while (!completed && (Date.now() - startTime) < config.timeout) {
    const statusData = await checkPaymentStatus();
    
    if (!statusData) {
      log('Failed to retrieve status, retrying...', null, 'warning');
      await new Promise(resolve => setTimeout(resolve, config.pollInterval));
      continue;
    }
    
    if (statusData.status === 'completed') {
      log('Payment completed successfully!', statusData, 'success');
      completed = true;
      break;
    } else if (statusData.status === 'failed') {
      log('Payment failed', statusData, 'error');
      completed = true;
      break;
    } else if (statusData.status === 'expired') {
      log('Payment expired', statusData, 'error');
      completed = true;
      break;
    }
    
    log(`Payment still ${statusData.status}. Checking again in ${config.pollInterval/1000} seconds...`);
    await new Promise(resolve => setTimeout(resolve, config.pollInterval));
  }
  
  if (!completed) {
    log('Monitoring timed out without payment completion', null, 'error');
  }
  
  return completed;
}

// Main test function
async function runTest() {
  log('=== STARTING GCASH DEPOSIT FLOW TEST ===', null, 'info');
  
  // Step 1: Authentication
  const authenticated = await authenticate();
  if (!authenticated) {
    log('Test failed: Authentication unsuccessful', null, 'error');
    return;
  }
  
  // Step 2: Generate QR
  const qrGenerated = await generateGCashQR();
  if (!qrGenerated) {
    log('Test failed: QR generation unsuccessful', null, 'error');
    return;
  }
  
  // Step 3: Simulate payment if enabled
  if (config.simulatePayment) {
    const simulated = await simulatePaymentCompletion();
    if (!simulated) {
      log('Warning: Payment simulation failed', null, 'warning');
    }
  }
  
  // Step 4: Monitor payment status
  const completed = await monitorPaymentStatus();
  
  // Final result
  if (completed) {
    log('Test completed: Full deposit flow validated', storage, 'success');
  } else {
    log('Test incomplete: Deposit flow not fully validated', storage, 'warning');
  }
  
  log('=== TEST COMPLETED ===');
}

// Execute test
runTest()
  .catch(error => {
    log('Fatal test error', error.message, 'error');
  });