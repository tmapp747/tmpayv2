/**
 * Script to verify changes to the user schema and global constants
 * Using ES modules format (.mjs extension)
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './shared/schema.js';
import { TRANSACTION_STATUS, PAYMENT_STATUS, CASINO_STATUS, DEFAULT_TOP_MANAGERS } from './server/constants.js';

async function verifyChanges() {
  console.log('Verifying schema changes and global constants...');
  
  // Check global constants
  console.log('\nChecking global constants:');
  console.log('TRANSACTION_STATUS:', TRANSACTION_STATUS);
  console.log('PAYMENT_STATUS:', PAYMENT_STATUS);
  console.log('CASINO_STATUS:', CASINO_STATUS);
  console.log('DEFAULT_TOP_MANAGERS:', DEFAULT_TOP_MANAGERS);

  // Connect to database
  try {
    const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';
    const client = postgres(connectionString);
    const db = drizzle(client, { schema });
    
    // Query to get a sample user
    const users = await db.query.users.findMany({
      limit: 1,
    });

    if (users.length > 0) {
      // Print user structure 
      const user = users[0];
      console.log('\nUser schema fields present in database:');
      for (const field in user) {
        console.log(`- ${field}: ${typeof user[field]}`);
      }
      
      // Verify that removed fields are not present
      console.log('\nVerifying removed fields:');
      const removedFields = ['isVip', 'vipLevel', 'vipSince', 'referredBy', 'referralCode', 
        'casinoBalance', 'bypassCasinoAuth', 'hasAllTokenAccess', 'hierarchyLevel'];
      
      for (const field of removedFields) {
        console.log(`- ${field}: ${field in user ? 'Still present!' : 'Successfully removed'}`);
      }
    } else {
      console.log('No users found in database');
    }
    
    // Clean up
    await client.end();
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
}

verifyChanges();