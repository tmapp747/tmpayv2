/**
 * Test GCash QR code generation
 */

import fetch from 'node-fetch';
import { directPayApi } from './server/directPayApi.js';
import { randomUUID } from 'crypto';

async function testDirectPayDirectly() {
  console.log('Testing DirectPay API directly...');
  
  try {
    // Generate a webhook URL that would be used in real implementation
    const webhookUrl = 'https://tmpay747.com/api/webhook/directpay/payment';
    // Generate a redirect URL for the payment completion
    const redirectUrl = 'https://tmpay747.com/payment/thank-you';
    
    // Call the DirectPay API directly
    const result = await directPayApi.generateGCashQR(
      100, // amount
      webhookUrl,
      redirectUrl
    );
    
    console.log('DirectPay API direct call result:', JSON.stringify(result, null, 2));
    
    // Log key information
    console.log('QR Code Data:', result.qrCodeData ? '(Available)' : 'Not available');
    console.log('DirectPay Reference:', result.reference);
    console.log('Payment URL:', result.payUrl);
    console.log('Expires At:', result.expiresAt);
    
    return result;
  } catch (error) {
    console.error('Error calling DirectPay API directly:', error);
    throw error;
  }
}

async function testGCashQR() {
  console.log('Testing GCash QR code generation endpoint...');
  
  try {
    // Try direct API call first to isolate if the issue is with DirectPay or our endpoint
    try {
      console.log('Attempting direct API call first...');
      await testDirectPayDirectly();
    } catch (directApiError) {
      console.error('Direct API call failed, continuing with endpoint test');
    }
    
    // Now test the endpoint
    console.log('Testing endpoint /api/payments/gcash/generate-qr');
    
    // Use the server port provided by the environment
    const serverUrl = new URL('http://localhost:8080');
    console.log(`Making request to: ${serverUrl.href}api/payments/gcash/generate-qr`);
    
    // Make request to the GCash QR code generation endpoint
    const response = await fetch(`${serverUrl.href}api/payments/gcash/generate-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 100,
      }),
    });
    
    console.log('Response status:', response.status);
    
    // Get response data
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('Error generating GCash QR code:', data.message || 'Unknown error');
      return;
    }
    
    // If successful, log QR data
    if (data.qrPayment) {
      console.log('QR code generated successfully!');
      console.log('QR data:', data.qrPayment.qrCodeData ? '(QR data available)' : '(No QR data)');
      console.log('DirectPay reference:', data.qrPayment.directPayReference);
      console.log('Pay URL:', data.qrPayment.payUrl || '(No pay URL)');
      console.log('Expires at:', data.qrPayment.expiresAt);
    } else {
      console.warn('No QR payment data in response');
    }
    
    // Log transaction data
    if (data.transaction) {
      console.log('Transaction created:');
      console.log('- ID:', data.transaction.id);
      console.log('- Amount:', data.transaction.amount);
      console.log('- Status:', data.transaction.status);
      console.log('- Reference:', data.transaction.paymentReference);
    } else {
      console.warn('No transaction data in response');
    }
  } catch (error) {
    console.error('Error making request:', error.message);
  }
}

// Run the test
try {
  await testGCashQR();
} catch (error) {
  console.error('Test failed:', error);
}