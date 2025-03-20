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
import { sql } from "drizzle-orm";

// List of all columns we want to add, each with their SQL definition
const columnsToAdd = [
  { name: "instapay_enabled", definition: "BOOLEAN DEFAULT false" },
  { name: "pesonet_enabled", definition: "BOOLEAN DEFAULT false" },
  { name: "qr_ph_enabled", definition: "BOOLEAN DEFAULT false" },
  { name: "daily_transfer_limit", definition: "NUMERIC(10,2)" },
  { name: "per_transaction_limit", definition: "NUMERIC(10,2)" },
  { name: "verification_method", definition: "TEXT" },
  { name: "verification_status", definition: "TEXT DEFAULT 'pending'" },
  { name: "verification_data", definition: "JSONB DEFAULT '{}'::jsonb" },
  { name: "remittance_provider", definition: "TEXT" },
  { name: "remittance_phone_number", definition: "TEXT" },
  { name: "remittance_pin", definition: "TEXT" },
  { name: "e_wallet_provider", definition: "TEXT" },
  { name: "e_wallet_linked_mobile", definition: "TEXT" },
  { name: "blockchain_network", definition: "TEXT" },
  { name: "branch_name", definition: "TEXT" },
  { name: "swift_code", definition: "TEXT" },
  { name: "routing_number", definition: "TEXT" },
  { name: "additional_info", definition: "JSONB DEFAULT '{}'::jsonb" }
];

async function migrateDatabase() {
  console.log("Starting migration for Philippine banking features...");
  
  try {
    let columnsAdded = 0;
    
    // Process each column individually
    for (const column of columnsToAdd) {
      if (!await checkColumnExists("user_payment_methods", column.name)) {
        console.log(`Adding column: ${column.name}`);
        await db.execute(sql.raw(`
          ALTER TABLE user_payment_methods 
          ADD COLUMN ${column.name} ${column.definition}
        `));
        columnsAdded++;
      } else {
        console.log(`Column ${column.name} already exists, skipping...`);
      }
    }
    
    console.log(`Migration completed successfully! Added ${columnsAdded} new columns.`);
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
  
  return result.rows.length > 0;
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