// Test script to register chubbyme user through the API
import fetch from 'node-fetch';
import pkg from 'pg';
const { Pool } = pkg;

// Create connection to database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function makeRequest(endpoint, method = 'POST', body = null) {
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
    username: 'chubbyme',
    userType: 'player'
  };
  
  const { status, data } = await makeRequest('/api/auth/verify-username', 'POST', verifyData);
  console.log(`Username verification status: ${status}`);
  console.log('Verification response:', JSON.stringify(data, null, 2));
  return data;
}

async function registerUser(verificationResponse) {
  console.log('Registering chubbyme user...');
  
  const registerData = {
    username: 'chubbyme',
    password: 'pass123',
    email: 'misis@gnail.com',
    userType: 'player',
    // Include data from verification response if available
    topManager: verificationResponse.topManager,
    immediateManager: verificationResponse.immediateManager,
    clientId: verificationResponse.clientId
  };
  
  const { status, data } = await makeRequest('/api/auth/register', 'POST', registerData);
  console.log(`Registration status: ${status}`);
  console.log('Registration response:', JSON.stringify(data, null, 2));
  return data;
}

async function checkUserInDatabase() {
  console.log('Checking user in database...');
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', ['chubbyme']);
    
    if (result.rows.length > 0) {
      console.log('User found in database!');
      // Filter out sensitive fields before logging
      const userRecord = { ...result.rows[0] };
      delete userRecord.password;
      delete userRecord.access_token;
      delete userRecord.refresh_token;
      delete userRecord.casino_auth_token;
      
      console.log('User record:', JSON.stringify(userRecord, null, 2));
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