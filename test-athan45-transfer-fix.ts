/**
 * Test script to verify fixes for Athan45's casino transfer issue
 * 
 * This test simulates a GCash payment flow and tests for proper
 * handling of missing casinoUsername by using username as a fallback
 */

import { db } from './server/db';
import { storage } from './server/storage';
import { eq } from 'drizzle-orm';
import { users } from './shared/schema';

// Function to test the API directly
async function makeRequest(endpoint: string, method = 'GET', body: any = null, token: string | null = null) {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`http://localhost:5000${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });
    
    return await response.json();
  } catch (error) {
    console.error('Request failed:', error);
    return { success: false, error: String(error) };
  }
}

// Login to get an auth token
async function login() {
  console.log('🔑 Logging in as Athan45...');
  
  const loginResponse = await makeRequest('/api/auth/login', 'POST', {
    username: 'Athan45',
    password: 'password123'
  });
  
  if (!loginResponse.success) {
    console.error('❌ Login failed:', loginResponse.message);
    // Try a different password
    const alternateLogin = await makeRequest('/api/auth/login', 'POST', {
      username: 'Athan45',
      password: 'athan45'
    });
    
    if (!alternateLogin.success) {
      console.error('❌ Alternate login also failed. Using debug endpoints instead.');
      return null;
    }
    
    return alternateLogin.accessToken;
  }
  
  console.log('✅ Login successful');
  return loginResponse.accessToken;
}

// Generate a GCash QR code for payment
async function generateGCashQR(token: string | null, amount = 100) {
  console.log(`💸 Generating GCash QR code for PHP ${amount}...`);
  
  // If no token, use test endpoint without auth
  if (!token) {
    const testResponse = await makeRequest('/api/debug/test-transaction', 'GET');
    
    if (!testResponse.success) {
      console.error('❌ Failed to create test transaction:', testResponse.message);
      throw new Error('Failed to create test transaction');
    }
    
    console.log('✅ Created test transaction instead:', {
      id: testResponse.transaction.id,
      amount: testResponse.transaction.amount,
      reference: testResponse.transaction.paymentReference
    });
    
    return {
      success: true,
      transactionId: testResponse.transaction.id,
      referenceId: testResponse.transaction.paymentReference || ''
    };
  }
  
  // Use the authenticated endpoint
  const response = await makeRequest('/api/payments/gcash/generate-qr', 'POST', {
    amount
  }, token);
  
  if (!response.success) {
    console.error('❌ Failed to generate QR code:', response.message);
    throw new Error('Failed to generate QR code');
  }
  
  console.log('✅ QR code generated:', {
    transactionId: response.transactionId,
    referenceId: response.referenceId,
    qrCodeData: response.qrCodeData?.substring(0, 20) + '...'
  });
  
  return response;
}

// Simulate payment completion via webhook
async function simulatePaymentCompletion(referenceId: string) {
  console.log('💰 Simulating GCash payment completion for reference:', referenceId);
  
  const response = await makeRequest('/api/debug/test-payment-webhook', 'POST', {
    referenceId
  });
  
  if (!response.success) {
    console.error('❌ Payment simulation failed:', response.message);
    throw new Error('Payment simulation failed');
  }
  
  console.log('✅ Payment simulation successful');
  return response;
}

// Check transaction status
async function checkTransactionStatus(token: string | null, transactionId: number) {
  console.log('🔍 Checking transaction status for ID:', transactionId);
  
  // For testing, use the debug endpoint without auth
  const endpoint = token
    ? `/api/transactions/${transactionId}`
    : `/api/debug/get-transaction/${transactionId}`;
  
  const response = await makeRequest(endpoint, 'GET', null, token);
  
  if (!response.success) {
    console.error('❌ Failed to get transaction status:', response.message);
    throw new Error('Failed to get transaction status');
  }
  
  console.log('ℹ️ Transaction status:', {
    id: response.transaction.id,
    status: response.transaction.status,
    casinoTransferStatus: response.transaction.metadata?.casinoTransferStatus || 'not_available',
    casinoUsername: response.transaction.casinoUsername || response.transaction.metadata?.casinoUsername || null
  });
  
  return response.transaction;
}

// Wait for transaction to reach certain status
async function waitForTransactionCompletion(
  token: string | null,
  transactionId: number,
  maxWaitTimeMs = 30000,
  intervalMs = 1000
) {
  console.log(`⏳ Waiting for transaction ${transactionId} completion (max ${maxWaitTimeMs / 1000}s)...`);
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTimeMs) {
    const transaction = await checkTransactionStatus(token, transactionId);
    
    if (transaction.status === 'completed') {
      console.log('✅ Transaction completed successfully!');
      return transaction;
    }
    
    if (transaction.status === 'failed') {
      console.error('❌ Transaction failed');
      return transaction;
    }
    
    // Check if casino transfer was successful
    if (transaction.metadata?.casinoTransferStatus === 'completed') {
      console.log('🎰 Casino transfer completed successfully!');
      return transaction;
    }
    
    // Wait for the next interval
    console.log(`⏳ Waiting... (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`);
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  console.warn('⚠️ Max wait time reached without completion');
  return await checkTransactionStatus(token, transactionId);
}

// Directly test the username fallback mechanism
async function testUsernameFallback() {
  try {
    console.log('🧪 Testing username fallback for missing casinoUsername...');
    
    // Get Athan45's user data from DB
    const user = await db.query.users.findFirst({
      where: eq(users.username, 'Athan45')
    });
    
    if (!user) {
      console.error('❌ User Athan45 not found in database');
      throw new Error('User not found');
    }
    
    console.log('📋 User data:', {
      id: user.id,
      username: user.username,
      casinoUsername: user.casinoUsername,
      casinoClientId: user.casinoClientId
    });
    
    // Store original values
    const originalCasinoUsername = user.casinoUsername;
    
    try {
      // Temporarily set casinoUsername to null to replicate the issue
      console.log('⚠️ Setting casinoUsername to null temporarily to simulate issue');
      await db.update(users)
        .set({ casinoUsername: null })
        .where(eq(users.id, user.id));
      
      // Run the test flow
      const token = await login();
      const qrResponse = await generateGCashQR(token);
      const paymentResponse = await simulatePaymentCompletion(qrResponse.referenceId);
      
      // Wait for the transaction to complete
      const finalTransaction = await waitForTransactionCompletion(
        token,
        qrResponse.transactionId,
        60000, // 60 seconds max wait
        2000   // Check every 2 seconds
      );
      
      // Check if our fix worked
      if (finalTransaction.metadata?.casinoTransferStatus === 'completed') {
        console.log('🎉 SUCCESS: Casino transfer completed successfully despite null casinoUsername!');
        console.log('This means our fix for using username as fallback for casinoUsername is working!');
        
        // Double check if the user record was auto-updated
        const updatedUser = await db.query.users.findFirst({
          where: eq(users.id, user.id)
        });
        
        if (updatedUser && updatedUser.casinoUsername === user.username) {
          console.log('✅ Auto-update feature worked! casinoUsername was set to regular username.');
        } else {
          console.log('⚠️ Auto-update feature didn\'t work. casinoUsername is still:', 
            updatedUser ? updatedUser.casinoUsername : 'unknown');
        }
        
        return true;
      } else {
        console.log('❌ FAILURE: Casino transfer did not complete successfully');
        console.log('Details:', finalTransaction);
        return false;
      }
    } finally {
      // Restore original casinoUsername
      console.log('🔄 Restoring original user data');
      await db.update(users)
        .set({ casinoUsername: originalCasinoUsername })
        .where(eq(users.id, user.id));
      console.log('✅ User data restored');
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Main test function
async function runTest() {
  console.log('🚀 Starting Athan45 casino transfer fix test...');
  
  try {
    // Test the username fallback mechanism
    await testUsernameFallback();
  } catch (error) {
    console.error('❌ Test encountered an unexpected error:', error);
  }
  
  console.log('🏁 Test completed');
}

// Run the test
runTest();