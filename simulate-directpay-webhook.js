/**
 * Script to simulate a DirectPay webhook for automated testing
 * This emulates the official DirectPay webhook format to test automatic payment processing
 * 
 * Usage: node simulate-directpay-webhook.js [referenceId] [status]
 * Example: node simulate-directpay-webhook.js ref_11b21e4de1a33b1d SUCCESS
 */

const fetch = require('node-fetch');
const baseUrl = 'http://localhost:5000';

// Use command line arguments or defaults
const referenceId = process.argv[2] || 'ref_11b21e4de1a33b1d';
const status = process.argv[3] || 'SUCCESS';

async function simulateDirectPayWebhook() {
  try {
    console.log(`🚀 Simulating DirectPay webhook for reference: ${referenceId} with status: ${status}`);
    
    // Create webhook payload matching DirectPay's official format
    const webhookPayload = {
      amount: "100",
      currency: "PHP",
      refId: referenceId,
      invoiceNo: `INV-${Date.now()}`,
      txnDesc: `Add Funds via GCASH QR|refId:${referenceId}`,
      txnDate: Date.now().toString(),
      txnId: `DP-${Date.now()}`,
      status: status,
      merchant_id: "TM747Casino"
    };
    
    console.log('📝 Webhook payload:', JSON.stringify(webhookPayload, null, 2));
    
    const response = await fetch(`${baseUrl}/api/webhook/directpay/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload)
    });
    
    const result = await response.json();
    
    console.log('🔄 Webhook response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Webhook simulation successful!');
    } else {
      console.log('❌ Webhook simulation failed:', result.message);
    }
    
    return result.success;
  } catch (error) {
    console.error('❌ Error simulating webhook:', error);
    return false;
  }
}

// Execute the webhook simulation
simulateDirectPayWebhook();