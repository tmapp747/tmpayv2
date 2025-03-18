/**
 * Simplified test for case-insensitive login functionality
 * Tests lowercase and uppercase versions of the username
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const PASSWORD = 'Wakay@123';

// Just test lowercase and uppercase variations
const usernameCases = [
  'wakay',    // all lowercase
  'WAKAY'     // all uppercase
];

async function testLogin(username) {
  try {
    console.log(`Testing login with username: "${username}"`);
    
    const response = await axios.post(`${BASE_URL}/api/login`, {
      username,
      password: PASSWORD
    });

    if (response.data.success) {
      console.log(`✅ SUCCESS: Login successful with username "${username}"`);
      console.log(`   User ID: ${response.data.user.id}`);
      console.log(`   Stored username: ${response.data.user.username}`);
      return true;
    } else {
      console.log(`❌ FAILED: Login failed with username "${username}"`);
      console.log(`   Error: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR: Login attempt with username "${username}" failed with exception`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data.message || 'Unknown error'}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('========================================');
  console.log('TESTING CASE-INSENSITIVE LOGIN');
  console.log('========================================');

  let successCount = 0;
  
  for (const username of usernameCases) {
    const success = await testLogin(username);
    if (success) successCount++;
    console.log('----------------------------------------');
  }
  
  console.log('========================================');
  console.log(`SUMMARY: ${successCount}/${usernameCases.length} login attempts successful`);
  console.log('========================================');
}

runTests().catch(err => {
  console.error('Test script error:', err);
});