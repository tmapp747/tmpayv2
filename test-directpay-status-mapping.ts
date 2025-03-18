/**
 * Test script to verify that the DirectPay API status mapping is working correctly
 * 
 * This script tests whether our status mapping functions properly handle various
 * case variations of status values that might come from the DirectPay API.
 */

import { mapDirectPayStatusToGcashStatus } from './shared/api-mapping';

// Define a function to test the status mapping
function testStatusMapping() {
  // Array of test cases: [input, expectedOutput]
  const testCases = [
    // Lowercase test cases
    ['pending', 'processing'],
    ['processing', 'processing'],
    ['success', 'completed'],
    ['paid', 'completed'],
    ['failed', 'failed'],
    ['expired', 'failed'],
    ['cancelled', 'failed'],
    
    // Uppercase test cases
    ['PENDING', 'processing'],
    ['PROCESSING', 'processing'],
    ['SUCCESS', 'completed'],
    ['PAID', 'completed'],
    ['FAILED', 'failed'],
    ['EXPIRED', 'failed'],
    ['CANCELLED', 'failed'],
    
    // Mixed case test cases
    ['Pending', 'processing'],
    ['Processing', 'processing'],
    ['Success', 'completed'],
    ['Paid', 'completed'],
    ['Failed', 'failed'],
    ['Expired', 'failed'],
    ['Cancelled', 'failed'],
    
    // Edge cases and partial matches
    ['PAYMENT_COMPLETE', 'completed'],
    ['PAYMENT_FAILED', 'failed'],
    ['WAITING_PAYMENT', 'processing'],
    ['PARTIALLY_PAID', 'completed'],
    ['DECLINED', 'failed'],
    ['', 'processing'],  // Empty status
    [null, 'processing'], // Null status
    [undefined, 'processing'], // Undefined status
  ];
  
  // Run each test case
  let passedTests = 0;
  let failedTests = 0;
  
  testCases.forEach(([input, expected], index) => {
    const actual = mapDirectPayStatusToGcashStatus(input as string);
    
    if (actual === expected) {
      console.log(`✅ Test ${index + 1} passed: "${input}" -> "${actual}"`);
      passedTests++;
    } else {
      console.error(`❌ Test ${index + 1} failed: "${input}" -> "${actual}" (expected "${expected}")`);
      failedTests++;
    }
  });
  
  // Report summary
  console.log(`\nTest Summary:`);
  console.log(`Total tests: ${testCases.length}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  
  if (failedTests === 0) {
    console.log(`\n✅ All tests passed! The status mapping is working correctly.`);
  } else {
    console.error(`\n❌ ${failedTests} tests failed. Please fix the mapping function.`);
  }
}

// Run the tests
testStatusMapping();