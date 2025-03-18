/**
 * Script to fix database synchronization issues with QR payments
 * 
 * This script:
 * 1. Identifies and fixes QR payment ID sequence issues
 * 2. Ensures transaction references are properly synchronized
 * 3. Validates the database state for QR payments
 */

import { db } from './server/db.js';
import { qrPayments, transactions } from './shared/schema.js';
import { sql } from 'drizzle-orm';

async function syncQrPayments() {
  try {
    console.log('Starting QR payment synchronization...');
    
    // 1. Check current sequences
    const sequenceResult = await db.execute(sql`SELECT last_value, is_called FROM qr_payments_id_seq`);
    console.log('Current QR payments sequence state:', sequenceResult.rows[0]);
    
    // 2. Get the highest ID from the qr_payments table
    const maxIdResult = await db.select({ maxId: sql`MAX(id)` }).from(qrPayments);
    const maxId = maxIdResult[0]?.maxId || 0;
    console.log('Maximum QR payment ID in database:', maxId);
    
    // 3. Reset the sequence to the max ID + 1
    if (maxId > 0) {
      await db.execute(sql`SELECT setval('qr_payments_id_seq', ${maxId}, true)`);
      console.log(`Reset QR payments sequence to ${maxId + 1}`);
    }
    
    // 4. List all QR payments
    const allQrPayments = await db.select().from(qrPayments);
    console.log(`Found ${allQrPayments.length} QR payments in database`);
    allQrPayments.forEach(qr => {
      console.log(`QR ID: ${qr.id}, Transaction ID: ${qr.transactionId}, User ID: ${qr.userId}, Status: ${qr.status}`);
    });
    
    // 5. Check for orphaned QR payments (no associated transaction)
    const orphanedQrPayments = [];
    for (const qr of allQrPayments) {
      const transaction = await db.select().from(transactions).where(sql`id = ${qr.transactionId}`);
      if (transaction.length === 0) {
        orphanedQrPayments.push(qr);
      }
    }
    
    console.log(`Found ${orphanedQrPayments.length} orphaned QR payments`);
    orphanedQrPayments.forEach(qr => {
      console.log(`Orphaned QR ID: ${qr.id}, Transaction ID: ${qr.transactionId}`);
    });
    
    // 6. Check transaction sequence
    const txSequenceResult = await db.execute(sql`SELECT last_value, is_called FROM transactions_id_seq`);
    console.log('Current transactions sequence state:', txSequenceResult.rows[0]);
    
    // 7. Get the highest ID from the transactions table
    const maxTxIdResult = await db.select({ maxId: sql`MAX(id)` }).from(transactions);
    const maxTxId = maxTxIdResult[0]?.maxId || 0;
    console.log('Maximum transaction ID in database:', maxTxId);
    
    // 8. Reset the transaction sequence to the max ID + 1
    if (maxTxId > 0) {
      await db.execute(sql`SELECT setval('transactions_id_seq', ${maxTxId}, true)`);
      console.log(`Reset transactions sequence to ${maxTxId + 1}`);
    }
    
    // 9. Summary of findings
    console.log('\nSynchronization Summary:');
    console.log('------------------------');
    console.log(`Total QR Payments: ${allQrPayments.length}`);
    console.log(`Orphaned QR Payments: ${orphanedQrPayments.length}`);
    console.log(`QR Payments Sequence Reset to: ${maxId + 1}`);
    console.log(`Transactions Sequence Reset to: ${maxTxId + 1}`);
    console.log('------------------------');
    console.log('Synchronization completed successfully!');
    
  } catch (error) {
    console.error('Error synchronizing QR payments:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
syncQrPayments();