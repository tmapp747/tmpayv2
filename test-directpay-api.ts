/**
 * Test for DirectPay API integration
 * 
 * This script tests the direct integration with DirectPay API 
 * for GCash QR code generation.
 */

import { directPayApi } from './server/directPayApi';

async function testDirectPay() {
  try {
    console.log('Testing DirectPay API for GCash QR code generation');
    
    // Set a test amount
    const amount = 100;
    
    // Set up webhook and redirect URLs
    const webhookUrl = 'https://tmpay747.azurewebsites.net/api/webhook/directpay/payment';
    const redirectUrl = 'https://tmpay747.azurewebsites.net/payment/thank-you';
    
    console.log('DirectPay API test parameters:');
    console.log(`- Amount: ${amount}`);
    console.log(`- Webhook URL: ${webhookUrl}`);
    console.log(`- Redirect URL: ${redirectUrl}`);
    
    // Call the DirectPay API
    console.log('Calling DirectPay API...');
    const result = await directPayApi.generateGCashQR(amount, webhookUrl, redirectUrl);
    
    // Log the result
    console.log('DirectPay API call successful!');
    console.log('Result:', JSON.stringify(result, null, 2));
    
    // Check if QR code data and payment URL are available
    console.log('\nQR Code Available:', !!result.qrCodeData);
    console.log('Reference:', result.reference);
    console.log('Payment URL:', result.payUrl);
    console.log('Expires At:', result.expiresAt);
    
    return result;
  } catch (error) {
    console.error('Error testing DirectPay API:', error instanceof Error ? error.message : String(error));
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    
    // Try to get more detailed error information
    if (error instanceof Error && 'response' in error) {
      const responseError = error as any;
      if (responseError.response) {
        console.error('Response status:', responseError.response.status);
        console.error('Response data:', responseError.response.data);
      }
    }
    
    throw error;
  }
}

// Execute the test
testDirectPay()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch(() => {
    console.error('Test failed');
    process.exit(1);
  });