// Simple script to test the login API with specific credentials
import fetch from 'node-fetch';

async function testLogin() {
  try {
    console.log('Testing login with Wakay credentials...');
    
    // Login request with credentials
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'wakay',
        password: 'wakat12',
        userType: 'player'
      })
    });
    
    const loginData = await loginResponse.json();
    
    console.log(`Login response status: ${loginResponse.status}`);
    console.log('Login response data:', JSON.stringify(loginData, null, 2));
    
    // If login successful, test user info endpoint
    if (loginResponse.ok) {
      console.log('\nLogin successful! Testing user info endpoint...');
      
      // Extract cookies if needed for session-based auth
      const cookies = loginResponse.headers.get('set-cookie');
      console.log('Cookies received:', cookies);
      
      // Get user info to verify login worked
      const userInfoResponse = await fetch('http://localhost:5000/api/user/info', {
        headers: {
          'Cookie': cookies
        }
      });
      
      const userInfoData = await userInfoResponse.json();
      console.log(`User info response status: ${userInfoResponse.status}`);
      console.log('User info data:', JSON.stringify(userInfoData, null, 2));
    }
    
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

testLogin();