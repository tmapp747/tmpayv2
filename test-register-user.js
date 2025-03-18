/**
 * Test script to verify user registration and database persistence
 */

const fetch = require('node-fetch');
const { Pool } = require('pg');

// Create a connection to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function makeRequest(endpoint, method = 'GET', body = null) {
  const baseUrl = 'http://localhost:5000';
  const url = `${baseUrl}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error);
    throw error;
  }
}

async function verifyUsername() {
  console.log('Verifying username eligibility...');
  
  const verifyData = {
    username: 'testuserNew',
    userType: 'player'
  };
  
  const { status, data } = await makeRequest('/api/auth/verify-username', 'POST', verifyData);
  console.log(`Username verification status: ${status}`);
  console.log('Verification response:', data);
  return data;
}

async function registerUser(verificationResponse) {
  console.log('Registering new user...');
  
  const registerData = {
    username: 'testuserNew',
    password: 'TestUser@123',
    email: 'testuser@example.com',
    userType: 'player',
    // Include data from verification response
    topManager: verificationResponse.topManager,
    immediateManager: verificationResponse.immediateManager,
    clientId: verificationResponse.clientId
  };
  
  const { status, data } = await makeRequest('/api/auth/register', 'POST', registerData);
  console.log(`Registration status: ${status}`);
  console.log('Registration response:', data);
  return data;
}

async function checkUserInDatabase() {
  console.log('Checking user in database...');
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', ['testuserNew']);
    
    if (result.rows.length > 0) {
      console.log('User found in database!');
      console.log('User record:', result.rows[0]);
      return true;
    } else {
      console.log('User not found in database.');
      return false;
    }
  } catch (error) {
    console.error('Error checking user in database:', error);
    return false;
  } finally {
    await pool.end();
  }
}

async function runTest() {
  try {
    const verificationResponse = await verifyUsername();
    
    if (verificationResponse.success) {
      const registrationResponse = await registerUser(verificationResponse);
      
      if (registrationResponse.success) {
        await checkUserInDatabase();
      }
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

runTest();