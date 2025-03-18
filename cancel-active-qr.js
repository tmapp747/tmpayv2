/**
 * Script to cancel any active QR payments for Athan45
 * 
 * This script:
 * 1. Logs in with Athan45 credentials
 * 2. Identifies any active QR payments
 * 3. Cancels them to allow creating new test payments
 */

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const USERNAME = 'Athan45';
const PASSWORD = 'A123456@';

// Session data storage
const sessionData = {
  accessToken: null,
  referenceId: null
};

// Helper function for console logging with timestamps
function log(message, data = null) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const logMessage = `[${timestamp}] ${message}`;
  
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
}

// Helper function to make API requests
async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = API_BASE_URL + endpoint;
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (sessionData.accessToken) {
    headers['Authorization'] = `Bearer ${sessionData.accessToken}`;
  }
  
  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  };
  
  try {
    const response = await fetch(url, options);
    return await response.json();
  } catch (error) {
    log(`Request failed for ${endpoint}:`, error.message);
    throw error;
  }
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
      log('Login failed:', loginResponse.message);
      throw new Error(`Login failed: ${loginResponse.message}`);
    }
    
    sessionData.accessToken = loginResponse.accessToken;
    log('Login successful! Access token received.');
    return true;
  } catch (error) {
    log('Login error:', error.message);
    throw error;
  }
}

// Step 2: Get active QR payments
async function getActiveQrPayment() {
  log('Checking for active QR payments...');
  
  try {
    const response = await makeRequest('/api/payments/active-qr');
    
    if (!response.success) {
      log('Failed to check active QR payments:', response.message);
      return null;
    }
    
    if (!response.hasActivePayment) {
      log('No active QR payments found.');
      return null;
    }
    
    log('Found active QR payment:', {
      referenceId: response.payment.referenceId,
      amount: response.payment.amount,
      status: response.payment.status
    });
    
    return response.payment;
  } catch (error) {
    log('Error checking active QR payments:', error.message);
    throw error;
  }
}

// Step 3: Cancel active QR payment
async function cancelQrPayment(referenceId) {
  log(`Attempting to cancel QR payment with reference ID: ${referenceId}`);
  
  try {
    // First try the regular cancel endpoint
    const response = await makeRequest(`/api/payments/cancel/${referenceId}`, 'POST');
    
    if (response.success) {
      log('Successfully cancelled QR payment!');
      return true;
    }
    
    log('Regular cancel failed, trying debug endpoint:', response.message);
    
    // If that fails, try the debug endpoint
    const debugResponse = await makeRequest(`/api/debug/test-payment-webhook`, 'POST', {
      referenceId: referenceId,
      status: 'cancelled',
      forceUpdate: true
    });
    
    if (debugResponse.success) {
      log('Successfully cancelled QR payment through debug endpoint!');
      return true;
    }
    
    log('Failed to cancel QR payment through all methods:', debugResponse.message);
    return false;
  } catch (error) {
    log('Error cancelling QR payment:', error.message);
    throw error;
  }
}

// Step 4: Try cancelling specific transaction by ID
async function cancelPaymentById(transactionId) {
  log(`Getting details for transaction ID: ${transactionId}`);
  
  try {
    // Get the transaction details to extract reference ID
    const txResponse = await makeRequest(`/api/debug/get-transaction/${transactionId}`);
    
    if (!txResponse.success) {
      log('Failed to get transaction details:', txResponse.message);
      return false;
    }
    
    const transaction = txResponse.transaction;
    const referenceId = transaction.paymentReference;
    
    log(`Found transaction with reference ID: ${referenceId}`);
    return await cancelQrPayment(referenceId);
  } catch (error) {
    log('Error handling transaction cancellation:', error.message);
    throw error;
  }
}

// Main function
async function run() {
  log('======== STARTING QR PAYMENT CANCELLATION ========');
  
  try {
    // Login first
    await login();
    
    // Check for active QR payments
    const activePayment = await getActiveQrPayment();
    
    if (activePayment) {
      // Cancel the active payment
      await cancelQrPayment(activePayment.referenceId);
    } else {
      // Try cancelling known transaction by ID
      log('No active QR payment found through API, trying specific transaction IDs...');
      
      const knownTransactionIds = [9, 8, 7]; // Try recent transaction IDs
      for (const id of knownTransactionIds) {
        log(`Attempting to cancel transaction ID: ${id}`);
        const success = await cancelPaymentById(id);
        if (success) {
          log(`Successfully cancelled transaction with ID: ${id}`);
          break;
        }
      }
    }
    
    log('======== QR PAYMENT CANCELLATION COMPLETED ========');
    log('You can now generate a new QR payment for testing.');
    
  } catch (error) {
    log('Error in cancellation process:', error.message);
  }
}

// Run the script
run();