/**
 * Test GCash QR code generation
 */

const fetch = require('node-fetch');

async function testGCashQR() {
  console.log('Testing GCash QR code generation...');
  
  try {
    // Make request to the GCash QR code generation endpoint
    const response = await fetch('http://localhost:8080/api/payments/gcash/generate-qr', {
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
testGCashQR().catch(console.error);