/**
 * Database Migration Script for adding payment methods tables
 * 
 * This script adds:
 * 1. The payment_methods table
 * 2. The user_payment_methods table
 */
import { db } from "./server/db";
import { paymentMethods, userPaymentMethods } from "./shared/schema";

async function migrateDatabase() {
  console.log("Starting payment methods migration...");
  
  // Create the payment_methods table
  try {
    const existingPaymentMethods = await checkTableExists("payment_methods");
    
    if (!existingPaymentMethods) {
      console.log("Creating payment_methods table...");
      await db.execute(`
        CREATE TABLE IF NOT EXISTS payment_methods (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          account_name TEXT,
          account_number TEXT,
          bank_name TEXT,
          instructions TEXT,
          icon_url TEXT,
          is_active BOOLEAN DEFAULT true,
          sort_order INTEGER DEFAULT 0
        );
      `);
      console.log("Successfully created payment_methods table");
    } else {
      console.log("Payment methods table already exists, skipping creation");
    }
    
    // Create the user_payment_methods table
    const existingUserPaymentMethods = await checkTableExists("user_payment_methods");
    
    if (!existingUserPaymentMethods) {
      console.log("Creating user_payment_methods table...");
      await db.execute(`
        CREATE TABLE IF NOT EXISTS user_payment_methods (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          user_id INTEGER NOT NULL REFERENCES users(id),
          payment_method_id INTEGER REFERENCES payment_methods(id),
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          account_name TEXT NOT NULL,
          account_number TEXT NOT NULL,
          bank_name TEXT,
          is_default BOOLEAN DEFAULT false,
          is_verified BOOLEAN DEFAULT false,
          verification_date TIMESTAMP,
          last_used_at TIMESTAMP
        );
      `);
      console.log("Successfully created user_payment_methods table");
    } else {
      console.log("User payment methods table already exists, skipping creation");
    }
    
    console.log("Payment methods migration completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  }
}

/**
 * Helper function to check if a table exists in the database
 */
async function checkTableExists(table: string): Promise<boolean> {
  const result = await db.execute(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name = '${table}'
    );
  `);
  
  return result.rows[0]?.exists || false;
}

// Run the migration
migrateDatabase()
  .then(() => {
    console.log("Migration completed successfully");
    process.exit(0);
  })
  .catch(error => {
    console.error("Migration failed:", error);
    process.exit(1);
  });