/**
 * Live Athan45 End-to-End Payment Test
 * 
 * This script:
 * 1. Logs in with Athan45 credentials
 * 2. Generates a GCash QR code for PHP 100
 * 3. Provides the payment URL for manual payment
 * 4. Monitors the transaction status in real-time
 * 5. Verifies that the casino transfer completes successfully
 */

import { createInterface } from 'node:readline';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const AMOUNT = 100;
const USERNAME = 'Athan45';
const PASSWORD = 'A123456@';
const CHECK_INTERVAL_MS = 5000; // 5 seconds between status checks
const MAX_CHECK_TIME_MS = 15 * 60 * 1000; // 15 minutes maximum monitoring time

// Storage for transaction data
let sessionData = {
  accessToken: null,
  transactionId: null,
  referenceId: null,
  payUrl: null,
  qrCodeData: null,
  statusHistory: []
};

// Helper function for console logging with timestamps
function log(message, data = null) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const logMessage = `[${timestamp}] ${message}`;
  
  // Print the message
  if (data) {
    if (typeof data === 'string') {
      console.log(`${logMessage}: ${data}`);
    } else {
      console.log(logMessage);
      console.log(data);
    }
  } else {
    console.log(logMessage);
  }
  
  // Add to status history for the final report
  sessionData.statusHistory.push({
    timestamp,
    message,
    data: data
  });
}

// Helper function to make API requests
async function makeRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = API_BASE_URL + endpoint;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // Add authorization token if available
    if (sessionData.accessToken) {
      options.headers['Authorization'] = `Bearer ${sessionData.accessToken}`;
    }
    
    // Prepare request based on HTTP/HTTPS
    const requestFn = url.startsWith('https') ? httpsRequest : httpRequest;
    const req = requestFn(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}, Raw data: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Step 1: Login with Athan45 credentials
async function login() {
  log('Attempting login with Athan45 credentials...');
  
  try {
    const loginResponse = await makeRequest('/api/auth/login', 'POST', {
      username: USERNAME,
      password: PASSWORD
    });
    
    if (!loginResponse.success) {
      log('Login failed', loginResponse.message);
      throw new Error(`Login failed: ${loginResponse.message}`);
    }
    
    sessionData.accessToken = loginResponse.accessToken;
    log('Login successful! Access token received.');
    return true;
  } catch (error) {
    log('Login error', error.message);
    throw error;
  }
}

// Step 2: Generate GCash QR code
async function generateGCashQR() {
  log(`Generating GCash QR code for PHP ${AMOUNT}...`);
  
  try {
    const response = await makeRequest('/api/payments/gcash/generate-qr', 'POST', {
      amount: AMOUNT
    });
    
    if (!response.success) {
      log('Failed to generate QR code', response.message);
      throw new Error(`QR generation failed: ${response.message}`);
    }
    
    sessionData.transactionId = response.transactionId;
    sessionData.referenceId = response.referenceId;
    sessionData.payUrl = response.payUrl;
    sessionData.qrCodeData = response.qrCodeData;
    
    log('GCash QR code generated successfully!', {
      transactionId: sessionData.transactionId,
      referenceId: sessionData.referenceId,
      payUrl: sessionData.payUrl,
      qrCodeDataLength: sessionData.qrCodeData ? sessionData.qrCodeData.length : 0
    });
    
    return true;
  } catch (error) {
    log('QR code generation error', error.message);
    throw error;
  }
}

// Step 3: Check payment status periodically
async function checkPaymentStatus() {
  if (!sessionData.referenceId) {
    log('Cannot check payment status: No reference ID available');
    return { status: 'unknown' };
  }
  
  try {
    const response = await makeRequest(`/api/payments/status/${sessionData.referenceId}`);
    
    if (!response.success) {
      log('Payment status check failed', response.message);
      return { status: 'error', message: response.message };
    }
    
    return response;
  } catch (error) {
    log('Payment status check error', error.message);
    return { status: 'error', message: error.message };
  }
}

// Step 4: Check transaction details
async function getTransactionDetails() {
  if (!sessionData.transactionId) {
    log('Cannot get transaction details: No transaction ID available');
    return null;
  }
  
  try {
    const response = await makeRequest(`/api/transactions/${sessionData.transactionId}`);
    
    if (!response.success) {
      log('Failed to get transaction details', response.message);
      return null;
    }
    
    return response.transaction;
  } catch (error) {
    log('Transaction details error', error.message);
    return null;
  }
}

// Full monitoring loop
async function monitorPaymentStatus() {
  log('Starting payment status monitoring...');
  log(`Please complete the payment at: ${sessionData.payUrl}`);
  console.log('\n============= PAYMENT INSTRUCTIONS =============');
  console.log(`1. Open this URL to make your payment: ${sessionData.payUrl}`);
  console.log(`2. Pay exactly PHP ${AMOUNT} using GCash`);
  console.log(`3. Reference ID: ${sessionData.referenceId}`);
  console.log(`4. This script will monitor the status automatically`);
  console.log('==============================================\n');
  
  const startTime = Date.now();
  let isCompleted = false;
  let lastStatus = null;
  let checkCount = 0;
  
  // Continue checking until payment is completed or max time is reached
  while (!isCompleted && (Date.now() - startTime) < MAX_CHECK_TIME_MS) {
    checkCount++;
    const statusResponse = await checkPaymentStatus();
    const txDetails = await getTransactionDetails();
    
    // Combine status information
    const statusInfo = {
      paymentStatus: statusResponse.status,
      transactionStatus: txDetails?.status || 'unknown',
      casinoTransferStatus: txDetails?.metadata?.casinoTransferStatus || 'unknown',
      paymentCompleted: statusResponse.status === 'completed',
      casinoUsername: txDetails?.casinoUsername,
      metadata: txDetails?.metadata
    };
    
    // Only log if status has changed
    if (JSON.stringify(statusInfo) !== lastStatus) {
      log(`Payment status update (check #${checkCount})`, statusInfo);
      lastStatus = JSON.stringify(statusInfo);
    }
    
    // Check if both payment and casino transfer are completed
    if (
      statusResponse.status === 'completed' && 
      txDetails?.status === 'completed' && 
      txDetails?.metadata?.casinoTransferStatus === 'completed'
    ) {
      isCompleted = true;
      log('🎉 Payment and casino transfer both completed successfully!');
      break;
    }
    
    // Check if payment is completed but transfer is still pending
    if (
      statusResponse.status === 'completed' && 
      txDetails?.metadata?.casinoTransferStatus === 'pending'
    ) {
      log('Payment completed but casino transfer is still pending. Continuing to monitor...');
    }
    
    // Check for failure states
    if (
      statusResponse.status === 'failed' || 
      txDetails?.status === 'failed' ||
      txDetails?.metadata?.casinoTransferStatus === 'failed'
    ) {
      log('❌ Payment or transfer has failed');
      break;
    }
    
    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL_MS));
  }
  
  // Final status check
  if (!isCompleted) {
    log('Maximum monitoring time reached without completion');
  }
  
  // Get final transaction details
  const finalTxDetails = await getTransactionDetails();
  log('Final transaction state', finalTxDetails);
  
  return {
    completed: isCompleted,
    transaction: finalTxDetails,
    elapsedTimeMs: Date.now() - startTime,
    checkCount
  };
}

// Main test function
async function runTest() {
  try {
    log('======== STARTING ATHAN45 LIVE PAYMENT TEST ========');
    
    // Step 1: Login
    await login();
    
    // Step 2: Generate GCash QR
    await generateGCashQR();
    
    // Step 3: Monitor payment status
    const monitoringResult = await monitorPaymentStatus();
    
    // Step 4: Generate final report
    log('======== TEST COMPLETED ========');
    log('Test Summary', {
      user: USERNAME,
      amount: AMOUNT,
      completed: monitoringResult.completed,
      elapsedTime: `${Math.round(monitoringResult.elapsedTimeMs / 1000)} seconds`,
      statusChecks: monitoringResult.checkCount,
      finalStatus: monitoringResult.transaction?.status,
      casinoTransferStatus: monitoringResult.transaction?.metadata?.casinoTransferStatus,
      casinoUsername: monitoringResult.transaction?.casinoUsername
    });
    
    // Analyze the fix results
    if (monitoringResult.completed) {
      log('🎉 SUCCESS: The payment and casino transfer completed successfully!');
      log('This confirms that our fix for using username as fallback for casinoUsername is working.');
    } else {
      log('⚠️ Test did not reach completion state within the monitoring period.');
    }
    
    // Check for the specific fix
    if (monitoringResult.transaction?.metadata?.usedUsernameFallback) {
      log('✅ CONFIRMED: The system used username fallback mechanism for this transaction');
    }
    
  } catch (error) {
    log('Test failed with error', error);
  }
}

// Start the test
runTest();