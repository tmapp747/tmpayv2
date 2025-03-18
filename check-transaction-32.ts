/**
 * Script to check transaction 32 details (our processed webhook transaction)
 */

import { db } from './server/db';
import { eq } from 'drizzle-orm';
import { transactions, qrPayments } from './shared/schema';

async function checkTransaction() {
  try {
    console.log('Checking details for transaction ID 32...');
    
    // Retrieve transaction with ID 32 (our recently processed one)
    const specificTransaction = await db.select().from(transactions)
      .where(eq(transactions.id, 32));
    
    if (specificTransaction.length > 0) {
      const transaction = specificTransaction[0];
      
      console.log('\n============ TRANSACTION DETAILS ============');
      console.log(`ID: ${transaction.id}`);
      console.log(`User ID: ${transaction.userId}`);
      console.log(`Type: ${transaction.type}`);
      console.log(`Method: ${transaction.method}`);
      console.log(`Amount: ${transaction.amount}`);
      console.log(`Status: ${transaction.status}`);
      console.log(`Payment Reference: ${transaction.paymentReference}`);
      
      // Extract metadata fields
      const metadata = transaction.metadata || {};
      console.log('\n============ PAYMENT STATUS DETAILS ============');
      console.log(`GCash Status: ${metadata.gcashStatus || 'N/A'}`);
      console.log(`Casino Status: ${metadata.casinoStatus || 'N/A'}`);
      console.log(`Casino Transfer Status: ${metadata.casinoTransferStatus || 'N/A'}`);
      
      // Check timestamps
      console.log('\n============ TIMESTAMPS ============');
      console.log(`Created At: ${transaction.createdAt}`);
      console.log(`Updated At: ${transaction.updatedAt}`);
      console.log(`Payment Completed At: ${metadata.paymentCompletedAt || 'N/A'}`);
      console.log(`Casino Transfer Completed At: ${metadata.casinoTransferCompletedAt || 'N/A'}`);
      
      // Check transaction IDs
      console.log('\n============ TRANSACTION IDs ============');
      console.log(`DirectPay Transaction ID: ${metadata.txId || 'N/A'}`);
      console.log(`Casino Transaction ID: ${metadata.casinoTransactionId || 'N/A'}`);
      
      // Check timeline
      console.log('\n============ TIMELINE ============');
      const timeline = metadata.timeline || [];
      if (timeline.length > 0) {
        timeline.forEach((entry: any, index: number) => {
          console.log(`${index + 1}. [${entry.status}] ${entry.label} - ${entry.timestamp}`);
          if (entry.description) {
            console.log(`   ${entry.description}`);
          }
        });
      } else {
        console.log('No timeline entries found');
      }
      
      // Also check the QR payment record
      console.log('\n============ QR PAYMENT DETAILS ============');
      const qrPaymentRecord = await db.select().from(qrPayments)
        .where(eq(qrPayments.transactionId, 32));
        
      if (qrPaymentRecord.length > 0) {
        const qrPayment = qrPaymentRecord[0];
        console.log(`QR Payment ID: ${qrPayment.id}`);
        console.log(`Reference: ${qrPayment.reference}`);
        console.log(`Amount: ${qrPayment.amount}`);
        console.log(`Status: ${qrPayment.status}`);
        console.log(`Created At: ${qrPayment.createdAt}`);
        console.log(`Updated At: ${qrPayment.updatedAt}`);
      } else {
        console.log('No QR payment record found for transaction ID 32');
      }
    } else {
      console.log('Transaction with ID 32 not found');
    }
    
    return true;
  } catch (error) {
    console.error('Error checking transaction:', error);
    return false;
  }
}

// Run the check
checkTransaction()
  .then(success => {
    if (success) {
      console.log('\nCheck completed successfully!');
      process.exit(0);
    } else {
      console.error('\nCheck failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\nUnhandled error:', error);
    process.exit(1);
  });