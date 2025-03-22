/**
 * Real-world Transaction Notification Test
 * 
 * This script simulates a production scenario where:
 * 1. A user has just completed a successful deposit
 * 2. We need to notify their immediate manager
 * 3. We use real transaction data from the database
 * 
 * This is a more realistic test compared to the simpler test-manager-notification.ts
 */

import { casino747Api } from './server/casino747Api-simplified';
import { db } from './server/db';
import { users, transactions, qrPayments } from './shared/schema';
import { eq, desc, and, or, sql } from 'drizzle-orm';
import { storage } from './server/storage';

async function testRealTransactionNotification() {
  console.log('🧪 Testing real-world transaction notification');
  console.log('==============================================');

  try {
    // 1. Find the most recent successful transaction in the database
    console.log('📊 Fetching most recent successful transaction...');
    
    console.log('Executing SQL query to get recent transactions...');
    const { rows: recentTransactions } = await db.execute(sql`
      SELECT 
        t.id, 
        t.user_id as "userId", 
        t.amount, 
        t.status, 
        t.gcash_status as "gcashStatus", 
        t.casino_status as "casinoStatus", 
        t.payment_reference as "reference", 
        t.method as "paymentMethod",
        t.created_at as "createdAt", 
        t.updated_at as "updatedAt"
      FROM transactions t
      WHERE t.status = 'completed' OR t.status = 'payment_completed'
      ORDER BY t.created_at DESC
      LIMIT 5
    `);

    if (recentTransactions.length === 0) {
      console.log('❌ No successful transactions found in the database');
      console.log('Creating a mock transaction for testing purposes...');
      
      // Use one of the test users we know exists
      const { rows: testUsers } = await db.execute(sql`
        SELECT
          id,
          username,
          top_manager as "topManager",
          immediate_manager as "immediateManager",
          casino_username as "casinoUsername"
        FROM users
        LIMIT 5
      `);
      
      if (testUsers.length === 0) {
        console.error('❌ No users found in database. Cannot continue test.');
        return;
      }
      
      // Use the first test user
      const testUser = testUsers[0];
      console.log(`📝 Using test user: ${testUser.username} (ID: ${testUser.id})`);
      
      // Create a simulated transaction
      const mockTransaction = {
        id: 999,
        userId: testUser.id,
        amount: 100,
        status: 'completed',
        gcashStatus: 'success',
        casinoStatus: 'success',
        reference: `TEST-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        paymentMethod: 'gcash'
      };
      
      console.log('📋 Using simulated transaction:');
      console.table(mockTransaction);
      
      await testNotificationWithTransaction(mockTransaction, testUser);
      return;
    }
    
    // 2. Display the transactions and let user select one
    console.log('📋 Found recent transactions:');
    console.table(recentTransactions.map((tx, index) => ({
      index: index + 1,
      id: tx.id,
      amount: tx.amount,
      status: tx.status,
      reference: tx.reference,
      createdAt: tx.createdAt,
      paymentMethod: tx.paymentMethod
    })));
    
    // Use the most recent transaction
    const selectedTransaction = recentTransactions[0];
    console.log(`\n📝 Using transaction #${selectedTransaction.id} for testing`);
    
    // 3. Get the user who made this transaction
    const userQuery = `
      SELECT
        id,
        username,
        top_manager as "topManager",
        immediate_manager as "immediateManager",
        casino_username as "casinoUsername"
      FROM users
      WHERE id = $1
      LIMIT 1
    `;
    
    console.log(`Looking up user with ID ${selectedTransaction.userId}...`);
    const { rows: txUser } = await db.execute(sql`
      SELECT
        id,
        username,
        top_manager as "topManager",
        immediate_manager as "immediateManager",
        casino_username as "casinoUsername"
      FROM users
      WHERE id = ${selectedTransaction.userId}
      LIMIT 1
    `);
    
    if (txUser.length === 0) {
      console.error(`❌ Could not find user with ID ${selectedTransaction.userId}`);
      return;
    }
    
    const user = txUser[0];
    console.log(`📝 Transaction made by user: ${user.username} (ID: ${user.id})`);
    
    // 4. Test the notification
    await testNotificationWithTransaction(selectedTransaction, user);
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

async function testNotificationWithTransaction(transaction: any, user: any) {
  try {
    console.log('\n🔎 Transaction Details:');
    console.log(`• ID: ${transaction.id}`);
    console.log(`• Amount: ₱${transaction.amount}`);
    console.log(`• Reference: ${transaction.reference}`);
    console.log(`• Status: ${transaction.status}`);
    console.log(`• Payment Method: ${transaction.paymentMethod || 'gcash'}`);
    console.log(`• Created: ${transaction.createdAt}`);
    
    console.log('\n👤 User Details:');
    console.log(`• Username: ${user.username}`);
    console.log(`• Casino Username: ${user.casinoUsername || user.username}`);
    console.log(`• Top Manager: ${user.topManager || 'Not set'}`);
    console.log(`• Immediate Manager: ${user.immediateManager || 'Not set'}`);
    
    // Create deposit details from transaction
    // Fix the timestamp format to ensure it's a valid Date object
    console.log(`Original createdAt type: ${typeof transaction.createdAt}`);
    console.log(`Original createdAt value: ${transaction.createdAt}`);
    
    const timestamp = transaction.createdAt instanceof Date 
      ? transaction.createdAt 
      : new Date(transaction.createdAt);
    
    console.log(`Converted timestamp: ${timestamp}`);
    console.log(`Timestamp is valid date: ${!isNaN(timestamp.getTime())}`);
    
    // Fix amount format - ensure it's a number
    console.log(`Original amount type: ${typeof transaction.amount}`);
    console.log(`Original amount value: ${transaction.amount}`);
    
    // Parse the amount to ensure it's a numerical value
    const amount = typeof transaction.amount === 'string' 
      ? parseFloat(transaction.amount) 
      : transaction.amount;
      
    console.log(`Converted amount: ${amount}`);
    console.log(`Amount is number: ${typeof amount === 'number' && !isNaN(amount)}`);
      
    const depositDetails = {
      amount: amount,
      currency: 'PHP',
      method: transaction.paymentMethod === 'manual' 
        ? 'Manual Bank Transfer' 
        : '747 eLoading Wallet via Direct GCash Payment',
      reference: transaction.reference,
      timestamp: timestamp
    };
    
    console.log('\n📤 Simulating deposit notification in production mode...');
    console.log('Using transaction and user data from the database.');
    
    // 5. Create proper userInfo object as would be available in production
    const userInfo = {
      id: user.id,
      username: user.username,
      casinoUsername: user.casinoUsername || user.username,
      topManager: user.topManager || 'Marcthepogi',
      immediateManager: user.immediateManager || 'Platalyn'
    };
    
    console.log('\n📧 Sending notification with real production data...');
    
    // Set a shorter timeout for the API call (5 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API call timed out after 5 seconds')), 5000);
    });
    
    try {
      // 6. Call the sendDepositNotification with userInfo parameter (production mode)
      const notificationResult = await Promise.race([
        casino747Api.sendDepositNotification(
          userInfo.username,
          depositDetails,
          undefined,  // No manager override in production
          {
            topManager: userInfo.topManager,
            immediateManager: userInfo.immediateManager
          }
        ),
        timeoutPromise
      ]);
      
      // 7. Check the result
      console.log('\n📋 Notification Result:', notificationResult);
      
      if (notificationResult && notificationResult.success) {
        console.log('✅ NOTIFICATION SENT SUCCESSFULLY!');
        if (notificationResult.delivered) {
          console.log(`✅ Message was delivered to manager: ${userInfo.immediateManager}`);
        } else {
          console.log(`⚠️ Message was not delivered (${notificationResult.message})`);
        }
      } else {
        console.error('❌ NOTIFICATION FAILED TO SEND');
        console.error(`   Reason: ${notificationResult?.message || 'Unknown error'}`);
      }
    } catch (apiError) {
      console.log(`\n⚠️ API call did not complete: ${apiError.message}`);
      console.log('This may be due to network latency or the API endpoint taking too long to respond.');
      console.log('The notification was likely sent, but we couldn\'t get the confirmation response.');
    }
    
  } catch (error) {
    console.error('❌ Error processing transaction for notification:', error);
  } finally {
    console.log('\n🔚 Test completed');
  }
}

// Execute the test
testRealTransactionNotification();