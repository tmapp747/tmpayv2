/**
 * Test for GCash QR endpoint integration
 * 
 * This script tests the /api/payments/gcash/generate-qr endpoint
 * which uses DirectPay API for payment processing.
 */

import axios from 'axios';
import { randomUUID } from 'crypto';

// Use the Replit domain from environment
const REPLIT_DOMAIN = process.env.REPLIT_DOMAINS || 'bed6abeb-c90d-4f2e-b734-4363a7c50906-00-24hxzyb7fi8d3.riker.replit.dev';
const BASE_URL = `https://${REPLIT_DOMAIN}`;

async function testGCashEndpoint() {
  try {
    console.log(`Testing GCash QR endpoint at ${BASE_URL}/api/payments/gcash/generate-qr`);
    
    // Set a test amount
    const amount = 100;
    
    console.log(`Test parameters:`);
    console.log(`- Amount: ${amount}`);
    
    // First try making a request without authentication
    // This should either succeed using the default user, or give a clear error message
    console.log('\nMaking request to GCash QR endpoint...');
    const response = await axios.post(`${BASE_URL}/api/payments/gcash/generate-qr`, {
      amount
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: () => true // Accept any status code
    });
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response data: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.status >= 200 && response.status < 300) {
      console.log('\nRequest successful!');
      
      const data = response.data;
      
      if (data.qrPayment) {
        console.log('QR Payment details:');
        console.log(`- QR Data: ${data.qrPayment.qrCodeData ? '(QR data available)' : '(No QR data available)'}`);
        console.log(`- DirectPay Reference: ${data.qrPayment.directPayReference}`);
        console.log(`- Pay URL: ${data.qrPayment.payUrl || '(No pay URL)'}`);
        console.log(`- Expires At: ${data.qrPayment.expiresAt}`);
      } else {
        console.warn('No QR payment data in response');
      }
      
      if (data.transaction) {
        console.log('\nTransaction details:');
        console.log(`- ID: ${data.transaction.id}`);
        console.log(`- Amount: ${data.transaction.amount}`);
        console.log(`- Status: ${data.transaction.status}`);
        console.log(`- Reference: ${data.transaction.paymentReference}`);
      } else {
        console.warn('No transaction data in response');
      }
    } else {
      console.error('Request failed!');
      
      if (response.data && response.data.message) {
        console.error(`Error message: ${response.data.message}`);
      }
      
      if (response.status === 400) {
        console.log('\nAnalyzing 400 Bad Request error...');
        
        if (response.data.qrPayment) {
          console.log('Active QR payment already exists:');
          console.log(`- ID: ${response.data.qrPayment.id}`);
          console.log(`- Amount: ${response.data.qrPayment.amount}`);
          console.log(`- Status: ${response.data.qrPayment.status}`);
          console.log(`- Created At: ${response.data.qrPayment.createdAt}`);
          console.log(`- Expires At: ${response.data.qrPayment.expiresAt}`);
        }
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Error making request:', error instanceof Error ? error.message : String(error));
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
testGCashEndpoint()
  .then(() => {
    console.log('\nTest completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed:', error);
    process.exit(1);
  });