// Test script to verify core wallet functionality
import fetch from 'node-fetch';

let accessToken = null;

async function makeRequest(endpoint, method = 'GET', body = null) {
  const baseUrl = 'http://localhost:5000';
  const url = `${baseUrl}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (accessToken) {
    options.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
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

async function login() {
  console.log('Logging in as chubbyme...');
  
  const loginData = {
    username: 'chubbyme',
    password: 'pass123'
  };
  
  const { status, data } = await makeRequest('/api/auth/login', 'POST', loginData);
  
  if (status === 200 && data.success) {
    console.log('Login successful!');
    accessToken = data.user.accessToken;
    return true;
  } else {
    console.log('Login failed. Response:', JSON.stringify(data, null, 2));
    return false;
  }
}

async function getTransactionHistory() {
  console.log('\nFetching transaction history...');
  
  const { status, data } = await makeRequest('/api/transactions', 'GET');
  
  if (status === 200 && data.success) {
    console.log(`Found ${data.transactions.length} transactions.`);
    if (data.transactions.length > 0) {
      console.log('Most recent transaction:', JSON.stringify(data.transactions[0], null, 2));
    }
    return data.transactions;
  } else {
    console.log('Failed to fetch transactions. Response:', JSON.stringify(data, null, 2));
    return [];
  }
}

async function getUserBalance() {
  console.log('\nFetching user balance...');
  
  const { status, data } = await makeRequest('/api/user/info', 'GET');
  
  if (status === 200 && data.success) {
    console.log('User balance info:');
    console.log(`- Wallet Balance: PHP ${data.user.balance}`);
    console.log(`- Casino Balance: PHP ${data.user.casinoBalance}`);
    return { walletBalance: data.user.balance, casinoBalance: data.user.casinoBalance };
  } else {
    console.log('Failed to fetch user info. Response:', JSON.stringify(data, null, 2));
    return null;
  }
}

async function getCasinoDetails() {
  console.log('\nFetching casino user details...');
  
  const { status, data } = await makeRequest('/api/casino/user-info', 'GET');
  
  if (status === 200 && data.success) {
    console.log('Casino user details:', JSON.stringify(data, null, 2));
    return data;
  } else {
    console.log('Failed to fetch casino details. Response:', JSON.stringify(data, null, 2));
    return null;
  }
}

async function runTest() {
  try {
    const loginSuccess = await login();
    
    if (loginSuccess) {
      await getUserBalance();
      await getTransactionHistory();
      await getCasinoDetails();
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

runTest();