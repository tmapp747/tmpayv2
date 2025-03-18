/**
 * Generate payment link for Athan45 to test the casino transfer fix
 * 
 * This script:
 * 1. Logs in with Athan45 credentials
 * 2. Generates a GCash QR code for PHP 100
 * 3. Provides the payment URL for manual payment
 */

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const AMOUNT = 100;
const USERNAME = 'Athan45';
const PASSWORD = 'A123456@';

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
}

// Helper function to make API requests
async function makeRequest(endpoint, method = 'GET', body = null, token = null) {
  const url = API_BASE_URL + endpoint;
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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
    return { success: false, error: error.message };
  }
}

// Log in and generate GCash QR code
async function run() {
  try {
    log('======== ATHAN45 PAYMENT LINK GENERATOR ========');
    
    // 1. Login
    log('Attempting login with Athan45 credentials...');
    const loginResponse = await makeRequest('/api/auth/login', 'POST', {
      username: USERNAME,
      password: PASSWORD
    });
    
    if (!loginResponse.success) {
      log('Login failed:', loginResponse.message);
      
      // Try creating a test transaction without login
      log('Creating test transaction instead...');
      const testResponse = await makeRequest('/api/debug/test-transaction', 'GET');
      
      if (testResponse.success) {
        log('Test transaction created:', {
          id: testResponse.transaction.id,
          reference: testResponse.transaction.paymentReference
        });
        
        log('⚠️ Note: This is just a test transaction, not actually linked to Athan45');
        log('Please use one of the methods below to test the fix properly');
        
        // Provide instructions for manual testing
        log('\n======== ALTERNATIVE TESTING OPTIONS ========');
        log('Option 1: Log in to the web interface as Athan45 and make a payment');
        log('Option 2: Modify the Athan45 password in the database to match the test credentials');
        log('Option 3: Use one of the test scripts to simulate a payment for Athan45 user ID');
      }
      
      return;
    }
    
    const accessToken = loginResponse.accessToken;
    log('Login successful!');
    
    // 2. Generate QR Code
    log(`Generating GCash QR code for PHP ${AMOUNT}...`);
    const qrResponse = await makeRequest('/api/payments/gcash/generate-qr', 'POST', {
      amount: AMOUNT
    }, accessToken);
    
    if (!qrResponse.success) {
      log('Failed to generate QR code:', qrResponse.message);
      return;
    }
    
    // 3. Display payment information
    log('GCash QR code generated successfully!');
    log('Transaction details:', {
      transactionId: qrResponse.transactionId,
      referenceId: qrResponse.referenceId
    });
    
    console.log('\n============= PAYMENT INSTRUCTIONS =============');
    console.log(`1. Open this URL to make your payment: ${qrResponse.payUrl}`);
    console.log(`2. Pay exactly PHP ${AMOUNT} using GCash`);
    console.log(`3. Reference ID: ${qrResponse.referenceId}`);
    console.log(`4. After payment, check the transaction status using:`);
    console.log(`   curl http://localhost:5000/api/debug/get-transaction/${qrResponse.transactionId}`);
    console.log('==============================================\n');
    
    log('To check the transaction status after payment, run:');
    log(`node -e "fetch('http://localhost:5000/api/debug/get-transaction/${qrResponse.transactionId}').then(r=>r.json()).then(console.log)"`);
    
  } catch (error) {
    log('Error:', error.message);
  }
}

// Run the script
run();