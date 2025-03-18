import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';

// Create a PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a Drizzle ORM instance
export const db = drizzle(pool, { schema });

// Add indexes for frequently accessed fields
const createIndexes = async () => {
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
    CREATE INDEX IF NOT EXISTS idx_qr_payments_reference ON qr_payments (direct_pay_reference);
  `);
};


export async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1'); // Verify query execution
    console.log('Database connection and query successful');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw new Error(`Database connection error: ${error.message}`);
  }
}

// Initialize connection pool with better error handling
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});