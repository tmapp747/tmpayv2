import axios from 'axios';
import fs from 'fs';

async function createTestUser() {
  try {
    console.log('Creating test user athan45...');
    
    const response = await axios.post('http://localhost:5000/api/debug/register-bypass', {
      username: 'athan45',
      password: 'test1234',
      email: 'athan45@example.com',
      casinoId: '747-1234567', // Make sure to include required fields
      casinoUsername: 'athan45', 
      casinoClientId: 1234567,
      topManager: 'Marcthepogi',
      immediateManager: 'bossmarc747',
      casinoUserType: 'player',
      isAuthorized: true
    });
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Extract cookies for subsequent requests
    const cookies = response.headers['set-cookie'] || [];
    fs.writeFileSync('cookies.txt', cookies.join('\n'));
    console.log('Saved cookies to cookies.txt');
    
    // Try to login with the created user
    console.log('\nTesting login for athan45...');
    const loginResponse = await axios.post('http://localhost:5000/api/debug/login', {
      username: 'athan45',
      password: 'test1234'
    }, {
      // Important: include withCredentials to enable cookies
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Login Response:', JSON.stringify(loginResponse.data, null, 2));
    
    // Now test if the session is working by making a request to a protected endpoint
    console.log('\nTesting user info endpoint with session auth...');
    try {
      const userInfoResponse = await axios.get('http://localhost:5000/api/user/info', {
        withCredentials: true,
        headers: {
          Cookie: loginResponse.headers['set-cookie']?.join('; ') || ''
        }
      });
      
      console.log('User Info Response:', JSON.stringify(userInfoResponse.data, null, 2));
    } catch (infoError) {
      console.error('User info request failed:', infoError.message);
      if (infoError.response) {
        console.error('Info response data:', infoError.response.data);
      }
    }
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error in test:');
    console.error(error.message);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

createTestUser();