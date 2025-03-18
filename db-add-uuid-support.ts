/**
 * Database Migration Script for adding UUID support and admin bypass auth
 * 
 * This script adds:
 * 1. UUID generation support for all tables
 * 2. Admin bypass authentication fields
 * 3. Support for accessing all tokens
 */
import { db } from './server/db';
import { users, transactions, qrPayments, telegramPayments, manualPayments } from './shared/schema';
import { eq, sql } from 'drizzle-orm';

async function migrateDatabase() {
  try {
    console.log('Starting database migration for UUID support and admin bypass...');
    
    // 1. Enable UUID extension if not already enabled
    await enableUuidExtension();
    
    // 2. Add uuid columns to all main tables
    await addUuidColumns();
    
    // 3. Add admin bypass authentication fields
    await addAdminBypassFields();
    
    // 4. Update the admin user to use bypass authentication
    await updateAdminSettings();
    
    console.log('Migration complete!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

async function enableUuidExtension() {
  try {
    console.log('Checking if UUID extension is enabled...');
    
    // Check if extension is already installed
    const extensionCheck = await db.execute(sql`
      SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
    `);
    
    if (extensionCheck.rowCount === 0) {
      console.log('UUID extension not found, installing...');
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
      console.log('UUID extension installed successfully');
    } else {
      console.log('UUID extension already installed');
    }
  } catch (error) {
    console.error('Error enabling UUID extension:', error);
    throw error;
  }
}

async function addUuidColumns() {
  try {
    console.log('Adding UUID columns to tables...');
    
    // Check if the uuid column exists in the users table
    const columnCheck = await db.execute(sql`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'uuid'
    `);
    
    if (columnCheck.rowCount === 0) {
      // Add UUID column to users table
      console.log('Adding UUID column to users table...');
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN uuid UUID DEFAULT uuid_generate_v4() NOT NULL
      `);
      
      // Add UUID column to transactions table
      console.log('Adding UUID column to transactions table...');
      await db.execute(sql`
        ALTER TABLE transactions 
        ADD COLUMN uuid UUID DEFAULT uuid_generate_v4() NOT NULL
      `);
      
      // Add UUID column to qr_payments table
      console.log('Adding UUID column to qr_payments table...');
      await db.execute(sql`
        ALTER TABLE qr_payments 
        ADD COLUMN uuid UUID DEFAULT uuid_generate_v4() NOT NULL
      `);
      
      // Add UUID column to telegram_payments table
      console.log('Adding UUID column to telegram_payments table...');
      await db.execute(sql`
        ALTER TABLE telegram_payments 
        ADD COLUMN uuid UUID DEFAULT uuid_generate_v4() NOT NULL
      `);
      
      // Add UUID column to manual_payments table
      console.log('Adding UUID column to manual_payments table...');
      await db.execute(sql`
        ALTER TABLE manual_payments 
        ADD COLUMN uuid UUID DEFAULT uuid_generate_v4() NOT NULL
      `);
      
      console.log('UUID columns added to all tables successfully');
    } else {
      console.log('UUID columns already exist in tables');
    }
  } catch (error) {
    console.error('Error adding UUID columns:', error);
    throw error;
  }
}

async function addAdminBypassFields() {
  try {
    console.log('Adding admin bypass authentication fields...');
    
    // Check if the bypass_casino_auth column exists in the users table
    const bypassColumnCheck = await db.execute(sql`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'bypass_casino_auth'
    `);
    
    if (bypassColumnCheck.rowCount === 0) {
      // Add bypass_casino_auth column to users table
      console.log('Adding bypass_casino_auth column to users table...');
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN bypass_casino_auth BOOLEAN DEFAULT FALSE NOT NULL
      `);
      
      // Add has_all_token_access column to users table
      console.log('Adding has_all_token_access column to users table...');
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN has_all_token_access BOOLEAN DEFAULT FALSE NOT NULL
      `);
      
      console.log('Admin bypass fields added successfully');
    } else {
      console.log('Admin bypass fields already exist in users table');
    }
  } catch (error) {
    console.error('Error adding admin bypass fields:', error);
    throw error;
  }
}

async function updateAdminSettings() {
  try {
    console.log('Updating admin user settings...');
    
    // Find the admin user
    const adminUsers = await db.select().from(users).where(eq(users.username, 'admin'));
    
    if (adminUsers.length > 0) {
      const adminUser = adminUsers[0];
      console.log(`Found admin user with ID: ${adminUser.id}`);
      
      // Update the admin user to use bypass authentication
      await db.update(users)
        .set({
          bypassCasinoAuth: true,
          hasAllTokenAccess: true,
          topManager: null,
          immediateManager: null,
          casinoUserType: 'SYSTEM',
          isAuthorized: true,
          role: 'admin'
        })
        .where(eq(users.id, adminUser.id));
      
      console.log('Admin user updated to bypass casino authentication');
    } else {
      console.log('Admin user not found');
    }
  } catch (error) {
    console.error('Error updating admin settings:', error);
    throw error;
  }
}

// Run the migration
migrateDatabase().finally(() => {
  console.log('Migration script execution complete');
  process.exit(0);
});