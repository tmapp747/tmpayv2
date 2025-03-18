/**
 * Simple script to simulate a DirectPay webhook
 * 
 * This script simulates a DirectPay webhook callback with a SUCCESS status
 * for an existing payment reference without requiring login
 */

import axios from 'axios';

// Configuration
const paymentReference = 'ref_11b21e4de1a33b1d'; // Use the existing reference from the UI
const WEBHOOK_URL = 'http://localhost:5000/api/webhook/directpay/payment';

async function simulateWebhook() {
  console.log(`Simulating webhook for payment reference: ${paymentReference}`);
  
  // Format the webhook payload to match DirectPay's format
  const webhookPayload = {
    amount: "100",
    currency: "PHP",
    refId: paymentReference,
    invoiceNo: "Invoice_" + Date.now(),
    txnDesc: `Add Funds via GCASH QR|refId:${paymentReference}`,
    txnDate: Date.now().toString(),
    txnId: "dp_" + Date.now(),
    status: "SUCCESS",
    merchant_id: "ACw4xoKnvj52StUi"
  };
  
  try {
    console.log('Webhook payload:', JSON.stringify(webhookPayload, null, 2));
    const webhookResponse = await axios.post(WEBHOOK_URL, webhookPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Webhook response status:', webhookResponse.status);
    console.log('Webhook response data:', JSON.stringify(webhookResponse.data, null, 2));
    return webhookResponse.data;
  } catch (error) {
    console.error('Webhook simulation error:', error.response?.data || error.message);
    throw error;
  }
}

// Run the webhook simulation
simulateWebhook()
  .then(() => console.log('Webhook simulation completed successfully'))
  .catch(error => console.error('Webhook simulation failed:', error));