/**
 * Test script for retrying a casino transfer for an existing transaction
 * 
 * This script:
 * 1. Gets details about an existing transaction (default ID: 17)
 * 2. Simulates a webhook to trigger a casino transfer retry
 * 3. Checks the transaction status after the retry attempt
 */

import axios from 'axios';
const BASE_URL = 'http://localhost:5000';

async function makeRequest(endpoint, method = 'GET', body = null) {
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${endpoint}`,
      data: body || undefined,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      console.error('API Error:', error.response.data);
      return error.response.data;
    }
    throw error;
  }
}

async function getTransaction(id = 17) {
  console.log(`Getting transaction with ID ${id}...`);
  const result = await makeRequest(`/api/debug/get-transaction/${id}`, 'GET');
  
  if (!result.success) {
    console.error('Failed to get transaction:', result.message);
    return null;
  }
  
  console.log('Transaction retrieved successfully');
  console.log('Transaction Status:', result.transaction.status);
  console.log('Casino Transfer Status:', result.transaction.metadata.casinoTransferStatus || 'unknown');
  console.log('Transfer Attempts:', result.transaction.metadata.transferAttempts || 0);
  
  return result.transaction;
}

async function simulateWebhook(transactionId, reference) {
  console.log(`Simulating webhook for transaction ${transactionId} with reference ${reference}...`);
  
  const webhookPayload = {
    reference: reference,
    status: 'PAID',
    transactionId: transactionId.toString()
  };
  
  const result = await makeRequest('/api/webhook/directpay/payment', 'POST', webhookPayload);
  
  if (!result.success) {
    console.error('Webhook simulation failed:', result.message);
    return false;
  }
  
  console.log('Webhook simulation successful:', result.message);
  return true;
}

async function runTest(transactionId = 17) {
  try {
    // Step 1: Get the transaction details
    const transaction = await getTransaction(transactionId);
    if (!transaction) {
      return;
    }
    
    // Step 2: Simulate a webhook for this transaction
    const reference = transaction.paymentReference || transaction.reference;
    if (!reference) {
      console.error('Transaction has no reference, cannot simulate webhook');
      return;
    }
    
    console.log(`Using reference: ${reference} for webhook simulation`);
    const webhookSuccess = await simulateWebhook(transactionId, reference);
    
    if (!webhookSuccess) {
      console.error('Failed to simulate webhook');
      return;
    }
    
    // Step 3: Check the transaction status after the webhook
    console.log('\nChecking transaction status after webhook...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Brief pause to let processing complete
    const updatedTransaction = await getTransaction(transactionId);
    
    if (updatedTransaction) {
      console.log('\nTransaction Status Update:');
      console.log('Previous Status:', transaction.status);
      console.log('Current Status:', updatedTransaction.status);
      console.log('Previous Casino Transfer Status:', transaction.metadata.casinoTransferStatus || 'unknown');
      console.log('Current Casino Transfer Status:', updatedTransaction.metadata.casinoTransferStatus || 'unknown');
      console.log('Previous Transfer Attempts:', transaction.metadata.transferAttempts || 0);
      console.log('Current Transfer Attempts:', updatedTransaction.metadata.transferAttempts || 0);
      
      // Check if there are status history entries
      if (updatedTransaction.statusHistory && updatedTransaction.statusHistory.length > 0) {
        console.log('\nStatus History:');
        updatedTransaction.statusHistory.forEach((entry, index) => {
          console.log(`${index + 1}. ${entry.status} (${new Date(entry.timestamp).toLocaleString()}) - ${entry.note || 'No note'}`);
        });
      }
      
      // Check if there are transfer attempts in metadata
      if (updatedTransaction.metadata.transferAttemptDetails) {
        console.log('\nTransfer Attempt Details:');
        const attempts = Array.isArray(updatedTransaction.metadata.transferAttemptDetails) 
          ? updatedTransaction.metadata.transferAttemptDetails 
          : [updatedTransaction.metadata.transferAttemptDetails];
        
        attempts.forEach((attempt, index) => {
          console.log(`Attempt ${index + 1}:`);
          console.log(`  Timestamp: ${attempt.timestamp}`);
          console.log(`  Status: ${attempt.status}`);
          if (attempt.error) console.log(`  Error: ${attempt.error}`);
          if (attempt.tokenSource) console.log(`  Token Source: ${attempt.tokenSource}`);
          console.log('');
        });
      }
    }
    
  } catch (error) {
    console.error('Error running test:', error);
  }
}

// Get transaction ID from command line argument, default to 17
const transactionId = process.argv[2] ? parseInt(process.argv[2]) : 17;
console.log(`Using transaction ID: ${transactionId}`);

// Run the test
runTest(transactionId).catch(console.error);