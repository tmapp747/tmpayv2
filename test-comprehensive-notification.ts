/**
 * Comprehensive test for the deposit notification system
 * 
 * This test provides a unified approach to testing notifications:
 * 1. Using test data (for quick verification)
 * 2. Using real transaction data from the database
 * 3. Proper error handling and diagnostics
 */

import { casino747Api } from './server/casino747Api-simplified';
import { db } from './server/db';
import { transactions, users } from './shared/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Print usage information
 */
function showHelp() {
  console.log(`
Usage: 
  npx tsx test-comprehensive-notification.ts [mode] [options]

Modes:
  test      Test with sample data (default)
  real      Test with real transaction from database
  
Options:
  --username=USERNAME   Specify a username for test mode
  --amount=AMOUNT       Specify an amount for test mode
  --manager=MANAGER     Specify a manager email/username for override
  --reference=REF       Specify a transaction reference for test mode
  --help                Show this help message
  
Examples:
  npx tsx test-comprehensive-notification.ts
  npx tsx test-comprehensive-notification.ts test --username=Athan45 --amount=150
  npx tsx test-comprehensive-notification.ts real
  npx tsx test-comprehensive-notification.ts real --manager=platalyn@gmail.com
`);
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options: any = {
    mode: 'test',
    username: 'Athan45',
    amount: 100,
    manager: null,
    reference: null
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg === 'test' || arg === 'real') {
      options.mode = arg;
    } else if (arg.startsWith('--username=')) {
      options.username = arg.split('=')[1];
    } else if (arg.startsWith('--amount=')) {
      options.amount = parseFloat(arg.split('=')[1]);
    } else if (arg.startsWith('--manager=')) {
      options.manager = arg.split('=')[1];
    } else if (arg.startsWith('--reference=')) {
      options.reference = arg.split('=')[1];
    }
  }

  return options;
}

/**
 * Run the notification test with sample data
 */
async function testWithSampleData(options: any) {
  console.log('🧪 Testing notification with sample data');
  console.log('=========================================');
  
  try {
    const username = options.username;
    const amount = options.amount;
    const manager = options.manager || 'platalyn@gmail.com';
    const reference = options.reference || `TEST-REF-${Date.now()}`;
    
    console.log(`📝 Using test data:`);
    console.log(`• Username: ${username}`);
    console.log(`• Amount: ${amount}`);
    console.log(`• Manager: ${manager}`);
    console.log(`• Reference: ${reference}`);
    
    // Create deposit details object
    const depositDetails = {
      amount: amount,
      currency: 'PHP',
      method: 'GCash Payment',
      reference: reference,
      timestamp: new Date()
    };
    
    console.log('\n📧 Sending notification...');
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API call timed out after 10 seconds')), 10000);
    });
    
    try {
      const result = await Promise.race([
        casino747Api.sendDepositNotification(
          username,
          depositDetails,
          manager
        ),
        timeoutPromise
      ]);
      
      console.log('\n✅ Notification sent successfully!');
      console.log('Result:', result);
      return true;
    } catch (error) {
      console.error('\n❌ Error sending notification:');
      
      if (error instanceof Error) {
        console.error(`Message: ${error.message}`);
        console.error(`Stack: ${error.stack}`);
      } else {
        console.error('Unknown error:', error);
      }
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error);
    return false;
  }
}

/**
 * Run the notification test with real transaction data
 */
async function testWithRealData(options: any) {
  console.log('🧪 Testing notification with real transaction data');
  console.log('================================================');
  
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
      return false;
    }
    
    // Use the first transaction
    const transaction = recentTransactions[0];
    console.log(`📝 Using transaction #${transaction.id}`);
    console.log('Transaction details:');
    console.log(`• Type: ${transaction.type}`);
    console.log(`• Method: ${transaction.method}`);
    console.log(`• Amount: ${transaction.amount}`);
    console.log(`• Status: ${transaction.status}`);
    console.log(`• Created: ${transaction.createdAt}`);
    
    // 2. Get user info
    console.log(`\n👤 Looking up user with ID ${transaction.userId}...`);
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, transaction.userId))
      .limit(1);
    
    if (!userResult || userResult.length === 0) {
      console.error(`❌ User with ID ${transaction.userId} not found`);
      return false;
    }
    
    const user = userResult[0];
    console.log(`Found user: ${user.username} (ID: ${user.id})`);
    console.log(`• Casino username: ${user.casinoUsername}`);
    console.log(`• Top manager: ${user.topManager}`);
    console.log(`• Immediate manager: ${user.immediateManager}`);
    
    // 3. Prepare deposit details (ensuring correct data types)
    console.log('\n📤 Creating deposit notification details...');
    
    // Parse the amount to ensure it's a number
    const amount = parseFloat(transaction.amount);
    
    // Create a proper Date object for timestamp
    const timestamp = transaction.createdAt ? new Date(transaction.createdAt) : new Date();
    
    // Determine reference
    const reference = transaction.paymentReference 
      ? transaction.paymentReference 
      : `tx-${transaction.id}-${Date.now()}`;
    
    // Create notification details
    const depositDetails = {
      amount: amount,
      currency: 'PHP',
      method: transaction.method === 'manual' ? 'Manual Bank Transfer' : 'GCash Payment',
      reference: reference,
      timestamp: timestamp
    };
    
    console.log('Deposit details:', depositDetails);
    
    // Use manager override if provided, otherwise use user's immediate manager
    const manager = options.manager || user.immediateManager || 'platalyn@gmail.com';
    console.log(`Using manager: ${manager}`);
    
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
          manager
        ),
        timeoutPromise
      ]);
      
      console.log('\n✅ Notification sent successfully!');
      console.log('Result:', result);
      return true;
    } catch (error) {
      console.error('\n❌ Error sending notification:');
      
      if (error instanceof Error) {
        console.error(`Message: ${error.message}`);
        console.error(`Stack: ${error.stack}`);
      } else {
        console.error('Unknown error:', error);
      }
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error);
    return false;
  }
}

/**
 * Main function to run the test based on command-line arguments
 */
async function main() {
  const options = parseArgs();
  console.log(`🚀 Running deposit notification test in ${options.mode} mode\n`);
  
  let success = false;
  
  if (options.mode === 'test') {
    success = await testWithSampleData(options);
  } else if (options.mode === 'real') {
    success = await testWithRealData(options);
  } else {
    console.error(`Unknown mode: ${options.mode}`);
    showHelp();
    process.exit(1);
  }
  
  console.log('\n🏁 Test completed');
  console.log(`📝 Result: ${success ? '✅ Success' : '❌ Failed'}`);
  
  process.exit(success ? 0 : 1);
}

// Run the test
main().catch(console.error);