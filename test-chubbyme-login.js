// Test script to verify login for chubbyme user
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

async function loginUser() {
  console.log('Attempting to login with chubbyme credentials...');
  
  const loginData = {
    username: 'chubbyme',
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
      casinoClientId: data.user.casinoClientId,
      topManager: data.user.topManager,
      immediateManager: data.user.immediateManager
    });
    
    return true;
  } else {
    console.log('Login failed. Response:', JSON.stringify(data, null, 2));
    return false;
  }
}

async function getUserInfo(accessToken) {
  console.log('Fetching user information...');
  
  const { status, data } = await makeRequest('/api/user/info', 'GET', null);
  console.log(`Get user info status: ${status}`);
  
  if (status === 200 && data.success) {
    console.log('User info retrieved successfully:', JSON.stringify(data, null, 2));
    return true;
  } else {
    console.log('Failed to get user info. Response:', JSON.stringify(data, null, 2));
    return false;
  }
}

async function runTest() {
  try {
    const loginSuccess = await loginUser();
    
    if (loginSuccess) {
      await getUserInfo();
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

runTest();