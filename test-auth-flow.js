// Test script to verify the authentication flow
const axios = require('axios');
const fs = require('fs');

// Helper function for logging
function log(message, data = null) {
  console.log('\n----------------------');
  console.log(message);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  console.log('----------------------\n');
}

async function testAuthFlow() {
  try {
    log('Starting authentication flow test');
    
    // Step 1: Test the debug registration endpoint
    log('Step 1: Creating a test user with debug registration');
    const username = `user_${Date.now()}`;
    const password = 'test123456';
    
    const debugRegResponse = await axios.post('http://localhost:5000/api/debug/register-bypass', {
      username: username,
      password: password,
      email: `${username}@example.com`,
      casinoUsername: username,
      topManager: 'Marcthepogi',
      immediateManager: 'bossmarc747',
      casinoUserType: 'player',
      casinoClientId: Math.floor(Math.random() * 100000)
    });
    
    log('Registration response:', debugRegResponse.data);
    
    if (!debugRegResponse.data.success) {
      throw new Error('Registration failed: ' + debugRegResponse.data.message);
    }
    
    // Extract cookies for subsequent requests
    const cookies = debugRegResponse.headers['set-cookie'] || [];
    fs.writeFileSync('cookies.txt', cookies.join('\n'));
    log('Saved cookies to cookies.txt');
    
    const cookieConfig = {
      headers: {
        Cookie: cookies.join('; ')
      }
    };
    
    // Step 2: Test the user info endpoint to verify cookie-based session
    log('Step 2: Fetching user info with session cookie');
    const userInfoResponse = await axios.get('http://localhost:5000/api/user/info', cookieConfig);
    log('User info response:', userInfoResponse.data);
    
    // Step 3: Test token-based auth
    log('Step 3: Testing token-based auth');
    const { accessToken } = debugRegResponse.data.user;
    
    const tokenConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    };
    
    const tokenAuthResponse = await axios.get('http://localhost:5000/api/user/info', tokenConfig);
    log('Token auth response:', tokenAuthResponse.data);
    
    // Step 4: Test logout
    log('Step 4: Testing logout');
    const logoutResponse = await axios.post('http://localhost:5000/api/auth/logout', {}, cookieConfig);
    log('Logout response:', logoutResponse.data);
    
    // Try to access user info after logout - should fail
    try {
      log('Step 5: Trying to access protected route after logout');
      const afterLogoutResponse = await axios.get('http://localhost:5000/api/user/info', cookieConfig);
      log('After logout response (should have failed):', afterLogoutResponse.data);
    } catch (error) {
      log('Expected error after logout:', { 
        status: error.response?.status,
        message: error.response?.data?.message
      });
    }
    
    log('Auth flow test completed successfully');
  } catch (error) {
    log('Error in auth flow test:');
    console.error(error);
    
    if (error.response) {
      log('Response data:', error.response.data);
      log('Response status:', error.response.status);
    }
  }
}

testAuthFlow();