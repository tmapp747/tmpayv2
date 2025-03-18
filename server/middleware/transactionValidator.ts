
import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { transactions, qrPayments, telegramPayments, manualPayments } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function validateTransactionReferences(req: Request, res: Response, next: NextFunction) {
  const transactionId = parseInt(req.params.id || req.body.transactionId);
  
  if (!transactionId) {
    return next();
  }

  try {
    // Check transaction exists
    const transaction = await db.select().from(transactions)
      .where(eq(transactions.id, transactionId));
    
    if (!transaction.length) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Validate payment references
    const qrPayment = await db.select().from(qrPayments)
      .where(eq(qrPayments.transactionId, transactionId));
      
    const telegramPayment = await db.select().from(telegramPayments)
      .where(eq(telegramPayments.transactionId, transactionId));
      
    const manualPayment = await db.select().from(manualPayments)
      .where(eq(manualPayments.transactionId, transactionId));

    // Only one payment type should exist
    const paymentCount = [qrPayment, telegramPayment, manualPayment]
      .filter(p => p.length > 0).length;

    if (paymentCount > 1) {
      return res.status(409).json({
        success: false,
        message: 'Multiple payment references found for transaction'
      });
    }

    next();
  } catch (error) {
    console.error('Transaction validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating transaction'
    });
  }
}
