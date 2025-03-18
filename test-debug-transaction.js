/**
 * Test script for the debug transaction endpoints
 * This script tests both creating a test transaction and retrieving it by ID
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
    // If there's an error response from the server, return that
    if (error.response && error.response.data) {
      console.error('API Error:', error.response.data);
      return error.response.data;
    }
    // Otherwise, throw the error
    throw error;
  }
}

async function createTestTransaction() {
  console.log('Creating test transaction...');
  const result = await makeRequest('/api/debug/test-transaction?username=Athan45', 'GET');
  
  if (!result.success) {
    console.error('Failed to create test transaction:', result.message);
    return null;
  }
  
  console.log('Test transaction created successfully:', result.transaction.id);
  return result.transaction;
}

async function getTransactionById(id) {
  console.log(`Getting transaction with ID ${id}...`);
  const result = await makeRequest(`/api/debug/get-transaction/${id}`, 'GET');
  
  if (!result.success) {
    console.error('Failed to get transaction:', result.message);
    return null;
  }
  
  console.log('Transaction retrieved successfully:', result.transaction.id);
  return result.transaction;
}

async function runTest() {
  try {
    // Step 1: Create a test transaction
    const createdTransaction = await createTestTransaction();
    if (!createdTransaction) {
      return;
    }
    
    // Step 2: Get the transaction by ID
    const retrievedTransaction = await getTransactionById(createdTransaction.id);
    if (!retrievedTransaction) {
      return;
    }
    
    // Step 3: Verify that the retrieved transaction matches the created one
    const isMatch = createdTransaction.id === retrievedTransaction.id &&
                    createdTransaction.amount === retrievedTransaction.amount &&
                    createdTransaction.method === retrievedTransaction.method;
    
    if (isMatch) {
      console.log('Test successful! Retrieved transaction matches created transaction.');
      console.log('Transaction details:', JSON.stringify(retrievedTransaction, null, 2));
    } else {
      console.error('Test failed! Retrieved transaction does not match created transaction.');
      console.log('Created transaction:', JSON.stringify(createdTransaction, null, 2));
      console.log('Retrieved transaction:', JSON.stringify(retrievedTransaction, null, 2));
    }
    
    // Optional: Try getting a non-existent transaction
    console.log('\nAttempting to get a non-existent transaction...');
    const nonExistentResult = await getTransactionById(999999);
    if (!nonExistentResult) {
      console.log('Successfully handled non-existent transaction case');
    }
    
  } catch (error) {
    console.error('Error running test:', error);
  }
}

// Run the test
runTest().catch(console.error);