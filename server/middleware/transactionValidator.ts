/**
 * Transaction validation middleware
 * 
 * This middleware validates transaction references and details
 * to ensure data integrity and prevent duplicate payments or inconsistencies.
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { transactions } from '../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Middleware to validate transaction references
 * Ensures that transaction references are unique and properly formatted
 */
export async function validateTransactionReferences(req: Request, res: Response, next: NextFunction) {
  try {
    // Check if the request body contains a reference
    if (req.body.reference) {
      const { reference } = req.body;
      
      // Check if the reference is properly formatted
      if (!reference || typeof reference !== 'string' || reference.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Invalid transaction reference format'
        });
      }
      
      // Check if the reference is already in use
      const existingTransaction = await db.select()
        .from(transactions)
        .where(eq(transactions.reference as any, reference))
        .limit(1);
      
      if (existingTransaction.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Transaction reference already exists'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Error validating transaction reference:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating transaction reference'
    });
  }
}