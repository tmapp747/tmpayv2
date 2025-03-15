import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '../shared/schema';

// Create a PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a Drizzle ORM instance
export const db = drizzle(pool, { schema });

export async function testConnection() {
  try {
    // Try to connect to check if DB is accessible
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}