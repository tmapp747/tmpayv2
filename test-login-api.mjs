// ES Module test script for the login API
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

async function testLoginApi() {
  try {
    console.log('Testing login API with Wakay credentials...');
    
    // Login with Wakay credentials
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
    const cookiesSaved = saveCookies(loginResponse);
    console.log('Cookies saved:', cookiesSaved);
    
    const loginData = await loginResponse.json();
    console.log('Login response status:', loginResponse.status);
    console.log('Login success:', loginData.success);
    
    if (loginData.success) {
      console.log('\nLogin successful!');
      console.log('User ID:', loginData.user.id);
      console.log('Username:', loginData.user.username);
      console.log('Casino Username:', loginData.user.casinoUsername);
      console.log('Casino Client ID:', loginData.user.casinoClientId);
      console.log('Top Manager:', loginData.user.topManager);
      console.log('Balance:', loginData.user.balance);
      
      // Test the user info endpoint with session cookies
      const userInfoResponse = await fetch('http://localhost:5000/api/user/info', {
        headers: {
          'Cookie': getCookieString()
        }
      });
      
      const userInfoData = await userInfoResponse.json();
      console.log('\nAuthorized request to User Info API using cookies:');
      console.log('Status:', userInfoResponse.status);
      console.log('Success:', userInfoData.success);
      
      if (userInfoData.success) {
        console.log('Username from Info API:', userInfoData.user.username);
        console.log('Balance from Info API:', userInfoData.user.balance);
      } else {
        console.log('Info API error:', userInfoData.message);
      }
      
      // For comparison, also try with Bearer token
      const accessToken = loginData.user.accessToken;
      const tokenResponse = await fetch('http://localhost:5000/api/user/info', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const tokenData = await tokenResponse.json();
      console.log('\nAuthorized request to User Info API using Bearer token:');
      console.log('Status:', tokenResponse.status);
      console.log('Success:', tokenData.success);
      
      if (tokenData.success) {
        console.log('Username from token API:', tokenData.user.username);
      } else {
        console.log('Token API error:', tokenData.message);
      }
    } else {
      console.log('Login failed:', loginData.message);
    }
    
  } catch (error) {
    console.error('Error testing login API:', error);
  }
}

testLoginApi();