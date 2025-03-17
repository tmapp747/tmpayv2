/**
 * Test casino user persistence in database
 * 
 * This test script verifies that casino users are correctly persisted to the 
 * PostgreSQL database with proper client IDs (without prefixes)
 */

import pg from 'pg';
import axios from 'axios';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Constants
const API_BASE = 'http://localhost:5000/api';
const SALT_ROUNDS = 10;

// Helper functions
function generateRandomSuffix() {
  return Math.floor(Math.random() * 1000);
}

function generateRandomUsername() {
  const prefixes = ['test', 'user', 'casino', 'player'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${randomNumber}`;
}

// Test functions
async function testDirectDatabaseInsert() {
  console.log('=== Testing direct database user insert ===');
  
  try {
    // 1. Create a test user with random username
    const username = generateRandomUsername();
    const password = await bcrypt.hash('password123', SALT_ROUNDS);
    const email = `${username}@example.com`;
    const casinoClientId = 400959205; // Use a real client ID from verification API (chubbyme)
    
    console.log(`Creating test user: ${username} with casino_id: ${casinoClientId}`);
    
    // 2. Insert user directly to database with client ID
    const insertResult = await pool.query(
      `INSERT INTO users 
       (username, password, email, casino_id, balance, pending_balance, is_authorized, is_vip) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, username, casino_id`,
      [username, password, email, String(casinoClientId), '0.00', '0.00', true, false]
    );
    
    const userId = insertResult.rows[0].id;
    console.log(`User created in database with ID: ${userId}`);
    console.log('Database record:', insertResult.rows[0]);
    
    // 3. Verify user was correctly saved with the proper casino_id
    const checkResult = await pool.query(
      'SELECT id, username, casino_id, casino_client_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (checkResult.rows.length === 0) {
      console.error('❌ User not found in database after insert');
      return false;
    }
    
    const user = checkResult.rows[0];
    console.log('Verification query result:', user);
    
    // 4. Check casino_id is stored correctly without prefix
    if (user.casino_id !== String(casinoClientId)) {
      console.error(`❌ Casino ID mismatch: expected ${casinoClientId}, got ${user.casino_id}`);
      return false;
    }
    
    console.log(`✅ Casino ID stored correctly: ${user.casino_id}`);
    return true;
    
  } catch (error) {
    console.error('Error in database test:', error);
    return false;
  }
}

async function testBypassRegistrationApi() {
  console.log('\n=== Testing registration bypass API endpoint ===');
  
  try {
    // 1. Create random test user data
    const username = generateRandomUsername();
    const password = 'password123';
    const email = `${username}@example.com`;
    
    console.log(`Registering test user via API: ${username}`);
    
    // 2. Register user via API
    const response = await axios.post(`${API_BASE}/debug/register-bypass`, {
      username,
      password,
      email
    });
    
    console.log('API response status:', response.status);
    
    if (!response.data.success) {
      console.error('❌ API registration failed:', response.data.message);
      return false;
    }
    
    const apiUser = response.data.user;
    console.log('API registered user:', {
      id: apiUser.id,
      username: apiUser.username,
      casinoId: apiUser.casinoId,
      casinoClientId: apiUser.casinoClientId
    });
    
    // 3. Verify user was correctly saved in database
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
    
    // 4. Check casino_id format - should be direct client ID without prefix
    if (typeof apiUser.casinoId === 'string' && apiUser.casinoId.startsWith('747-')) {
      console.error('❌ API returned casinoId still has 747- prefix:', apiUser.casinoId);
      return false;
    }
    
    if (dbUser.casino_id !== String(apiUser.casinoClientId)) {
      console.error(`❌ Database casino_id mismatch: expected ${apiUser.casinoClientId}, got ${dbUser.casino_id}`);
      return false;
    }
    
    console.log(`✅ API registration stored casino ID correctly: ${dbUser.casino_id}`);
    return true;
    
  } catch (error) {
    console.error('Error in API test:', error);
    return false;
  }
}

// Main test runner
async function runTests() {
  try {
    console.log('🔍 CASINO USER PERSISTENCE TEST 🔍');
    console.log('Testing database connection...');
    
    // Test database connection
    const dbResult = await pool.query('SELECT NOW() as current_time');
    console.log('Database connected at:', dbResult.rows[0].current_time);
    
    // Run the tests
    const dbTestResult = await testDirectDatabaseInsert();
    const apiTestResult = await testBypassRegistrationApi();
    
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Direct database insert test: ${dbTestResult ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`API registration test: ${apiTestResult ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Overall result: ${dbTestResult && apiTestResult ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
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