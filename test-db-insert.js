import pkg from 'pg';
const { Pool } = pkg;

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testDirectInsert() {
  try {
    console.log('Starting direct database insert test');
    
    // Test 1: Simple query to check connection
    const testResult = await pool.query('SELECT NOW()');
    console.log('Database connection test successful:', testResult.rows[0]);
    
    // Test 2: Check users table structure
    const tableTest = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.log('Users table columns:');
    tableTest.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    
    // Test 3: Insert directly with casinoId explicitly set
    const testUser = {
      username: 'test_direct_insert',
      password: '$2b$10$AbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQr',
      email: 'test_direct@example.com',
      balance: 0,
      pending_balance: 0,
      balances: JSON.stringify({ PHP: "0", PHPT: "0", USDT: "0" }),
      preferred_currency: 'PHP',
      is_vip: false,
      casino_id: '12345678', // Explicitly set
      is_authorized: true,
      hierarchy_level: 0
    };
    
    console.log('Attempting direct insert with test user:', { ...testUser, password: '[REDACTED]' });
    
    // Construct the query
    const fields = Object.keys(testUser);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(',');
    const insertQuery = `
      INSERT INTO users (${fields.join(',')})
      VALUES (${placeholders})
      RETURNING id
    `;
    
    console.log('SQL Query:', insertQuery);
    console.log('Values:', Object.values(testUser));
    
    const insertResult = await pool.query(insertQuery, Object.values(testUser));
    console.log('Direct insert successful, new user ID:', insertResult.rows[0].id);
    
    // Cleanup
    await pool.query('DELETE FROM users WHERE username = $1', ['test_direct_insert']);
    console.log('Test cleanup completed');
    
    return 'Test completed successfully';
  } catch (error) {
    console.error('Test error:', error);
    return `Test failed: ${error.message}`;
  } finally {
    // Close the pool
    await pool.end();
    console.log('Database pool closed');
  }
}

// Run the test
testDirectInsert()
  .then(result => console.log(result))
  .catch(err => console.error('Unhandled error:', err));