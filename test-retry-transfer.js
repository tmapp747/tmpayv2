/**
 * Simple script to retry the casino transfer for a specific transaction
 */

import fetch from 'node-fetch';

const baseUrl = 'http://localhost:5000';
const transactionId = 17; // The transaction ID to retry

async function fetchTransaction() {
  try {
    // Get transaction via API instead of direct DB access
    const response = await fetch(`${baseUrl}/api/debug/get-transaction/${transactionId}`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('API response for transaction:', result);
    
    if (result.success && result.transaction) {
      return result.transaction;
    } else {
      console.error('API returned error:', result.message || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }
}

async function simulateWebhook() {
  try {
    // Use the API endpoint for processing pending transfers
    const response = await fetch(`${baseUrl}/api/payments/process-pending-transfers`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin-bypass-token' // Special token for admin access
      },
      body: JSON.stringify({
        forceRetry: true
      })
    });
    
    const result = await response.json();
    console.log('API response:', result);
    return result.success;
  } catch (error) {
    console.error('API request error:', error);
    return false;
  }
}

async function runTest() {
  console.log('Starting transfer retry test...');
  
  // First, check the transaction
  const transaction = await fetchTransaction();
  if (!transaction) {
    console.error('Transaction not found');
    return;
  }
  
  console.log('Transaction before retry:');
  console.log('- Status:', transaction.status);
  console.log('- Metadata:', transaction.metadata);
  
  // Try to process the pending transfer
  console.log('\nAttempting to retry transfer...');
  const success = await simulateWebhook();
  
  if (success) {
    console.log('\nRetry initiated successfully');
    
    // Check the updated transaction
    setTimeout(async () => {
      const updatedTransaction = await fetchTransaction();
      if (updatedTransaction) {
        console.log('\nTransaction after retry:');
        console.log('- Status:', updatedTransaction.status);
        console.log('- Metadata:', updatedTransaction.metadata);
      }
    }, 1000);
  } else {
    console.log('\nRetry failed');
  }
}

runTest();