// Test script to verify the DirectPay GCash + Casino747 transfer flow
import axios from 'axios';

// Utility function to log steps
const log = (message: string, data?: any) => {
  console.log(`\n✨ ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

async function testDepositFlow() {
  try {
    log('Starting deposit flow test');
    
    // 1. First, we need to login or use an existing account
    // For test purposes, we'll login with a test user
    log('Step 1: Logging in with test user');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'Wakay',
      password: 'password123' 
    });
    
    log('Login response:', loginResponse.data);
    
    // Extract cookies for subsequent requests
    const cookies = loginResponse.headers['set-cookie'] || [];
    const config = {
      headers: {
        Cookie: cookies.join('; ')
      }
    };
    
    // 2. Generate a QR code for payment
    log('Step 2: Generating QR code for deposit');
    const qrResponse = await axios.post('http://localhost:5000/api/payments/gcash/generate-qr', {
      amount: 100 // Test with 100 PHP
    }, config);
    
    log('QR code generation response:', qrResponse.data);
    
    if (!qrResponse.data.success) {
      throw new Error('Failed to generate QR code');
    }
    
    // Extract payment data
    const { qrPayment, transaction } = qrResponse.data;
    
    // 3. Now simulate the webhook being called by DirectPay
    log('Step 3: Simulating DirectPay webhook callback');
    
    // This is what a webhook payload from DirectPay might look like
    const webhookPayload = {
      reference: qrPayment.directPayReference,
      status: 'completed',
      amount: qrPayment.amount,
      transactionId: `DP${Date.now()}`,
      payment_date: new Date().toISOString()
    };
    
    log('Webhook payload:', webhookPayload);
    
    // Send the webhook to our endpoint
    const webhookResponse = await axios.post(
      'http://localhost:5000/api/webhook/directpay/payment',
      webhookPayload
    );
    
    log('Webhook processing response:', webhookResponse.data);
    
    // 4. Verify that payment was processed correctly
    log('Step 4: Checking payment status');
    const statusResponse = await axios.get(
      `http://localhost:5000/api/payments/status/${qrPayment.directPayReference}`,
      config
    );
    
    log('Payment status response:', statusResponse.data);
    
    // 5. Verify updated user balance
    log('Step 5: Checking updated user info');
    const userResponse = await axios.get('http://localhost:5000/api/user/info', config);
    
    log('User info after payment:', userResponse.data);
    
    log('Test completed successfully!');
    return {
      success: true,
      qrPaymentId: qrPayment.id,
      transactionId: transaction.id,
      paymentReference: qrPayment.directPayReference
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
}

// Run the test
testDepositFlow();