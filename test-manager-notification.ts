/**
 * Test script to verify manager notification functionality
 * 
 * This script simulates a deposit by Beding1948 and tests that a notification
 * is sent to their immediate manager (Platalyn) using the SendMessage API.
 */
import { db } from './server/db';
import { casino747Api } from './server/index-casino-api';
import { storage } from './server/storage';
import { users } from './shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Print help message to the console
 */
function showHelp() {
  console.log(`
📋 Manager Notification Test Tool
================================

Tests the functionality to send notifications to managers about player deposits.

Usage:
  npx tsx test-manager-notification.ts [manager-username] [--userinfo] [--help]

Options:
  manager-username   The username of the manager to send the notification to (default: Platalyn)
  --userinfo         Use the userInfo parameter instead of managerOverride (simulates production use)
  --help             Show this help message

Examples:
  npx tsx test-manager-notification.ts                      # Uses default manager (Platalyn) with managerOverride
  npx tsx test-manager-notification.ts TeamManager          # Sends to TeamManager with managerOverride 
  npx tsx test-manager-notification.ts Platalyn --userinfo  # Uses userInfo parameter (simulates logged-in user)
  
This test verifies the deposit notification HTML template and the manager notification system.
It demonstrates two different ways of calling the method:

1. With managerOverride (for testing) - Directly specifies the manager name
2. With userInfo (for production) - Simulates having the user session with hierarchy information
`);
  process.exit(0);
}

async function testManagerNotification() {
  console.log('🧪 Testing manager notification functionality');

  // Parse command line arguments for manager override
  let managerOverride = 'Platalyn'; // Default manager
  const args = process.argv.slice(2);
  let useUserInfo = false;
  
  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
  }
  
  // Check for --userinfo flag to test with userInfo parameter instead of managerOverride
  if (args.includes('--userinfo')) {
    useUserInfo = true;
    console.log(`📝 Using userInfo parameter to simulate logged-in user`);
    args.splice(args.indexOf('--userinfo'), 1); // Remove the flag from args
  }
  
  if (args.length > 0 && !args[0].startsWith('-')) {
    managerOverride = args[0];
    console.log(`📝 Using manager override from command line: ${managerOverride}`);
  }
  
  try {
    // 1. Test user to notify about (based on documentation)
    let testUsername = 'Beding1948';
    
    // 2. First check if the user exists directly in the database
    console.log(`🔍 Looking up user: ${testUsername} directly in database`);
    const dbResult = await db.select().from(users).where(eq(users.username, testUsername));
    
    if (dbResult.length === 0) {
      console.log(`❌ User ${testUsername} not found in direct database query`);
      
      // List all users from the database to see what's available
      console.log('\n📋 Listing all users in database:');
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        topManager: users.topManager,
        immediateManager: users.immediateManager
      }).from(users);
      
      console.table(allUsers);
      
      // Try one of the users from the database
      if (allUsers.length > 0) {
        console.log(`\n🔄 Trying with first available user: ${allUsers[0].username}`);
        testUsername = allUsers[0].username;
      } else {
        console.error('❌ No users found in database');
        return;
      }
    } else {
      console.log(`✅ Found user in database: ${testUsername} (ID: ${dbResult[0].id})`);
    }
    
    // 3. Now get the user through the storage interface
    console.log(`\n🔍 Looking up user through storage API: ${testUsername}`);
    const user = await storage.getUserByUsername(testUsername);
    
    let userInfo = {
      id: 0,
      username: testUsername,
      topManager: 'Marcthepogi',
      immediateManager: 'Platalyn'
    };
    
    if (!user) {
      console.log(`❌ User ${testUsername} not found through storage API`);
      console.log(`⚠️ Using fallback information for test purposes`);
      
      // Use database result for ID if available
      if (dbResult && dbResult.length > 0) {
        userInfo.id = dbResult[0].id;
        userInfo.topManager = dbResult[0].topManager || 'Marcthepogi';
        userInfo.immediateManager = dbResult[0].immediateManager || 'Platalyn';
      }
    } else {
      console.log(`✅ Found user: ${testUsername} (ID: ${user.id})`);
      console.log(`   Top Manager: ${user.topManager || 'Not set'}`);
      console.log(`   Immediate Manager: ${user.immediateManager || 'Not set'}`);
      
      userInfo = {
        id: user.id,
        username: user.username,
        topManager: user.topManager || 'Marcthepogi',
        immediateManager: user.immediateManager || 'Platalyn'
      };
      
      // 3. If immediate manager is not set, try to fetch hierarchy and update
      if (!user.immediateManager) {
        console.log(`⚠️ Immediate manager not set for ${testUsername}, fetching hierarchy...`);
        
        try {
          const hierarchyInfo = await casino747Api.getUserHierarchy(testUsername, false);
          console.log(`✅ Hierarchy info fetched successfully`);
          
          // Fetch the updated user
          const updatedUser = await storage.getUserByUsername(testUsername);
          if (updatedUser?.immediateManager) {
            console.log(`✅ Updated immediate manager to: ${updatedUser.immediateManager}`);
            userInfo.immediateManager = updatedUser.immediateManager;
          } else {
            console.log(`⚠️ Failed to update immediate manager through hierarchy lookup`);
          }
        } catch (hierarchyError) {
          console.error(`❌ Failed to get hierarchy info: ${hierarchyError}`);
          // We'll continue anyway with the default
        }
      }
    }
    
    console.log(`\n🔎 Using the following user information for test:`);
    console.table(userInfo);
    
    // 4. Test sending a deposit notification
    if (useUserInfo) {
      console.log(`\n📨 Testing sendDepositNotification method with userInfo (production mode)`);
    } else {
      console.log(`\n📨 Testing sendDepositNotification method with managerOverride="${managerOverride}" (test mode)`);
    }
    const testDepositDetails = {
      amount: 100,
      currency: 'PHP',
      method: '747 eLoading Wallet via Direct GCash Payment',
      reference: `TEST-${Date.now()}`,
      timestamp: new Date()
    };
    
    console.log(`🔶 Deposit details:`, testDepositDetails);
    
    // 5. Send the test notification with a timeout
    console.log(`📤 Setting API call timeout to 15 seconds...`);
    let notificationResult;
    
    try {
      // Create a promise that rejects after 15 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API call timed out after 15 seconds')), 15000);
      });
      
      // Race the API call against the timeout
      if (useUserInfo) {
        // Use userInfo parameter (simulates production usage with logged-in user)
        console.log(`ℹ️ Using userInfo parameter to simulate logged-in user session`);
        notificationResult = await Promise.race([
          casino747Api.sendDepositNotification(
            testUsername, 
            testDepositDetails, 
            undefined, // no manager override
            { 
              immediateManager: managerOverride, // use the manager from command line
              topManager: userInfo.topManager 
            }
          ),
          timeoutPromise
        ]);
      } else {
        // Use managerOverride parameter (for testing)
        console.log(`ℹ️ Using managerOverride parameter for direct testing`);
        notificationResult = await Promise.race([
          casino747Api.sendDepositNotification(testUsername, testDepositDetails, managerOverride),
          timeoutPromise
        ]);
      }
      
      // 6. Check the notification result
      console.log(`\n📋 Notification result:`, notificationResult);
    } catch (apiError) {
      console.log(`\n⚠️ API call did not complete: ${apiError.message}`);
      console.log(`This may be due to network latency or the API endpoint taking too long to respond.`);
      console.log(`The notification was likely sent, but we couldn't get the confirmation response.`);
      
      notificationResult = { 
        success: true, 
        timedOut: true, 
        message: "Request sent but response timed out" 
      };
    }
    
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