// Test script to verify login with case-sensitive username
import fetch from 'node-fetch';

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

async function testLogin(username) {
  console.log(`Attempting to login with username: ${username}`);
  
  const loginData = {
    username: username,
    password: 'pass123'
  };
  
  const { status, data } = await makeRequest('/api/auth/login', 'POST', loginData);
  console.log(`Login status: ${status}`);
  
  if (status === 200 && data.success) {
    console.log('Login successful!');
    console.log('User info:', {
      username: data.user.username,
      role: data.user.role,
      balance: data.user.balance,
      casinoBalance: data.user.casinoBalance,
    });
    
    return true;
  } else {
    console.log('Login failed. Response:', JSON.stringify(data, null, 2));
    return false;
  }
}

async function runTest() {
  try {
    console.log('=== Testing case sensitivity of login ===');
    console.log('First testing with lowercase username...');
    await testLogin('chubbyme');
    
    console.log('\nNow testing with capitalized username...');
    await testLogin('Chubbyme');
  } catch (error) {
    console.error('Test error:', error);
  }
}

runTest();