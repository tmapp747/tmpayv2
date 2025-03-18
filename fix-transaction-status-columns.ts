/**
 * Migration script to add gcash_status and casino_status columns to the transactions table
 * This addresses the "column gcash_status does not exist" error
 */

import { db } from './server/db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

async function migrateDatabaseColumns() {
  console.log('Starting migration to add transaction status columns...');
  
  try {
    // Check if gcash_status column exists
    const checkGcashStatusResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      AND column_name = 'gcash_status'
    `);
    
    const hasGcashStatus = checkGcashStatusResult.length > 0;
    
    // Check if casino_status column exists
    const checkCasinoStatusResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      AND column_name = 'casino_status'
    `);
    
    const hasCasinoStatus = checkCasinoStatusResult.length > 0;
    
    // Add gcash_status column if it doesn't exist
    if (!hasGcashStatus) {
      console.log('Adding gcash_status column to transactions table...');
      await db.execute(sql`
        ALTER TABLE transactions
        ADD COLUMN gcash_status TEXT DEFAULT 'processing'
      `);
      console.log('gcash_status column added successfully');
    } else {
      console.log('gcash_status column already exists');
    }
    
    // Add casino_status column if it doesn't exist
    if (!hasCasinoStatus) {
      console.log('Adding casino_status column to transactions table...');
      await db.execute(sql`
        ALTER TABLE transactions
        ADD COLUMN casino_status TEXT DEFAULT 'pending'
      `);
      console.log('casino_status column added successfully');
    } else {
      console.log('casino_status column already exists');
    }
    
    // Update existing transactions to have the proper status values
    // Only update if the columns were newly added
    if (!hasGcashStatus || !hasCasinoStatus) {
      console.log('Updating existing transactions with default status values...');
      await db.execute(sql`
        UPDATE transactions 
        SET 
          gcash_status = CASE 
            WHEN status = 'completed' THEN 'completed'
            WHEN status = 'failed' THEN 'failed'
            ELSE 'processing'
          END,
          casino_status = CASE 
            WHEN status = 'completed' THEN 'completed'
            WHEN status = 'failed' THEN 'failed'
            ELSE 'pending'
          END
        WHERE gcash_status IS NULL OR casino_status IS NULL
      `);
      console.log('Existing transactions updated successfully');
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Execute the migration
migrateDatabaseColumns()
  .then(() => {
    console.log('Migration script completed. You can now restart the application.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });