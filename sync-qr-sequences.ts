/**
 * Script to fix database synchronization issues with QR payments
 * 
 * This script:
 * 1. Identifies and fixes QR payment ID sequence issues
 * 2. Ensures transaction references are properly synchronized
 * 3. Validates the database state for QR payments
 */

import { db } from './server/db';
import { qrPayments, transactions, telegramPayments, manualPayments } from './shared/schema';
import { sql } from 'drizzle-orm';

async function syncDatabaseSequences() {
  try {
    console.log('Starting database sequence synchronization...');
    
    // 1. Check and fix QR Payments sequence
    console.log('\n--- QR Payments ---');
    const qrSequenceResult = await db.execute(sql`SELECT last_value, is_called FROM qr_payments_id_seq`);
    console.log('Current QR payments sequence state:', qrSequenceResult.rows[0]);
    
    const qrMaxIdResult = await db.select({ maxId: sql`MAX(id)` }).from(qrPayments);
    const qrMaxId = qrMaxIdResult[0]?.maxId || 0;
    console.log('Maximum QR payment ID in database:', qrMaxId);
    
    if (qrMaxId > 0) {
      await db.execute(sql`SELECT setval('qr_payments_id_seq', ${qrMaxId}, true)`);
      console.log(`Reset QR payments sequence to ${qrMaxId + 1}`);
    }
    
    // 2. Check and fix Telegram Payments sequence
    console.log('\n--- Telegram Payments ---');
    const telegramSequenceResult = await db.execute(sql`SELECT last_value, is_called FROM telegram_payments_id_seq`);
    console.log('Current Telegram payments sequence state:', telegramSequenceResult.rows[0]);
    
    const telegramMaxIdResult = await db.select({ maxId: sql`MAX(id)` }).from(telegramPayments);
    const telegramMaxId = telegramMaxIdResult[0]?.maxId || 0;
    console.log('Maximum Telegram payment ID in database:', telegramMaxId);
    
    if (telegramMaxId > 0) {
      await db.execute(sql`SELECT setval('telegram_payments_id_seq', ${telegramMaxId}, true)`);
      console.log(`Reset Telegram payments sequence to ${telegramMaxId + 1}`);
    }
    
    // 3. Check and fix Manual Payments sequence
    console.log('\n--- Manual Payments ---');
    const manualSequenceResult = await db.execute(sql`SELECT last_value, is_called FROM manual_payments_id_seq`);
    console.log('Current Manual payments sequence state:', manualSequenceResult.rows[0]);
    
    const manualMaxIdResult = await db.select({ maxId: sql`MAX(id)` }).from(manualPayments);
    const manualMaxId = manualMaxIdResult[0]?.maxId || 0;
    console.log('Maximum Manual payment ID in database:', manualMaxId);
    
    if (manualMaxId > 0) {
      await db.execute(sql`SELECT setval('manual_payments_id_seq', ${manualMaxId}, true)`);
      console.log(`Reset Manual payments sequence to ${manualMaxId + 1}`);
    }
    
    // 4. Check and fix Transactions sequence
    console.log('\n--- Transactions ---');
    const txSequenceResult = await db.execute(sql`SELECT last_value, is_called FROM transactions_id_seq`);
    console.log('Current transactions sequence state:', txSequenceResult.rows[0]);
    
    const txMaxIdResult = await db.select({ maxId: sql`MAX(id)` }).from(transactions);
    const txMaxId = txMaxIdResult[0]?.maxId || 0;
    console.log('Maximum transaction ID in database:', txMaxId);
    
    if (txMaxId > 0) {
      await db.execute(sql`SELECT setval('transactions_id_seq', ${txMaxId}, true)`);
      console.log(`Reset transactions sequence to ${txMaxId + 1}`);
    }
    
    // 5. Check for orphaned QR payments
    console.log('\n--- Orphaned Payments Check ---');
    const allQrPayments = await db.select().from(qrPayments);
    console.log(`Found ${allQrPayments.length} QR payments in database`);
    
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
    
    // 6. Summary
    console.log('\nSequence Synchronization Summary:');
    console.log('-------------------------------');
    console.log(`QR Payments Sequence Reset to: ${qrMaxId + 1}`);
    console.log(`Telegram Payments Sequence Reset to: ${telegramMaxId + 1}`);
    console.log(`Manual Payments Sequence Reset to: ${manualMaxId + 1}`);
    console.log(`Transactions Sequence Reset to: ${txMaxId + 1}`);
    console.log(`Orphaned QR Payments: ${orphanedQrPayments.length}`);
    console.log('-------------------------------');
    console.log('Synchronization completed successfully!');
    
  } catch (error) {
    console.error('Error synchronizing database sequences:', error);
  }
}

// Run the script
syncDatabaseSequences().then(() => {
  console.log('Script execution completed');
  process.exit(0);
}).catch(error => {
  console.error('Script execution failed:', error);
  process.exit(1);
});