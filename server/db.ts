import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';
import { DB_CONNECTION_RETRIES, DB_RETRY_DELAY_MS, DB_DEBUG } from './constants';

// Create a PostgreSQL connection pool with better settings for reliability
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 10000, // How long to wait for a connection
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

// Create a Drizzle ORM instance
export const db = drizzle(pool, { schema });

// Add indexes for frequently accessed fields
export const createIndexes = async () => {
  try {
    if (DB_DEBUG) console.log('Creating database indexes...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
      CREATE INDEX IF NOT EXISTS idx_qr_payments_reference ON qr_payments (direct_pay_reference);
      CREATE INDEX IF NOT EXISTS idx_users_casino_username ON users (casino_username);
      CREATE INDEX IF NOT EXISTS idx_users_casino_client_id ON users (casino_client_id);
      CREATE INDEX IF NOT EXISTS idx_users_uuid ON users (uuid);
      CREATE INDEX IF NOT EXISTS idx_transactions_uuid ON transactions (uuid);
    `);
    if (DB_DEBUG) console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating database indexes:', error);
  }
};

// Test database connection with retry mechanism
export async function testConnection(retries = DB_CONNECTION_RETRIES): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1'); // Verify query execution
      console.log('Database connection and query successful');
      client.release();
      
      // Create indexes after successful connection
      await createIndexes();
      
      return true;
    } catch (error) {
      console.error(`Database connection attempt ${attempt}/${retries} failed:`, error.message);
      
      if (attempt < retries) {
        console.log(`Retrying in ${DB_RETRY_DELAY_MS / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, DB_RETRY_DELAY_MS));
      } else {
        console.error('All database connection attempts failed');
        throw new Error(`Database connection error: ${error.message}`);
      }
    }
  }
  return false;
}

// Handle unexpected errors in the connection pool
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
  
  // For connection termination errors, attempt to recover
  if (err.code === '57P01' || err.code === '57P02' || err.code === '57P03') {
    console.log('Connection terminated unexpectedly. Attempting recovery...');
    // The pool will automatically create a new client for the next request
  }
});

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('Application terminating, closing database pool...');
  await pool.end();
  process.exit(0);
});