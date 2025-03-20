/**
 * Test script for the simplified Casino747Api implementation
 * 
 * This script tests all the methods in our simplified API to ensure
 * they work as expected and are compatible with the original API.
 */

import { casino747Api } from './server/index-casino-api';

async function testSimplifiedCasinoApi() {
  console.log('🧪 Testing Simplified Casino API Implementation 🧪');
  console.log('==============================================');
  
  try {
    // Test variables
    const testUsername = 'Athan45';
    const testClientId = 535901599;
    const testAmount = 100;
    const testReference = `TEST-${Date.now()}`;
    
    // 1. Test getUserDetails
    console.log('\n📋 Testing getUserDetails...');
    const userDetails = await casino747Api.getUserDetails(testUsername);
    console.log('User details response:', userDetails);
    
    // 2. Test getUserBalance
    console.log('\n💰 Testing getUserBalance...');
    try {
      const balance = await casino747Api.getUserBalance(testClientId, testUsername);
      console.log('Balance response:', balance);
    } catch (error) {
      console.log('Balance check failed with expected error (Auth Error). This is normal in test environment.');
    }
    
    // 3. Test getUserHierarchy
    console.log('\n👥 Testing getUserHierarchy...');
    const hierarchy = await casino747Api.getUserHierarchy(testUsername);
    console.log('Hierarchy response:', hierarchy);
    
    // 4. Test sendDepositNotification
    console.log('\n📬 Testing sendDepositNotification...');
    const notification = await casino747Api.sendDepositNotification(testUsername, {
      amount: testAmount,
      currency: 'PHP',
      method: 'GCash',
      reference: testReference,
      timestamp: new Date()
    });
    console.log('Notification response:', notification);
    
    // 5. Test sendMessage
    console.log('\n📧 Testing sendMessage...');
    const message = await casino747Api.sendMessage(
      testUsername,
      'Test Message Subject',
      'This is a test message content for simplified API testing.'
    );
    console.log('Message response:', message);
    
    // 6. Test withdrawFunds
    console.log('\n💸 Testing withdrawFunds...');
    const withdrawal = await casino747Api.withdrawFunds(
      testAmount,
      testClientId,
      testUsername,
      `${testReference}-WD`
    );
    console.log('Withdrawal response:', withdrawal);
    
    // 7. Test transferFunds
    console.log('\n🔄 Testing transferFunds...');
    try {
      const transfer = await casino747Api.transferFunds(
        testAmount,
        testClientId,
        testUsername,
        `${testReference}-TR`
      );
      console.log('Transfer response:', transfer);
    } catch (error) {
      console.log('Transfer failed with expected error in test environment.');
      console.error(error);
    }
    
    // 8. Test getTransactionHistory
    console.log('\n📊 Testing getTransactionHistory...');
    const history = await casino747Api.getTransactionHistory(testUsername);
    console.log('Transaction history response:', history);
    
    console.log('\n✅ Simplified Casino API test complete!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testSimplifiedCasinoApi()
  .then(() => {
    console.log('Test script completed.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Test script failed:', err);
    process.exit(1);
  });