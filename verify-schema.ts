/**
 * Script to verify schema changes to users table
 */
import { db } from './server/db';
import { users } from './shared/schema';
import { eq } from 'drizzle-orm';

async function verifySchema() {
  try {
    // Get any user from the database
    const results = await db.select().from(users).limit(1);
    
    if (results.length === 0) {
      console.log('No users found in the database');
      return;
    }
    
    const user = results[0];
    console.log('User object:', user);

    // Check for removed fields
    const removedFields = [
      'isVip', 'vipLevel', 'vipSince', 'referredBy', 'referralCode', 
      'casinoBalance', 'bypassCasinoAuth', 'hasAllTokenAccess', 'hierarchyLevel'
    ];
    
    console.log('\nVerifying removed fields:');
    removedFields.forEach(field => {
      console.log(`- ${field}: ${field in user ? 'Still exists!' : 'Removed successfully'}`);
    });
    
    // Check for existing fields
    const requiredFields = [
      'id', 'uuid', 'username', 'password', 'email', 'role', 'status',
      'balance', 'pendingBalance', 'balances', 'casinoId', 'casinoUsername',
      'accessToken', 'refreshToken', 'allowedTopManagers'
    ];
    
    console.log('\nVerifying required fields:');
    requiredFields.forEach(field => {
      console.log(`- ${field}: ${field in user ? 'Exists' : 'Missing!'}`);
    });
    
  } catch (error) {
    console.error('Error verifying schema:', error);
  }
}

verifySchema();