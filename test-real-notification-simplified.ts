/**
 * Simplified test for real transaction notification
 * 
 * This test uses the actual transaction data but simplifies the approach
 * to isolate the issue with the notification system
 */

import { casino747Api } from './server/casino747Api-simplified';
import { db } from './server/db';
import { transactions, users } from './shared/schema';
import { eq, desc } from 'drizzle-orm';

async function testSimplifiedRealNotification() {
  console.log('🧪 Testing simplified real transaction notification');
  console.log('==================================================');
  
  try {
    // 1. Get a recent completed transaction directly from the database
    console.log('📊 Fetching the most recent successful transaction...');
    const recentTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.status, 'completed'))
      .orderBy(desc(transactions.createdAt))
      .limit(5);
    
    if (!recentTransactions || recentTransactions.length === 0) {
      console.error('❌ No completed transactions found in database');
      return;
    }
    
    // Use the first transaction
    const transaction = recentTransactions[0];
    console.log(`📝 Using transaction #${transaction.id} for testing`);
    console.log('Transaction structure:', JSON.stringify(transaction, null, 2));
    
    // 2. Get user info
    console.log(`Looking up user with ID ${transaction.userId}...`);
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, transaction.userId))
      .limit(1);
    
    if (!userResult || userResult.length === 0) {
      console.error(`❌ User with ID ${transaction.userId} not found`);
      return;
    }
    
    const user = userResult[0];
    console.log(`📝 Transaction made by user: ${user.username} (ID: ${user.id})`);
    console.log('User structure:', JSON.stringify(user, null, 2));
    
    // 3. Prepare simple deposit details (ensuring correct data types)
    console.log('\n📤 Creating simplified deposit details...');
    
    // Parse the amount to ensure it's a number
    const amount = parseFloat(transaction.amount);
    console.log(`Amount: ${amount} (${typeof amount})`);
    
    // Create a proper Date object
    const timestamp = new Date();
    if (transaction.createdAt) {
      console.log(`Timestamp from DB: ${transaction.createdAt}`);
    } else {
      console.log('No timestamp found in transaction, using current time');
    }
    console.log(`Using timestamp: ${timestamp} (${typeof timestamp})`);
    
    // Determine payment method using method field (as per schema)
    const paymentMethod = transaction.method || 'gcash';
    console.log(`Payment method: ${paymentMethod}`);
    
    // We don't have reference in the standard schema, so generate one
    const reference = `tx-${transaction.id}-${Date.now()}`;
    console.log(`Reference: ${reference}`);
    
    // Create a simplified deposit details object with the correct types
    const depositDetails = {
      amount: amount,
      currency: 'PHP',
      method: paymentMethod === 'manual' ? 'Manual Bank Transfer' : 'GCash Payment',
      reference: reference,
      timestamp: timestamp
    };
    
    console.log('Deposit details:', depositDetails);
    
    // Use the manager override approach for simplicity
    const manager = user.immediateManager || 'platalyn@gmail.com';
    console.log(`Using manager override: ${manager}`);
    
    // 4. Send notification with a timeout
    console.log('\n📧 Sending notification...');
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API call timed out after 10 seconds')), 10000);
    });
    
    try {
      const result = await Promise.race([
        casino747Api.sendDepositNotification(
          user.username,
          depositDetails,
          manager,  // Use manager override approach
          undefined // No userInfo needed when using override
        ),
        timeoutPromise
      ]);
      
      console.log('\n✅ Notification sent successfully!');
      console.log('Result:', result);
    } catch (error) {
      console.error('\n❌ Error sending notification:');
      
      if (error instanceof Error) {
        console.error(`Message: ${error.message}`);
        console.error(`Stack: ${error.stack}`);
      } else {
        console.error('Unknown error:', error);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  } finally {
    console.log('\n🔚 Test completed');
  }
}

// Run the test
testSimplifiedRealNotification();