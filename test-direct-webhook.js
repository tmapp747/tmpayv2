/**
 * Test script to directly simulate a DirectPay webhook for an existing payment
 * 
 * This script bypasses authentication and directly sends a webhook payload
 * to simulate a payment completion event.
 */

import fetch from 'node-fetch';
const baseUrl = 'http://localhost:5000';

// Find an existing payment reference or create one if needed
// You can get this from the database or admin panel
const existingPaymentReference = 'ref_123456789'; // Replace with a real reference

async function simulateWebhook() {
  try {
    console.log('Simulating DirectPay webhook with successful payment...');
    
    // Create webhook payload similar to what DirectPay would send
    const webhookPayload = {
      reference: existingPaymentReference,
      status: 'success',
      transaction_id: `dp_${Date.now()}`,
      amount: 100, // PHP
      currency: 'PHP',
      timestamp: new Date().toISOString()
    };
    
    console.log('Webhook payload:', webhookPayload);
    
    const response = await fetch(`${baseUrl}/api/webhook/directpay/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload)
    });
    
    const result = await response.json();
    
    console.log('Webhook response:', result);
    
    return result.success;
  } catch (error) {
    console.error('Webhook simulation error:', error);
    return false;
  }
}

// Run the test
simulateWebhook().then(success => {
  if (success) {
    console.log('✅ Webhook simulation completed successfully!');
  } else {
    console.log('❌ Webhook simulation failed!');
  }
});