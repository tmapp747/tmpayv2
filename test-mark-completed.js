const fetch = require('node-fetch');

async function completeTransaction() {
  try {
    // Get an auth token first
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Beding1948', password: 'password' })
    });
    
    const loginData = await loginRes.json();
    console.log('Login response:', loginData);
    
    if (!loginData.success) {
      console.error('Login failed');
      return;
    }
    
    const token = loginData.accessToken;
    
    // Mark the payment as completed
    const completeRes = await fetch('http://localhost:5000/api/payments/mark-as-completed', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 
      },
      body: JSON.stringify({ 
        paymentReference: 'ref_11b21e4de1a33b1d'
      })
    });
    
    const completeData = await completeRes.json();
    console.log('Complete payment response:', completeData);
    
    // Check the transaction status
    const checkRes = await fetch(, {
      headers: { 'Authorization':  }
    });
    
    const checkData = await checkRes.json();
    console.log('Transaction status after completion:', checkData);
  } catch (error) {
    console.error('Error:', error);
  }
}

completeTransaction();
