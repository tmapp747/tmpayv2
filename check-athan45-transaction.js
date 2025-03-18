/**
 * Script to check Athan45's transaction status, focusing on
 * both GCash payment status and casino transfer status
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

async function login() {
  console.log('Logging in as Athan45...');
  const result = await makeRequest('/api/auth/login', 'POST', {
    username: 'Athan45',
    password: 'password123'
  });
  
  if (!result.success) {
    console.error('Failed to login:', result.message);
    return null;
  }
  
  console.log('Login successful');
  return result.user;
}

async function getTransactions(userId) {
  console.log(`Getting transactions for user ID ${userId}...`);
  const result = await makeRequest(`/api/transactions?userId=${userId}`, 'GET');
  
  if (!result.success) {
    console.error('Failed to get transactions:', result.message);
    return [];
  }
  
  console.log(`Found ${result.transactions.length} transactions`);
  return result.transactions;
}

async function getTransaction(transactionId) {
  console.log(`Getting details for transaction ID ${transactionId}...`);
  const result = await makeRequest(`/api/transactions/${transactionId}`, 'GET');
  
  if (!result.success) {
    console.error('Failed to get transaction:', result.message);
    return null;
  }
  
  return result.transaction;
}

async function checkGCashPaymentStatus(referenceId) {
  console.log(`Checking GCash payment status for reference ${referenceId}...`);
  const result = await makeRequest(`/api/payments/status/${referenceId}`, 'GET');
  
  if (!result.success) {
    console.error('Failed to get payment status:', result.message);
    return null;
  }
  
  return result;
}

function displayTransactionDetails(transaction) {
  console.log('\nTransaction Details:');
  console.log('-------------------');
  console.log(`ID: ${transaction.id}`);
  console.log(`Amount: ${transaction.amount} ${transaction.currency}`);
  console.log(`Status: ${transaction.status}`);
  console.log(`Method: ${transaction.method}`);
  console.log(`Reference: ${transaction.reference || transaction.paymentReference}`);
  console.log(`Created At: ${new Date(transaction.createdAt).toLocaleString()}`);
  
  // Check for casino transfer status
  const metadata = transaction.metadata || {};
  console.log('\nCasino Transfer Status:');
  console.log('----------------------');
  
  if (metadata.casinoTransferStatus) {
    console.log(`Status: ${metadata.casinoTransferStatus}`);
    
    if (metadata.casinoTransferStatus === 'completed') {
      console.log(`Completed At: ${metadata.casinoTransferCompletedAt}`);
      console.log(`Casino Transaction ID: ${metadata.casinoTransactionId || 'N/A'}`);
      console.log(`Nonce: ${metadata.nonce || 'N/A'}`);
    } else if (metadata.casinoTransferStatus === 'failed') {
      console.log(`Failed At: ${metadata.casinoTransferAttemptedAt}`);
      console.log(`Error: ${metadata.casinoTransferError || 'Unknown error'}`);
    } else if (metadata.casinoTransferStatus === 'pending') {
      console.log('Casino transfer is still pending');
    }
  } else {
    console.log('No casino transfer information available');
  }
  
  // Check status history if available
  if (transaction.statusHistory && transaction.statusHistory.length > 0) {
    console.log('\nStatus History:');
    console.log('---------------');
    transaction.statusHistory.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.status} (${new Date(entry.timestamp).toLocaleString()})`);
      if (entry.note) console.log(`   Note: ${entry.note}`);
    });
  }
}

async function runCheck() {
  try {
    // Step 1: Login as Athan45
    const user = await login();
    if (!user) {
      console.error('Unable to continue without authentication');
      return;
    }
    
    // Step 2: Get recent transactions
    const transactions = await getTransactions(user.id);
    if (!transactions || transactions.length === 0) {
      console.log('No transactions found for Athan45');
      return;
    }
    
    // Sort transactions by created date (newest first)
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Find the most recent GCash payment transaction
    const gcashTransaction = transactions.find(tx => 
      tx.method === 'gcash' && ['completed', 'payment_completed'].includes(tx.status)
    );
    
    if (!gcashTransaction) {
      console.log('No completed GCash transactions found for Athan45');
      
      // Just show the most recent transaction instead
      console.log('Most recent transaction:');
      displayTransactionDetails(transactions[0]);
      
      return;
    }
    
    // Step 3: Get detailed information for the GCash transaction
    const detailedTransaction = await getTransaction(gcashTransaction.id);
    if (!detailedTransaction) {
      console.log('Unable to retrieve detailed transaction information');
      return;
    }
    
    // Step 4: Display the transaction details with focus on casino transfer status
    displayTransactionDetails(detailedTransaction);
    
    // Step 5: Check the GCash payment status through the payments API
    if (detailedTransaction.paymentReference || detailedTransaction.reference) {
      const reference = detailedTransaction.paymentReference || detailedTransaction.reference;
      const paymentStatus = await checkGCashPaymentStatus(reference);
      
      if (paymentStatus) {
        console.log('\nPayment API Status:');
        console.log('------------------');
        console.log(`Status: ${paymentStatus.status}`);
        
        if (paymentStatus.qrPayment) {
          console.log(`QR Payment Status: ${paymentStatus.qrPayment.status}`);
          console.log(`QR Payment Completed: ${paymentStatus.qrPayment.completedAt || 'N/A'}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error during check:', error);
  }
}

// Run the check
runCheck();