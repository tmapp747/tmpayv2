// ES Module test script for getting user transactions
import fetch from 'node-fetch';
import fs from 'fs';

// Create a cookie jar for session persistence
const cookieJar = [];

// Function to store and manage cookies
function saveCookies(response) {
  const cookies = response.headers.raw()['set-cookie'];
  if (cookies) {
    cookies.forEach(cookie => {
      // Extract the cookie name and value
      const cookiePart = cookie.split(';')[0];
      // Replace existing cookie or add new one
      const existingIndex = cookieJar.findIndex(c => c.startsWith(cookiePart.split('=')[0]));
      if (existingIndex >= 0) {
        cookieJar[existingIndex] = cookiePart;
      } else {
        cookieJar.push(cookiePart);
      }
    });
    
    // Save cookies to a file for curl or other tools to use
    fs.writeFileSync('cookies.txt', cookieJar.join('; '));
    return true;
  }
  return false;
}

// Function to get cookie string for request headers
function getCookieString() {
  return cookieJar.join('; ');
}

async function testTransactionListApi() {
  try {
    console.log('Testing transaction list API for user Wakay...');
    
    // Step 1: Login first
    console.log('\nStep 1: Authenticating with Wakay account...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'Wakay',
        password: 'Wakay@123',
        userType: 'player'
      })
    });
    
    // Save cookies from login response
    saveCookies(loginResponse);
    
    const loginData = await loginResponse.json();
    if (!loginData.success) {
      console.log('Login failed:', loginData.message);
      return;
    }
    
    console.log('Login successful as Wakay');
    
    // Step 2: Get user transactions
    console.log('\nStep 2: Fetching user transactions...');
    const transactionsResponse = await fetch('http://localhost:5000/api/transactions', {
      headers: {
        'Cookie': getCookieString()
      }
    });
    
    const transactionsData = await transactionsResponse.json();
    console.log('Transactions API response status:', transactionsResponse.status);
    console.log('Transactions API success:', transactionsData.success);
    
    if (transactionsData.success) {
      console.log(`Found ${transactionsData.transactions.length} transactions`);
      
      if (transactionsData.transactions.length > 0) {
        console.log('\nMost recent transaction:');
        const latestTransaction = transactionsData.transactions[0];
        console.log('Transaction ID:', latestTransaction.id);
        console.log('Type:', latestTransaction.type);
        console.log('Amount:', latestTransaction.amount);
        console.log('Status:', latestTransaction.status);
        console.log('Reference:', latestTransaction.reference);
        console.log('Created At:', latestTransaction.createdAt);
      }
    } else {
      console.log('Failed to fetch transactions:', transactionsData.message);
    }
    
  } catch (error) {
    console.error('Error testing transaction list API:', error);
  }
}

testTransactionListApi();