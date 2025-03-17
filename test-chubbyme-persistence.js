/**
 * Test casino user persistence focusing on the "chubbyme" user
 * 
 * This test script verifies that users with the correct client ID (400959205)
 * from the casino API are properly persisted in the database.
 */

import pg from 'pg';
import axios from 'axios';
import bcrypt from 'bcrypt';

const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Constants
const API_BASE = 'http://localhost:5000/api';
const SALT_ROUNDS = 10;
const CHUBBYME_CLIENT_ID = 400959205; // Actual client ID from verification API for "chubbyme"

// Test creating and verifying chubbyme variants
async function testChubbymePersistence() {
  console.log('=== Testing chubbyme user persistence ===');
  
  try {
    // Generate a chubbyme variant username
    const username = `chubbyme_${Math.floor(Math.random() * 1000)}`;
    const password = 'password123';
    const email = `${username}@example.com`;
    
    console.log(`Registering chubbyme variant user: ${username}`);
    
    // Register user via API
    const response = await axios.post(`${API_BASE}/debug/register-bypass`, {
      username,
      password,
      email
    });
    
    console.log('API response status:', response.status);
    
    if (!response.data.success) {
      console.error('❌ chubbyme API registration failed:', response.data.message);
      return false;
    }
    
    const apiUser = response.data.user;
    console.log('API registered user:', {
      id: apiUser.id,
      username: apiUser.username,
      casinoId: apiUser.casinoId,
      casinoClientId: apiUser.casinoClientId
    });
    
    // Check that the API returned the correct client ID
    if (apiUser.casinoClientId !== CHUBBYME_CLIENT_ID) {
      console.error(`❌ API returned incorrect casinoClientId: expected ${CHUBBYME_CLIENT_ID}, got ${apiUser.casinoClientId}`);
      return false;
    }
    
    // Verify user was correctly saved in database
    const checkResult = await pool.query(
      'SELECT id, username, casino_id, casino_client_id FROM users WHERE username = $1',
      [username]
    );
    
    if (checkResult.rows.length === 0) {
      console.error('❌ API registered user not found in database');
      return false;
    }
    
    const dbUser = checkResult.rows[0];
    console.log('Database verification result:', dbUser);
    
    // Check that casinoId is stored correctly without the "747-" prefix
    if (dbUser.casino_id !== String(CHUBBYME_CLIENT_ID)) {
      console.error(`❌ Database casino_id incorrect: expected ${CHUBBYME_CLIENT_ID}, got ${dbUser.casino_id}`);
      return false;
    }
    
    console.log(`✅ chubbyme variant user stored with correct casino ID: ${dbUser.casino_id}`);
    
    // Try direct database insert
    return await testDirectInsertChubbyme();
    
  } catch (error) {
    console.error('Error in chubbyme API test:', error);
    return false;
  }
}

// Test direct database insertion of a chubbyme user
async function testDirectInsertChubbyme() {
  console.log('\n=== Testing direct database insert of chubbyme user ===');
  
  try {
    // Create a chubbyme variant user directly in database
    const username = `chubbyme_db_${Math.floor(Math.random() * 1000)}`;
    const password = await bcrypt.hash('password123', SALT_ROUNDS);
    const email = `${username}@example.com`;
    
    console.log(`Creating chubbyme variant user directly in DB: ${username}`);
    
    // Insert user directly to database with the correct client ID
    const insertResult = await pool.query(
      `INSERT INTO users 
       (username, password, email, casino_id, balance, pending_balance, is_authorized, is_vip) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, username, casino_id`,
      [username, password, email, String(CHUBBYME_CLIENT_ID), '0.00', '0.00', true, false]
    );
    
    const userId = insertResult.rows[0].id;
    console.log(`User created in database with ID: ${userId}`);
    console.log('Database record:', insertResult.rows[0]);
    
    // Verify the user was saved correctly
    const checkResult = await pool.query(
      'SELECT id, username, casino_id, casino_client_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (checkResult.rows.length === 0) {
      console.error('❌ Direct inserted user not found in database');
      return false;
    }
    
    const user = checkResult.rows[0];
    console.log('Verification query result:', user);
    
    // Check casino_id is stored correctly without prefix
    if (user.casino_id !== String(CHUBBYME_CLIENT_ID)) {
      console.error(`❌ Direct inserted casino_id incorrect: expected ${CHUBBYME_CLIENT_ID}, got ${user.casino_id}`);
      return false;
    }
    
    console.log(`✅ Direct inserted casino ID stored correctly: ${user.casino_id}`);
    return true;
    
  } catch (error) {
    console.error('Error in direct database test:', error);
    return false;
  }
}

// Main test runner
async function runTests() {
  try {
    console.log('🔍 CHUBBYME USER PERSISTENCE TEST 🔍');
    console.log(`Using real client ID: ${CHUBBYME_CLIENT_ID} from the chubbyme verification API response`);
    console.log('Testing database connection...');
    
    // Test database connection
    const dbResult = await pool.query('SELECT NOW() as current_time');
    console.log('Database connected at:', dbResult.rows[0].current_time);
    
    // Run the tests
    const testResult = await testChubbymePersistence();
    
    console.log('\n=== TEST SUMMARY ===');
    console.log(`chubbyme user persistence test: ${testResult ? '✅ PASSED' : '❌ FAILED'}`);
    
  } catch (error) {
    console.error('Test runner error:', error);
  } finally {
    // Close database pool
    await pool.end();
    console.log('Database pool closed');
  }
}

// Run the tests
runTests();