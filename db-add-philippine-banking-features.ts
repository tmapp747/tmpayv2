/**
 * Database Migration Script for enhancing banking features with Philippine-specific options
 * 
 * This script adds:
 * 1. Support for InstaPay and PESONet in payment method types
 * 2. Enhanced fields for e-wallet providers
 * 3. Support for remittance services common in the Philippines
 * 4. Additional verification and security features
 */
import { db } from "./server/db";
import { userPaymentMethods } from "./shared/schema";
import { sql } from "drizzle-orm";

async function migrateDatabase() {
  console.log("Starting migration for Philippine banking features...");
  
  try {
    // First check if the new columns already exist to avoid errors
    if (!await checkColumnExists("user_payment_methods", "instapay_enabled")) {
      console.log("Adding InstaPay support columns...");
      await db.execute(sql`
        ALTER TABLE user_payment_methods 
        ADD COLUMN instapay_enabled BOOLEAN DEFAULT false,
        ADD COLUMN pesonet_enabled BOOLEAN DEFAULT false,
        ADD COLUMN qr_ph_enabled BOOLEAN DEFAULT false
      `);
    }

    if (!await checkColumnExists("user_payment_methods", "daily_transfer_limit")) {
      console.log("Adding transaction limit columns...");
      await db.execute(sql`
        ALTER TABLE user_payment_methods 
        ADD COLUMN daily_transfer_limit NUMERIC(10,2),
        ADD COLUMN per_transaction_limit NUMERIC(10,2)
      `);
    }

    if (!await checkColumnExists("user_payment_methods", "verification_method")) {
      console.log("Adding verification fields...");
      await db.execute(sql`
        ALTER TABLE user_payment_methods 
        ADD COLUMN verification_method TEXT,
        ADD COLUMN verification_status TEXT DEFAULT 'pending',
        ADD COLUMN verification_date TIMESTAMP,
        ADD COLUMN verification_data JSONB DEFAULT '{}'::jsonb
      `);
    }

    if (!await checkColumnExists("user_payment_methods", "remittance_provider")) {
      console.log("Adding remittance service fields...");
      await db.execute(sql`
        ALTER TABLE user_payment_methods 
        ADD COLUMN remittance_provider TEXT,
        ADD COLUMN remittance_phone_number TEXT,
        ADD COLUMN remittance_pin TEXT
      `);
    }

    if (!await checkColumnExists("user_payment_methods", "e_wallet_provider")) {
      console.log("Adding enhanced e-wallet fields...");
      await db.execute(sql`
        ALTER TABLE user_payment_methods 
        ADD COLUMN e_wallet_provider TEXT,
        ADD COLUMN e_wallet_linked_mobile TEXT
      `);
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  }
}

/**
 * Helper function to check if a column exists in a table
 */
async function checkColumnExists(table: string, column: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = ${table} AND column_name = ${column}
  `);
  
  return result.length > 0;
}

// Run the migration
migrateDatabase()
  .then(() => {
    console.log("Philippine banking features migration completed.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Migration failed:", error);
    process.exit(1);
  });