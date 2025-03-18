/**
 * Test script for the full deposit flow from authentication to payment completion
 * 
 * This script:
 * 1. Authenticates a user with the casino platform
 * 2. Initiates a deposit request
 * 3. Generates a GCash QR payment code
 * 4. Monitors payment status updates
 * 5. Reports on dual-state tracking (GCash payment and casino transfer)
 */

const axios = require('axios');

// Configuration
const config = {
  baseUrl: 'http://localhost:3000',
  username: 'athan45',
  password: 'A123456@',
  depositAmount: 100
};

// Global storage for transaction IDs and references
const storage = {
  accessToken: null,
  transactionId: null,
  referenceId: null,
  qrCodeData: null,
  payUrl: null,
  pollInterval: null
};

// Create an axios instance with cookie support
const api = axios.create({
  baseURL: config.baseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper functions
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Step 1: Authenticate user
async function authenticate() {
  try {
    log(`Authenticating user: ${config.username}`);
    
    // First check if username is allowed
    const verifyResponse = await api.post('/api/auth/verify-username', {
      username: config.username
    });
    
    log('Username verification successful', verifyResponse.data);
    
    // Then login with credentials
    const loginResponse = await api.post('/api/auth/login', {
      username: config.username,
      password: config.password
    });
    
    log('Login successful', {
      success: loginResponse.data.success,
      user: loginResponse.data.user ? 
        {
          username: loginResponse.data.user.username,
          balance: loginResponse.data.user.balance,
          casinoUsername: loginResponse.data.user.casinoUsername,
          casinoClientId: loginResponse.data.user.casinoClientId
        } : null
    });
    
    // Store access token for API calls that might need it
    storage.accessToken = loginResponse.data.accessToken;
    
    return true;
  } catch (error) {
    log('Authentication error', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return false;
  }
}

// Step 2: Initiate a deposit request
async function initiateDeposit() {
  try {
    log(`Initiating deposit of PHP ${config.depositAmount}`);
    
    // Generate QR code for GCash payment
    const response = await api.post('/api/payments/gcash/generate-qr', {
      amount: config.depositAmount
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to generate QR code');
    }
    
    // Store QR payment data
    if (response.data.qrPayment) {
      storage.referenceId = response.data.qrPayment.directPayReference;
      storage.qrCodeData = response.data.qrPayment.qrCodeData;
      storage.payUrl = response.data.qrPayment.payUrl;
      storage.transactionId = response.data.transaction?.id || null;
    }
    
    log('Deposit initiated successfully', {
      referenceId: storage.referenceId,
      transactionId: storage.transactionId,
      payUrl: storage.payUrl ? `${storage.payUrl.substring(0, 50)}...` : null,
      hasQrCode: !!storage.qrCodeData
    });
    
    return true;
  } catch (error) {
    log('Deposit initiation error', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return false;
  }
}

// Step 3: Get transaction details to verify the QR code was generated
async function getTransactionDetails() {
  try {
    if (!storage.transactionId) {
      log('Cannot get transaction details - no transaction ID');
      return false;
    }
    
    log(`Getting transaction details for ID: ${storage.transactionId}`);
    
    const response = await api.get(`/api/transactions/${storage.transactionId}`);
    
    log('Transaction details retrieved', {
      transaction: {
        id: response.data.transaction?.id,
        amount: response.data.transaction?.amount,
        status: response.data.transaction?.status,
        type: response.data.transaction?.type,
        method: response.data.transaction?.method,
        reference: response.data.transaction?.reference
      }
    });
    
    return true;
  } catch (error) {
    log('Error getting transaction details', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return false;
  }
}

// Step 4: Monitor payment status
async function startPaymentStatusMonitoring() {
  if (!storage.referenceId) {
    log('Cannot monitor payment - no reference ID');
    return false;
  }
  
  log(`Starting payment status monitoring for reference: ${storage.referenceId}`);
  log(`Payment URL: ${storage.payUrl}`);
  
  // Display QR code details for manual payment
  if (storage.qrCodeData) {
    log('QR Code Data available for scanning');
  }
  
  // Poll every 3 seconds
  storage.pollInterval = setInterval(async () => {
    try {
      const response = await api.get(`/api/payments/status/${storage.referenceId}`);
      
      log('Payment status update', {
        status: response.data.status,
        qrPaymentStatus: response.data.qrPayment?.status,
        timestamp: new Date().toISOString()
      });
      
      // If payment is completed or failed, stop polling
      if (response.data.status === 'completed' || response.data.status === 'failed' || response.data.status === 'expired') {
        clearInterval(storage.pollInterval);
        
        if (response.data.status === 'completed') {
          log('Payment process completed successfully!', {
            finalStatus: response.data.status,
            completedAt: response.data.qrPayment?.completedAt || new Date().toISOString()
          });
        } else {
          log(`Payment process ended with status: ${response.data.status}`);
        }
      }
    } catch (error) {
      log('Error checking payment status', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
  }, 3000);
  
  // For test script, stop polling after 2 minutes maximum
  setTimeout(() => {
    if (storage.pollInterval) {
      clearInterval(storage.pollInterval);
      log('Payment status monitoring timed out after 2 minutes');
    }
  }, 2 * 60 * 1000);
  
  return true;
}

// Run the full test
async function runTest() {
  log('Starting full deposit flow test');
  
  // Step 1: Authenticate
  const isAuthenticated = await authenticate();
  if (!isAuthenticated) {
    log('Test failed at authentication step');
    return;
  }
  
  // Step 2: Initiate deposit
  const isDepositInitiated = await initiateDeposit();
  if (!isDepositInitiated) {
    log('Test failed at deposit initiation step');
    return;
  }
  
  // Step 3: Get transaction details
  await getTransactionDetails();
  
  // Step 4: Monitor payment status
  await startPaymentStatusMonitoring();
  
  log(`🔵 Test initiated successfully. Payment URL: ${storage.payUrl}`);
  log('🟠 Payment is now in pending state awaiting GCash payment confirmation');
  log('🟠 Please make the payment using the provided URL to complete the test');
}

// Execute the test
runTest().catch(error => {
  log('Uncaught error in test flow', {
    message: error.message,
    stack: error.stack
  });
});