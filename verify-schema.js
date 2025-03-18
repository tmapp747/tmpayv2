/**
 * Script to verify changes to the user schema and global constants
 */
const { db } = require('./server/db');
const { TRANSACTION_STATUS, PAYMENT_STATUS, CASINO_STATUS, DEFAULT_TOP_MANAGERS } = require('./server/constants');

async function verifyChanges() {
  console.log('Verifying schema changes and global constants...');
  
  // Check global constants
  console.log('\nChecking global constants:');
  console.log('TRANSACTION_STATUS:', TRANSACTION_STATUS);
  console.log('PAYMENT_STATUS:', PAYMENT_STATUS);
  console.log('CASINO_STATUS:', CASINO_STATUS);
  console.log('DEFAULT_TOP_MANAGERS:', DEFAULT_TOP_MANAGERS);
  
  // Fetch a user to check if schema changes are reflected
  try {
    const users = await db.query.users.findMany({
      limit: 1,
    });
    
    if (users.length > 0) {
      const user = users[0];
      console.log('\nUser schema example:');
      
      // List removed properties that should no longer exist
      const shouldNotExist = [
        'isVip', 
        'vipLevel', 
        'vipSince', 
        'referredBy', 
        'referralCode', 
        'casinoBalance',
        'bypassCasinoAuth',
        'hasAllTokenAccess',
        'hierarchyLevel'
      ];
      
      console.log('\nVerifying removed fields:');
      shouldNotExist.forEach(field => {
        console.log(`- ${field}: ${field in user ? 'Still exists!' : 'Removed successfully'}`);
      });
      
      // List fields that should exist
      const shouldExist = [
        'id',
        'username',
        'email',
        'role',
        'balance',
        'pendingBalance',
        'balances',
        'casinoId',
        'accessToken',
        'refreshToken',
        'allowedTopManagers'
      ];
      
      console.log('\nVerifying existing fields:');
      shouldExist.forEach(field => {
        console.log(`- ${field}: ${field in user ? 'Exists' : 'Missing!'}`);
      });
    } else {
      console.log('No users found in database');
    }
  } catch (error) {
    console.error('Error verifying schema:', error);
  }
  
  process.exit(0);
}

verifyChanges();