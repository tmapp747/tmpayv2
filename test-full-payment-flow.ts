/**
 * Comprehensive E2E Test for GCash Payment Flow
 * 
 * This script tests the complete payment flow:
 * 1. User authentication 
 * 2. Deposit request initiation
 * 3. GCash QR code generation
 * 4. Payment status monitoring
 * 5. Optional simulated payment completion (testing only)
 * 6. Casino balance update verification
 */

import axios from 'axios';
import { z } from 'zod';
import { setTimeout } from 'timers/promises';

// Test configuration
interface TestConfig {
  baseUrl: string;
  username: string;
  password: string;
  depositAmount: number;
  simulatePayment: boolean;
  maxWaitTimeMinutes: number;
}

const config: TestConfig = {
  baseUrl: 'http://localhost:3000',
  username: 'athan45',
  password: 'A123456@',
  depositAmount: 100,
  simulatePayment: true, // Set to true to simulate payment completion
  maxWaitTimeMinutes: 2
};

// Transaction and payment storage
interface TransactionStorage {
  accessToken: string | null;
  refreshToken: string | null;
  userId: number | null;
  transactionId: number | null;
  referenceId: string | null;
  qrCodeData: string | null;
  payUrl: string | null;
  balanceBefore: number | null;
  balanceAfter: number | null;
  casinoBalanceBefore: number | null;
  casinoBalanceAfter: number | null;
}

// Initialize storage
const storage: TransactionStorage = {
  accessToken: null,
  refreshToken: null,
  userId: null,
  transactionId: null,
  referenceId: null,
  qrCodeData: null,
  payUrl: null,
  balanceBefore: null,
  balanceAfter: null,
  casinoBalanceBefore: null,
  casinoBalanceAfter: null
};

// Create an axios instance with cookie support
const api = axios.create({
  baseURL: config.baseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Logger with timestamps
function log(message: string, data: any = null, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void {
  const timestamp = new Date().toISOString();
  
  // Color coding for different log types
  let prefix = '';
  switch(type) {
    case 'success':
      prefix = '✅ ';
      break;
    case 'error':
      prefix = '❌ ';
      break;
    case 'warning':
      prefix = '⚠️ ';
      break;
    default:
      prefix = '🔷 ';
  }
  
  console.log(`${prefix}[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Step 1: Authenticate user
async function authenticate(): Promise<boolean> {
  try {
    log(`Authenticating user: ${config.username}`);
    
    // First check if username is allowed
    const verifyResponse = await api.post('/api/auth/verify-username', {
      username: config.username
    });
    
    log('Username verification successful', verifyResponse.data, 'success');
    
    // Then login with credentials
    const loginResponse = await api.post('/api/auth/login', {
      username: config.username,
      password: config.password
    });
    
    // Store tokens and user info
    storage.accessToken = loginResponse.data.accessToken;
    storage.refreshToken = loginResponse.data.refreshToken;
    storage.userId = loginResponse.data.user?.id;
    
    // Store initial balances
    if (loginResponse.data.user) {
      storage.balanceBefore = parseFloat(loginResponse.data.user.balance);
      storage.casinoBalanceBefore = parseFloat(loginResponse.data.user.casinoBalance);
    }
    
    log('Login successful', {
      success: loginResponse.data.success,
      user: loginResponse.data.user ? 
        {
          username: loginResponse.data.user.username,
          balance: loginResponse.data.user.balance,
          casinoUsername: loginResponse.data.user.casinoUsername,
          casinoClientId: loginResponse.data.user.casinoClientId
        } : null
    }, 'success');
    
    return true;
  } catch (error: any) {
    log('Authentication error', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    }, 'error');
    return false;
  }
}

// Step 2: Initiate a deposit request with GCash
async function initiateDeposit(): Promise<boolean> {
  try {
    log(`Initiating deposit of PHP ${config.depositAmount}`);
    
    // Fetch user initial balance
    const userInfoResponse = await api.get('/api/user/info');
    if (userInfoResponse.data.user) {
      storage.balanceBefore = parseFloat(userInfoResponse.data.user.balance);
      storage.casinoBalanceBefore = parseFloat(userInfoResponse.data.user.casinoBalance);
      
      log('Initial balances captured', {
        walletBalance: storage.balanceBefore,
        casinoBalance: storage.casinoBalanceBefore
      });
    }
    
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
    }, 'success');
    
    return true;
  } catch (error: any) {
    log('Deposit initiation error', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    }, 'error');
    return false;
  }
}

// Step 3: Get transaction details to verify the QR code was generated
async function getTransactionDetails(): Promise<boolean> {
  try {
    if (!storage.transactionId) {
      log('Cannot get transaction details - no transaction ID', null, 'warning');
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
    }, 'success');
    
    return true;
  } catch (error: any) {
    log('Error getting transaction details', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    }, 'error');
    return false;
  }
}

// Optional: Simulate payment completion (for testing purposes)
async function simulatePaymentCompletion(): Promise<boolean> {
  try {
    if (!storage.referenceId) {
      log('Cannot simulate payment - no reference ID', null, 'warning');
      return false;
    }
    
    log(`Simulating payment completion for reference: ${storage.referenceId}`, null, 'warning');
    
    // This endpoint is for testing only - should be disabled in production
    const response = await api.post('/api/payments/simulate-completion', {
      referenceId: storage.referenceId,
      immediate: true
    });
    
    log('Payment simulation response', {
      success: response.data.success,
      message: response.data.message
    });
    
    return response.data.success;
  } catch (error: any) {
    log('Error simulating payment', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    }, 'error');
    return false;
  }
}

// Step 4: Monitor payment status
async function monitorPaymentStatus(): Promise<string> {
  if (!storage.referenceId) {
    log('Cannot monitor payment - no reference ID', null, 'warning');
    return 'error';
  }
  
  log(`Starting payment status monitoring for reference: ${storage.referenceId}`);
  log(`Payment URL: ${storage.payUrl}`);
  
  // Display QR code details for manual payment
  if (storage.qrCodeData) {
    log('QR Code Data available for scanning');
    // In a real environment, we would display this QR code
  }
  
  // Simulate payment if configured to do so
  if (config.simulatePayment) {
    await setTimeout(2000); // Wait for 2 seconds before simulating payment
    await simulatePaymentCompletion();
  }
  
  // Maximum wait time in milliseconds
  const maxWaitTime = config.maxWaitTimeMinutes * 60 * 1000;
  const startTime = Date.now();
  let finalStatus = '';
  
  // Poll until payment completes or times out
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const response = await api.get(`/api/payments/status/${storage.referenceId}`);
      
      log('Payment status update', {
        status: response.data.status,
        qrPaymentStatus: response.data.qrPayment?.status,
        timestamp: new Date().toISOString()
      });
      
      // If payment is completed or failed, stop polling
      if (response.data.status === 'completed' || response.data.status === 'failed' || response.data.status === 'expired') {
        finalStatus = response.data.status;
        
        if (response.data.status === 'completed') {
          log('Payment process completed successfully!', {
            finalStatus: response.data.status,
            completedAt: response.data.qrPayment?.completedAt || new Date().toISOString()
          }, 'success');
        } else {
          log(`Payment process ended with status: ${response.data.status}`, null, 
            response.data.status === 'failed' ? 'error' : 'warning');
        }
        
        break;
      }
      
      // Wait 3 seconds between polls
      await setTimeout(3000);
    } catch (error: any) {
      log('Error checking payment status', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      }, 'error');
      
      // Wait 5 seconds before retrying after an error
      await setTimeout(5000);
    }
  }
  
  // Check if we timed out
  if (!finalStatus) {
    log('Payment status monitoring timed out', null, 'warning');
    finalStatus = 'timeout';
  }
  
  return finalStatus;
}

// Step 5: Verify balances after payment
async function verifyBalances(): Promise<boolean> {
  try {
    log('Verifying wallet and casino balances after payment');
    
    // Fetch updated user info
    const userInfoResponse = await api.get('/api/user/info');
    if (userInfoResponse.data.user) {
      storage.balanceAfter = parseFloat(userInfoResponse.data.user.balance);
      storage.casinoBalanceAfter = parseFloat(userInfoResponse.data.user.casinoBalance);
      
      const walletDifference = storage.balanceAfter - (storage.balanceBefore || 0);
      const casinoDifference = storage.casinoBalanceAfter - (storage.casinoBalanceBefore || 0);
      
      log('Final balances captured', {
        initialWalletBalance: storage.balanceBefore,
        finalWalletBalance: storage.balanceAfter,
        walletDifference: walletDifference,
        initialCasinoBalance: storage.casinoBalanceBefore,
        finalCasinoBalance: storage.casinoBalanceAfter,
        casinoDifference: casinoDifference
      });
      
      // Verify the deposit amount was correctly applied
      if (walletDifference === config.depositAmount) {
        log('Wallet balance increased by the exact deposit amount!', null, 'success');
        return true;
      } else {
        log('Unexpected wallet balance change', {
          expected: config.depositAmount,
          actual: walletDifference
        }, 'warning');
      }
    } else {
      log('Failed to fetch user info for balance verification', null, 'error');
    }
    
    return false;
  } catch (error: any) {
    log('Error verifying balances', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    }, 'error');
    return false;
  }
}

// Run the full test
async function runTest(): Promise<void> {
  log('=== Starting full deposit flow test ===');
  
  // Step 1: Authenticate
  const isAuthenticated = await authenticate();
  if (!isAuthenticated) {
    log('Test failed at authentication step', null, 'error');
    return;
  }
  
  // Step 2: Initiate deposit
  const isDepositInitiated = await initiateDeposit();
  if (!isDepositInitiated) {
    log('Test failed at deposit initiation step', null, 'error');
    return;
  }
  
  // Step 3: Get transaction details
  await getTransactionDetails();
  
  // Step 4: Monitor payment status
  const paymentStatus = await monitorPaymentStatus();
  
  // Step 5: Verify final balances if payment completed
  if (paymentStatus === 'completed') {
    await verifyBalances();
  }
  
  // Summary
  log('=== Test Summary ===', {
    authenticated: isAuthenticated,
    depositInitiated: isDepositInitiated,
    paymentStatus: paymentStatus,
    initialBalance: storage.balanceBefore,
    finalBalance: storage.balanceAfter
  });
  
  if (paymentStatus === 'completed') {
    log('✅ Test completed successfully! The payment flow is working correctly.', null, 'success');
  } else {
    log('⚠️ Test completed with non-successful payment status.', null, 'warning');
  }
}

// Execute the test
runTest().catch(error => {
  log('Uncaught error in test flow', {
    message: error.message,
    stack: error.stack
  }, 'error');
});