/**
 * Check details for an existing QR payment
 * This script retrieves information about the most recent QR payment
 * without generating a new one
 */

import axios from 'axios';

// API URL and reference
const API_URL = 'http://localhost:5000';
const REFERENCE_ID = 'ref_cf29739c7f2e6482'; // Reference ID from previous test

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  withCredentials: true
});

// Main function
async function checkPayment() {
  console.log(`Checking payment status for reference: ${REFERENCE_ID}`);
  
  try {
    // Get payment status
    const response = await api.get(`/api/payments/status/${REFERENCE_ID}`);
    
    console.log('=== Payment Details ===');
    console.log(`Status: ${response.data.status}`);
    
    if (response.data.qrPayment) {
      console.log('\nQR Payment Info:');
      console.log(`- Amount: PHP ${response.data.qrPayment.amount}`);
      console.log(`- Created: ${new Date(response.data.qrPayment.createdAt).toLocaleString()}`);
      console.log(`- Expires: ${new Date(response.data.qrPayment.expiresAt).toLocaleString()}`);
      
      if (response.data.qrPayment.payUrl) {
        console.log('\n=== PAYMENT URL ===');
        console.log(response.data.qrPayment.payUrl);
        console.log('===================');
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Error checking payment:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }
    return null;
  }
}

// Execute check
checkPayment()
  .then(result => {
    if (result) {
      console.log('\nSuccessfully retrieved payment information');
    } else {
      console.log('\nFailed to retrieve payment information');
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
  });