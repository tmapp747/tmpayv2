/**
 * Simple test script for Simplified Casino747Api methods
 */

import { casino747Api } from './server/index-casino-api';

async function testApiMethods() {
  try {
    console.log('🧪 Testing Simplified Casino API Methods 🧪');
    
    // Test sendMessage
    console.log('\n📧 Testing sendMessage method...');
    const messageResult = await casino747Api.sendMessage(
      'Athan45', 
      'Test Message', 
      'This is a test message from simplified API'
    );
    console.log('Send message result:', messageResult);
    
    // Test sendDepositNotification
    console.log('\n📬 Testing sendDepositNotification method...');
    const notificationResult = await casino747Api.sendDepositNotification(
      'Athan45',
      {
        amount: 100,
        currency: 'PHP',
        method: 'GCash',
        reference: `TEST-${Date.now()}`,
        timestamp: new Date()
      }
    );
    console.log('Notification result:', notificationResult);
    
    // Test withdrawFunds
    console.log('\n💸 Testing withdrawFunds method...');
    const withdrawalResult = await casino747Api.withdrawFunds(
      100,
      535901599,
      'Athan45',
      `TEST-WD-${Date.now()}`
    );
    console.log('Withdrawal result:', withdrawalResult);
    
    // Test getTransactionHistory
    console.log('\n📊 Testing getTransactionHistory method...');
    const historyResult = await casino747Api.getTransactionHistory('Athan45', 'PHP');
    console.log('Transaction history result:', historyResult);
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the tests
testApiMethods();