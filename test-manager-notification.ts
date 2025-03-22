/**
 * Test script to verify manager notification functionality
 * 
 * This script simulates a deposit by Beding1948 and tests that a notification
 * is sent to their immediate manager (Platalyn) using the SendMessage API.
 */
import { db } from './server/db';
import { casino747Api } from './server/index-casino-api';
import { storage } from './server/storage';

async function testManagerNotification() {
  console.log('🧪 Testing manager notification functionality');
  
  try {
    // 1. Test user to notify about (based on documentation)
    // We'll try both "Beding1948" and "beding1948" to check for case sensitivity issues
    const username = 'beding1948'; // Try lowercase version
    
    // 2. Get user info from the database
    console.log(`🔍 Looking up user: ${username}`);
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      console.error(`❌ User ${username} not found in database`);
      return;
    }
    
    console.log(`✅ Found user: ${username} (ID: ${user.id})`);
    console.log(`   Top Manager: ${user.topManager || 'Not set'}`);
    console.log(`   Immediate Manager: ${user.immediateManager || 'Not set'}`);
    
    // 3. If immediate manager is not set, try to fetch hierarchy and update
    if (!user.immediateManager) {
      console.log(`⚠️ Immediate manager not set for ${username}, fetching hierarchy...`);
      
      try {
        const hierarchyInfo = await casino747Api.getUserHierarchy(username, false);
        console.log(`✅ Hierarchy info fetched successfully`);
        
        // Fetch the updated user
        const updatedUser = await storage.getUserByUsername(username);
        if (updatedUser?.immediateManager) {
          console.log(`✅ Updated immediate manager to: ${updatedUser.immediateManager}`);
        } else {
          console.log(`⚠️ Failed to update immediate manager through hierarchy lookup`);
        }
      } catch (hierarchyError) {
        console.error(`❌ Failed to get hierarchy info: ${hierarchyError}`);
        // We'll continue anyway to test the fallback behavior
      }
    }
    
    // 4. Test sending a deposit notification
    console.log('\n📨 Testing sendDepositNotification method');
    const testDepositDetails = {
      amount: 100,
      currency: 'PHP',
      method: '747 eLoading Wallet via Direct GCash Payment',
      reference: `TEST-${Date.now()}`,
      timestamp: new Date()
    };
    
    console.log(`🔶 Deposit details:`, testDepositDetails);
    
    // 5. Send the test notification
    const notificationResult = await casino747Api.sendDepositNotification(
      username, 
      testDepositDetails
    );
    
    // 6. Check the notification result
    console.log(`\n📋 Notification result:`, notificationResult);
    
    if (notificationResult && notificationResult.success) {
      console.log(`✅ TEST PASSED: Notification sent successfully!`);
      if (notificationResult.delivered) {
        console.log(`✅ Message was delivered to manager`);
      } else {
        console.log(`⚠️ Message was not delivered (${notificationResult.message})`);
      }
    } else {
      console.error(`❌ TEST FAILED: Notification could not be sent`);
      console.error(`   Reason: ${notificationResult?.message || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error(`❌ Error during test:`, error);
  } finally {
    // Clean up and exit
    console.log('\n🔚 Test completed');
    process.exit(0);
  }
}

// Execute the test
testManagerNotification();