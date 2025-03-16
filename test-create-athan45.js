import axios from 'axios';
import fs from 'fs';

async function createTestUser() {
  try {
    console.log('Creating test user athan45...');
    
    const response = await axios.post('http://localhost:5000/api/debug/register-bypass', {
      username: 'athan45',
      password: 'test1234',
      email: 'athan45@example.com'
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
    });
    
    console.log('Login Response:', JSON.stringify(loginResponse.data, null, 2));
    
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