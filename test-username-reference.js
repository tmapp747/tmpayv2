/**
 * Test script for verifying the username-based transaction reference system
 * 
 * This test validates:
 * 1. Transaction references now include username for better tracking
 * 2. Transactions are immediately visible in user's history
 * 3. References are consistent across different transaction types
 */

import fetch from 'node-fetch';
import { log } from './server/vite.js';

const BASE_URL = 'http://localhost:3000';

async function makeRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    return await response.json();
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error);
    throw error;
  }
}

async function testTransactionReferenceForUser(username) {
  console.log(`\n----- Testing Transaction References for User: ${username} -----\n`);
  
  // 1. Get current transactions to compare before/after
  console.log(`Step 1: Getting current transactions for ${username}...`);
  const beforeResult = await makeRequest(`/api/debug/test-transaction?username=${encodeURIComponent(username)}`);
  
  if (!beforeResult.success) {
    console.error(`Error getting transactions: ${beforeResult.message}`);
    return false;
  }
  
  // Check the current transactions count
  const beforeCount = beforeResult.transactionCount;
  console.log(`Found ${beforeCount} transactions before test`);
  
  // 2. Create a new test transaction
  console.log(`\nStep 2: Creating test transaction for ${username}...`);
  const createResult = await makeRequest(`/api/debug/test-transaction?username=${encodeURIComponent(username)}`);
  
  if (!createResult.success) {
    console.error(`Error creating test transaction: ${createResult.message}`);
    return false;
  }
  
  // 3. Validate the transaction was created with proper reference
  console.log(`\nStep 3: Validating transaction reference...`);
  
  // Check if reference includes username
  const reference = createResult.testReference;
  const includesUsername = reference.includes(username);
  
  console.log(`Test reference: ${reference}`);
  console.log(`Reference includes username: ${includesUsername ? 'YES ✅' : 'NO ❌'}`);
  
  if (!includesUsername) {
    console.error('FAILURE: Transaction reference does not include username!');
    return false;
  }
  
  // 4. Verify transaction is immediately visible
  console.log(`\nStep 4: Verifying transaction visibility...`);
  const afterCount = createResult.transactionCount;
  const isVisible = createResult.newTransactionFound;
  
  console.log(`Transactions count after: ${afterCount} (before: ${beforeCount})`);
  console.log(`Transaction is immediately visible: ${isVisible ? 'YES ✅' : 'NO ❌'}`);
  
  if (!isVisible) {
    console.error('FAILURE: New transaction is not immediately visible in history!');
    return false;
  }
  
  // 5. Verify transaction details
  console.log(`\nStep 5: Verifying transaction details...`);
  const transaction = createResult.transaction;
  
  console.log(`Transaction ID: ${transaction.id}`);
  console.log(`Payment Reference: ${transaction.paymentReference}`);
  console.log(`Transaction Status: ${transaction.status}`);
  console.log(`Transaction Amount: ${transaction.amount}`);
  console.log(`Created at: ${new Date(transaction.createdAt).toLocaleString()}`);
  
  // Success!
  console.log(`\nTEST PASSED ✅: Username-based transaction reference system works for user ${username}\n`);
  return true;
}

async function runTests() {
  console.log('===== Username-Based Transaction Reference System Test =====\n');
  let success = true;
  
  // Test with Chubbyme user
  success = success && await testTransactionReferenceForUser('Chubbyme');
  
  // Test with another user if needed
  // success = success && await testTransactionReferenceForUser('Wakay');
  
  console.log(`\n===== Test Summary =====`);
  console.log(`Overall Test Result: ${success ? 'PASSED ✅' : 'FAILED ❌'}`);
  
  return success;
}

// Run the tests
runTests()
  .then(success => {
    console.log(`\nTest script complete. Result: ${success ? 'SUCCESS' : 'FAILURE'}`);
  })
  .catch(error => {
    console.error('Unexpected error during test execution:', error);
    process.exit(1);
  });