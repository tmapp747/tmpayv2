/**
 * Simplified test for DirectPay webhook handler
 * This script tests only the webhook handling functionality
 */

import fetch from 'node-fetch';

const baseUrl = 'http://localhost:5000';
const depositAmount = 100;
const reference = `ref_${Date.now()}`;

async function simulateOfficialWebhook() {
  try {
    console.log('🔄 Simulating official DirectPay webhook payload format...');
    
    // Create webhook payload matching DirectPay's official format
    const webhookPayload = {
      refId: reference,
      invoiceNo: `INV-${Date.now()}`,
      txnDesc: `Test deposit payment`,
      txnDate: new Date().toISOString(),
      txnId: `DP-${Date.now()}`,
      status: 'SUCCESS',  // Official format uses uppercase status values
      merchant_id: 'TM747',
      amount: depositAmount,
      currency: 'PHP',
      timestamp: new Date().toISOString()
    };
    
    console.log('📝 Official webhook payload:', JSON.stringify(webhookPayload, null, 2));
    
    const response = await fetch(`${baseUrl}/api/webhook/directpay/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload)
    });
    
    const result = await response.json();
    
    console.log('🔄 Webhook response:', result);
    
    return result.success;
  } catch (error) {
    console.error('❌ Webhook simulation error:', error);
    return false;
  }
}

async function runTest() {
  console.log('🚀 Starting simplified DirectPay webhook test...');
  
  // Simulate official webhook format
  if (!await simulateOfficialWebhook()) {
    console.error('❌ Test failed at webhook simulation step');
    return;
  }
  
  console.log('✅ Webhook test completed!');
}

// Run the test
runTest().catch(error => {
  console.error('❌ Unhandled test error:', error);
});