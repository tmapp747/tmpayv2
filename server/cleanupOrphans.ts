
import { db } from './db';
import { transactions, qrPayments, telegramPayments, manualPayments } from '@shared/schema';
import { sql } from 'drizzle-orm';

export async function cleanupOrphanedRecords() {
  try {
    // Get orphaned QR payments
    const orphanedQr = await db.select()
      .from(qrPayments)
      .leftJoin(transactions, sql`${qrPayments.transactionId} = ${transactions.id}`)
      .where(sql`${transactions.id} IS NULL`);

    // Get orphaned Telegram payments  
    const orphanedTelegram = await db.select()
      .from(telegramPayments)
      .leftJoin(transactions, sql`${telegramPayments.transactionId} = ${transactions.id}`)
      .where(sql`${transactions.id} IS NULL`);

    // Get orphaned Manual payments
    const orphanedManual = await db.select()
      .from(manualPayments)
      .leftJoin(transactions, sql`${manualPayments.transactionId} = ${transactions.id}`)
      .where(sql`${transactions.id} IS NULL`);

    console.log(`Found ${orphanedQr.length} orphaned QR payments`);
    console.log(`Found ${orphanedTelegram.length} orphaned Telegram payments`);
    console.log(`Found ${orphanedManual.length} orphaned Manual payments`);

    // Clean up orphaned records
    if (orphanedQr.length) await db.delete(qrPayments).where(sql`id IN (${orphanedQr.map(p => p.id)})`);
    if (orphanedTelegram.length) await db.delete(telegramPayments).where(sql`id IN (${orphanedTelegram.map(p => p.id)})`);
    if (orphanedManual.length) await db.delete(manualPayments).where(sql`id IN (${orphanedManual.map(p => p.id)})`);

    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Error cleaning up orphaned records:', error);
  }
}
