/**
 * Test script for the new DirectPay webhook endpoint
 * 
 * This script:
 * 1. Logs in with test credentials
 * 2. Generates a GCash QR payment
 * 3. Simulates a DirectPay webhook callback with SUCCESS status
 * 4. Verifies the transaction status was updated
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';
const WEBHOOK_URL = `${API_BASE_URL}/webhook/directpay/payment`;

async function makeRequest(endpoint, method = 'GET', body = null, token = null) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios({
      method,
      url: `${API_BASE_URL}${endpoint}`,
      data: body,
      headers
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

async function login() {
  console.log('Logging in...');
  // Use session-based authentication instead of password login
  const loginResponse = await makeRequest('/auth/login', 'POST', {
    username: 'Beding1948',
    password: 'testing123' // Updated password
  });
  
  if (!loginResponse.success) {
    throw new Error('Login failed');
  }
  
  console.log('Login successful');
  return loginResponse.accessToken;
}

async function generateGCashQR(token) {
  console.log('Generating GCash QR code...');
  const qrResponse = await makeRequest('/payments/gcash/generate-qr', 'POST', {
    amount: 100,
    description: 'Test payment for webhook'
  }, token);
  
  if (!qrResponse.success) {
    throw new Error('Failed to generate QR code');
  }
  
  console.log(`QR code generated with reference: ${qrResponse.reference}`);
  console.log(`Payment URL: ${qrResponse.payUrl}`);
  
  return {
    reference: qrResponse.reference,
    transactionId: qrResponse.transactionId
  };
}

async function simulateWebhook(reference) {
  console.log(`Simulating webhook for payment reference: ${reference}`);
  
  // Format the webhook payload to match DirectPay's format
  const webhookPayload = {
    amount: "100",
    currency: "PHP",
    refId: reference,
    invoiceNo: "Invoice_" + Date.now(),
    txnDesc: `Add Funds via GCASH QR|refId:${reference}`,
    txnDate: Date.now().toString(),
    txnId: "dp_" + Date.now(),
    status: "SUCCESS",
    merchant_id: "ACw4xoKnvj52StUi"
  };
  
  try {
    const webhookResponse = await axios.post(WEBHOOK_URL, webhookPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Webhook response:', webhookResponse.data);
    return webhookResponse.data;
  } catch (error) {
    console.error('Webhook simulation error:', error.response?.data || error.message);
    throw error;
  }
}

async function checkTransactionStatus(token, transactionId) {
  console.log(`Checking transaction status for ID: ${transactionId}`);
  
  const statusResponse = await makeRequest(`/transactions/${transactionId}`, 'GET', null, token);
  
  if (!statusResponse.success) {
    throw new Error('Failed to get transaction status');
  }
  
  console.log('Transaction status:', statusResponse.transaction.status);
  console.log('Transaction metadata:', JSON.stringify(statusResponse.transaction.metadata, null, 2));
  
  return statusResponse.transaction;
}

async function runTest() {
  try {
    // Step 1: Login
    const token = await login();
    
    // Step 2: Generate QR code
    const { reference, transactionId } = await generateGCashQR(token);
    
    // Step 3: Check initial transaction status
    console.log('\nInitial transaction status:');
    await checkTransactionStatus(token, transactionId);
    
    // Step 4: Simulate the webhook
    console.log('\nSimulating webhook call...');
    await simulateWebhook(reference);
    
    // Step 5: Check updated transaction status
    console.log('\nUpdated transaction status:');
    await checkTransactionStatus(token, transactionId);
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTest();