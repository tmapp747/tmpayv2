/**
 * Test script to verify fixes for Athan45's casino transfer issue
 * 
 * This test simulates a GCash payment flow and tests for proper
 * handling of missing casinoUsername by using username as a fallback
 */

import axios from 'axios';
import { setTimeout } from 'timers/promises';

async function makeRequest(endpoint, method = 'GET', body = null, token = null) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios({
      method,
      url: `http://localhost:5000${endpoint}`,
      data: body ? JSON.stringify(body) : undefined,
      headers
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error making request to ${endpoint}: ${error.message}`);
    if (error.response && error.response.data) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

async function login() {
  try {
    console.log('🔑 Logging in as Athan45...');
    const response = await makeRequest('/api/auth/login', 'POST', {
      username: 'Athan45',
      password: 'password123'  // Use the correct password for your test user
    });
    
    console.log('✅ Login successful');
    return {
      userId: response.user.id,
      accessToken: response.user.accessToken,
      refreshToken: response.user.refreshToken,
      casinoClientId: response.user.casinoClientId
    };
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw new Error('Login failed. Make sure Athan45 exists with the correct password.');
  }
}

async function generateGCashQR(token, amount = 100) {
  try {
    console.log(`💰 Generating GCash QR for PHP ${amount}...`);
    const response = await makeRequest('/api/payments/gcash/generate-qr', 'POST', {
      amount: amount
    }, token);
    
    console.log('✅ GCash QR generated successfully');
    return {
      transactionId: response.transactionId,
      referenceId: response.referenceId,
      qrCodeData: response.qrCodeData,
      payUrl: response.payUrl
    };
  } catch (error) {
    console.error('❌ Failed to generate GCash QR:', error.message);
    throw error;
  }
}

async function simulatePaymentCompletion(referenceId) {
  try {
    console.log(`🔄 Simulating payment completion for reference ${referenceId}...`);
    const response = await makeRequest('/api/debug/test-payment-webhook', 'POST', {
      referenceId: referenceId
    });
    
    console.log('✅ Payment completion simulated');
    return response;
  } catch (error) {
    console.error('❌ Failed to simulate payment completion:', error.message);
    throw error;
  }
}

async function checkTransactionStatus(token, transactionId) {
  try {
    console.log(`🔍 Checking transaction status for ID ${transactionId}...`);
    const response = await makeRequest(`/api/transactions/${transactionId}`, 'GET', null, token);
    
    console.log(`ℹ️ Transaction status: ${response.transaction.status}`);
    console.log(`ℹ️ Casino transfer status: ${response.transaction.metadata?.casinoTransferStatus || 'not_started'}`);
    
    return response.transaction;
  } catch (error) {
    console.error('❌ Failed to check transaction status:', error.message);
    throw error;
  }
}

async function waitForTransactionCompletion(token, transactionId, maxWaitTimeMs = 30000, intervalMs = 1000) {
  console.log(`⏱️ Waiting for transaction ${transactionId} to complete (max ${maxWaitTimeMs / 1000}s)...`);
  
  const startTime = Date.now();
  let transaction;
  
  while (Date.now() - startTime < maxWaitTimeMs) {
    transaction = await checkTransactionStatus(token, transactionId);
    
    // Check if transaction is fully completed (both payment and casino transfer)
    const paymentCompleted = transaction.status === 'completed' || transaction.status === 'payment_completed';
    const casinoTransferCompleted = transaction.metadata?.casinoTransferStatus === 'completed';
    
    if (paymentCompleted && casinoTransferCompleted) {
      console.log('✅ Transaction fully completed (payment and casino transfer)');
      return transaction;
    }
    
    // If payment completed but casino transfer failed, that's the issue we're trying to fix
    if (paymentCompleted && transaction.metadata?.casinoTransferStatus === 'failed') {
      console.log('❌ ERROR: Payment completed but casino transfer failed!');
      console.log('Metadata:', JSON.stringify(transaction.metadata, null, 2));
      return transaction;
    }
    
    console.log(`⏱️ Still waiting... (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`);
    await setTimeout(intervalMs);
  }
  
  console.log('⏱️ Maximum wait time reached');
  return transaction;
}

async function runTest() {
  try {
    console.log('🚀 Starting Athan45 Casino Transfer Fix Test');
    
    // Login with test account
    const authData = await login();
    
    // Generate GCash QR Code
    const paymentData = await generateGCashQR(authData.accessToken, 100);
    
    // Give a little time for transaction to be created
    await setTimeout(1000);
    
    // Simulate payment completion via webhook
    await simulatePaymentCompletion(paymentData.referenceId);
    
    // Wait for the transaction to complete
    const completedTransaction = await waitForTransactionCompletion(
      authData.accessToken, 
      paymentData.transactionId,
      20000 // 20 seconds max wait time
    );
    
    // Final verification
    if (completedTransaction.metadata?.casinoTransferStatus === 'completed') {
      console.log('🎉 TEST PASSED: Athan45 casino transfer fix is working!');
      console.log('Transaction details:', JSON.stringify(completedTransaction, null, 2));
    } else {
      console.log('❌ TEST FAILED: Casino transfer did not complete successfully');
      console.log('Final transaction state:', JSON.stringify(completedTransaction, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
runTest();