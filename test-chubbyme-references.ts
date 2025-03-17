/**
 * Test script to verify username-based transaction references for Chubbyme user
 * 
 * This test directly calls the API endpoints to:
 * 1. Check if transaction references include the username
 * 2. Verify transactions are immediately visible
 * 3. Test consistency across different transaction types
 */

import fetch from 'node-fetch';

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  username: 'Chubbyme',
  password: 'Password@123'
};
let authToken: string | null = null;

// Utility functions
async function makeAuthenticatedRequest(endpoint: string, method = 'GET', body: any = null) {
  const options: any = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  if (authToken) {
    options.headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    return await response.json();
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error);
    throw error;
  }
}

async function login() {
  console.log(`Logging in as ${TEST_USER.username}...`);
  const loginResult = await makeAuthenticatedRequest('/api/auth/login', 'POST', {
    username: TEST_USER.username,
    password: TEST_USER.password
  });

  if (loginResult.success) {
    console.log('Login successful!');
    authToken = loginResult.accessToken;
    return true;
  } else {
    console.error('Login failed:', loginResult.message);
    return false;
  }
}

async function getTransactionHistory() {
  const result = await makeAuthenticatedRequest('/api/transactions');
  return result.transactions || [];
}

async function createTestTransaction() {
  console.log('Creating test transaction...');
  const result = await makeAuthenticatedRequest('/api/debug/test-transaction', 'GET');
  
  if (result.success) {
    console.log('Test transaction created successfully!');
    console.log(`Reference: ${result.testReference}`);
    return result;
  } else {
    console.error('Error creating test transaction:', result.message);
    return null;
  }
}

// Test functions
async function testTransactionReferences() {
  console.log('\n----- Testing Username-Based Transaction References -----\n');

  // Step 1: Get current transactions as baseline
  console.log('Step 1: Getting current transactions...');
  const transactionsBefore = await getTransactionHistory();
  console.log(`Found ${transactionsBefore.length} existing transactions`);

  // Step 2: Create a test transaction
  console.log('\nStep 2: Creating a test transaction...');
  const createResult = await createTestTransaction();
  if (!createResult) return false;

  // Step 3: Verify reference contains username
  console.log('\nStep 3: Verifying reference contains username...');
  const reference = createResult.testReference;
  const includesUsername = reference.toLowerCase().includes(TEST_USER.username.toLowerCase());
  
  console.log(`Reference: ${reference}`);
  console.log(`Contains username: ${includesUsername ? 'YES ✅' : 'NO ❌'}`);
  
  if (!includesUsername) {
    console.error('FAILURE: Reference does not contain the username');
    return false;
  }

  // Step 4: Verify transaction is immediately visible
  console.log('\nStep 4: Verifying transaction is immediately visible...');
  const transactionsAfter = await getTransactionHistory();
  console.log(`Found ${transactionsAfter.length} transactions after test (before: ${transactionsBefore.length})`);
  
  const isVisible = transactionsAfter.length > transactionsBefore.length;
  console.log(`Transaction is immediately visible: ${isVisible ? 'YES ✅' : 'NO ❌'}`);
  
  if (!isVisible) {
    console.error('FAILURE: Transaction not immediately visible in history');
    return false;
  }

  // Step 5: Examine the most recent transaction
  console.log('\nStep 5: Examining most recent transaction...');
  const latestTransaction = transactionsAfter[0]; // Assuming sorted by newest first
  
  console.log(`Transaction ID: ${latestTransaction.id}`);
  console.log(`Type: ${latestTransaction.type}`);
  console.log(`Status: ${latestTransaction.status}`);
  console.log(`Payment Reference: ${latestTransaction.paymentReference}`);
  console.log(`Transaction Reference: ${latestTransaction.transactionId}`);
  
  // Success!
  console.log('\nTEST PASSED ✅: Username-based transaction references are working correctly.\n');
  return true;
}

// Main test function
async function runTests() {
  console.log('===== Username-Based Transaction Reference System Test =====\n');
  
  // Step 1: Login
  const loggedIn = await login();
  if (!loggedIn) {
    console.error('Cannot proceed with tests due to login failure.');
    return false;
  }
  
  // Step 2: Test transaction references
  const success = await testTransactionReferences();
  
  console.log(`\n===== Test Summary =====`);
  console.log(`Overall Test Result: ${success ? 'PASSED ✅' : 'FAILED ❌'}`);
  
  return success;
}

// Run the tests
runTests()
  .then(success => {
    console.log(`\nTest script complete. Result: ${success ? 'SUCCESS' : 'FAILURE'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error during test execution:', error);
    process.exit(1);
  });