/**
 * Test script for the new GCash status check endpoint
 * 
 * This script:
 * 1. Authenticates using test credentials
 * 2. Generates a GCash QR code
 * 3. Checks the status using the new status check endpoint
 * 4. Outputs the detailed response
 */

import axios from 'axios';

const baseUrl = 'http://localhost:5000';
const username = 'Athan45';
const password = 'password';

function log(message, data = null) {
  console.log(`[${new Date().toISOString()}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function makeRequest(endpoint, method = 'GET', body = null, token = null) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios({
      method,
      url: `${baseUrl}${endpoint}`,
      data: body,
      headers
    });
    
    return response.data;
  } catch (error) {
    log('API request error:', {
      endpoint,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
}

async function login() {
  log('Logging in with test credentials');
  
  const response = await makeRequest('/api/auth/login', 'POST', {
    username,
    password
  });
  
  log('Login successful:', response);
  
  return response.token;
}

async function generateGCashQR(token) {
  log('Generating GCash QR code');
  
  const response = await makeRequest('/api/payments/gcash/generate-qr', 'POST', {
    amount: 100
  }, token);
  
  log('Generated GCash QR:', response);
  
  return response;
}

async function checkPaymentStatus(referenceId, token) {
  log(`Checking payment status for reference: ${referenceId}`);
  
  const response = await makeRequest(`/api/payments/status/${referenceId}`, 'GET', null, token);
  
  log('Payment status response:', response);
  
  return response;
}

async function runTest() {
  try {
    // 1. Login
    const token = await login();
    
    // 2. Generate a GCash QR
    const paymentResponse = await generateGCashQR(token);
    const referenceId = paymentResponse.reference;
    
    // 3. Check initial status
    log('Checking initial payment status');
    await checkPaymentStatus(referenceId, token);
    
    // 4. Wait a few seconds and check again to see real-time updates
    log('Waiting 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    log('Checking payment status again');
    await checkPaymentStatus(referenceId, token);
    
    log('Test completed successfully');
  } catch (error) {
    log('Test failed:', error);
  }
}

runTest();