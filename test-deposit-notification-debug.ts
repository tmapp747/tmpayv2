/**
 * Debug script for deposit notification functionality
 * 
 * This script tests the sendDepositNotification method with different
 * data formats to identify where the error occurs
 */

import { casino747Api } from './server/casino747Api-simplified';

async function testDepositNotificationDebugging() {
  console.log('🔍 Starting deposit notification debugging test...');
  
  // Test with very simple data structure first
  // This helps narrow down if it's a data format issue
  const simpleDetails = {
    amount: 100,
    currency: 'PHP',
    method: 'GCash',
    reference: 'TEST-REF-' + Date.now(),
    timestamp: new Date()
  };
  
  const username = 'Athan45';
  const manager = 'platalyn@gmail.com';
  
  console.log('\n📊 Test data:');
  console.log('• Username:', username);
  console.log('• Manager:', manager);
  console.log('• Amount:', simpleDetails.amount, `(${typeof simpleDetails.amount})`);
  console.log('• Currency:', simpleDetails.currency);
  console.log('• Method:', simpleDetails.method);
  console.log('• Reference:', simpleDetails.reference);
  console.log('• Timestamp:', simpleDetails.timestamp, `(${typeof simpleDetails.timestamp})`);
  
  try {
    console.log('\n🧪 Testing notification with manager override (direct approach)...');
    
    // Use a short timeout to prevent test hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API call timed out')), 10000);
    });
    
    const result = await Promise.race([
      casino747Api.sendDepositNotification(
        username,
        simpleDetails,
        manager, // Use manager override approach for simplicity
        undefined
      ),
      timeoutPromise
    ]);
    
    console.log('\n✅ Test completed successfully!');
    console.log('Result:', result);
  } catch (error) {
    console.error('\n❌ Error occurred during test:');
    
    if (error instanceof Error) {
      console.error(`Message: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
      
      // Try to parse more details from the error
      if (error.message.includes('amount')) {
        console.log('\nThe issue appears to be related to the amount field');
      } else if (error.message.includes('timestamp')) {
        console.log('\nThe issue appears to be related to the timestamp field');
      } else if (error.message.includes('toFixed')) {
        console.log('\nThe issue appears to be related to using toFixed() on a non-number');
        console.log('Amount type:', typeof simpleDetails.amount);
      }
      
      // Check type-related issues
      if (error instanceof TypeError) {
        console.log('\nTypeError detected - likely a property access issue or method call error');
      }
    }
  } finally {
    console.log('\n🔚 Debugging test completed');
  }
}

// Run the test
testDepositNotificationDebugging();