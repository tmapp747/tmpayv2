import fetch from 'node-fetch';

// Base URL for API requests
const API_URL = 'http://localhost:5000';

// Function to make API requests
async function makeRequest(endpoint, method, body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    console.log(`Making ${method} request to ${endpoint}...`);
    
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log('Response:', JSON.stringify(data, null, 2));
    return { success: true, data };
  } catch (error) {
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Register the athan45 user
async function registerAthan45() {
  console.log('\n=== REGISTERING ATHAN45 USER ===\n');
  
  return await makeRequest('/api/debug/register-bypass', 'POST', {
    username: 'athan45',
    password: 'test1234',
    email: 'athan45@example.com',
    topManager: 'Marcthepogi',
    immediateManager: 'bossmarc747',
    casinoUserType: 'player'
  });
}

// Login with athan45
async function loginAthan45() {
  console.log('\n=== LOGGING IN AS ATHAN45 ===\n');
  
  return await makeRequest('/api/auth/login', 'POST', {
    username: 'athan45',
    password: 'test1234'
  });
}

// Get user info
async function getUserInfo(token) {
  console.log('\n=== GETTING USER INFO ===\n');
  
  const options = token ? {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  } : {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  try {
    console.log('Making GET request to /api/user/info...');
    
    const response = await fetch(`${API_URL}/api/user/info`, options);
    const data = await response.json();
    
    console.log('Response:', JSON.stringify(data, null, 2));
    return { success: true, data };
  } catch (error) {
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
async function runTest() {
  // First register athan45
  const registerResult = await registerAthan45();
  
  if (!registerResult.success) {
    console.log('Registration failed, trying login anyway...');
  }
  
  // Then try to login
  const loginResult = await loginAthan45();
  
  if (!loginResult.success) {
    console.error('Login failed!');
    return;
  }
  
  // Get the token from the login response
  const token = loginResult.data?.user?.accessToken;
  
  if (!token) {
    console.warn('No token received from login, trying getUserInfo without token...');
  } else {
    console.log('Received token:', token.substring(0, 10) + '...');
  }
  
  // Try to get user info
  await getUserInfo(token);
}

// Execute the test
runTest().catch(console.error);