/**
 * Payment Methods API Routes
 * 
 * This file contains the routes for managing payment methods:
 * - Admin-managed payment methods that are available to all users
 * - User payment methods for withdrawals and receiving funds
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { insertPaymentMethodSchema, insertUserPaymentMethodSchema } from '../../shared/schema';

/**
 * Helper function to format numeric fields for database storage
 * 
 * This solves the type inconsistency between numeric/decimal fields in the database schema
 * (which may be string in PostgreSQL) and the TypeScript interface (which expects numbers).
 * 
 * @param data The data object with possible numeric fields
 * @returns The same object with formatted numeric fields
 */
function formatNumericFields(data: any): any {
  const formattedData = { ...data };
  
  // Convert numeric fields to strings to match PostgreSQL's numeric type
  if (formattedData.dailyTransferLimit !== undefined && formattedData.dailyTransferLimit !== null) {
    formattedData.dailyTransferLimit = String(formattedData.dailyTransferLimit);
  }
  
  if (formattedData.perTransactionLimit !== undefined && formattedData.perTransactionLimit !== null) {
    formattedData.perTransactionLimit = String(formattedData.perTransactionLimit);
  }
  
  return formattedData;
}

const router = Router();

// AUTH MIDDLEWARE - Already applied in main routes file

// ============== USER PAYMENT METHODS ROUTES ==============

/**
 * Get all payment methods for the current user
 */
router.get('/user/payment-methods', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userPaymentMethods = await storage.getUserPaymentMethodsByUserId(userId);
    
    return res.json({
      success: true,
      methods: userPaymentMethods
    });
  } catch (error) {
    console.error('Error fetching user payment methods:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch payment methods' });
  }
});

router.post('/user/payment-methods', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Validate the request body with enhanced schema for Philippine banking features
    const validationSchema = insertUserPaymentMethodSchema.extend({
      type: z.enum(['bank', 'wallet', 'crypto', 'instapay', 'pesonet', 'remittance', 'other']),
      name: z.string().min(2).max(50),
      accountName: z.string().min(2).max(100),
      accountNumber: z.string().min(4).max(30),
      
      // Philippine-specific fields with proper type handling for numeric fields
      instapayEnabled: z.boolean().optional(),
      pesonetEnabled: z.boolean().optional(),
      qrPhEnabled: z.boolean().optional(),
      
      // Handle both string and number inputs for numeric fields
      dailyTransferLimit: z.union([
        z.number(),
        z.string().transform(val => val === "" ? null : parseFloat(val))
      ]).nullable().optional(),
      
      perTransactionLimit: z.union([
        z.number(),
        z.string().transform(val => val === "" ? null : parseFloat(val))
      ]).nullable().optional(),
      
      // E-wallet specific fields
      eWalletProvider: z.string().nullable().optional(),
      eWalletLinkedMobile: z.string().nullable().optional(),
      
      // Remittance fields
      remittanceProvider: z.string().nullable().optional(),
      remittancePhoneNumber: z.string().nullable().optional(),
      
      // Verification fields
      verificationMethod: z.string().nullable().optional(),
      verificationStatus: z.string().optional(),
      
      // JSON fields properly handled
      verificationData: z.union([
        z.record(z.any()),
        z.string().transform(val => {
          try { return JSON.parse(val); } 
          catch { return {}; }
        })
      ]).nullable().optional(),
      
      additionalInfo: z.union([
        z.record(z.any()),
        z.string().transform(val => {
          try { return JSON.parse(val); } 
          catch { return {}; }
        })
      ]).nullable().optional(),
    });

    const validatedData = validationSchema.parse({
      ...req.body,
      userId
    });
    
    // Format numeric fields for database storage
    const formattedData = formatNumericFields(validatedData);

    // If setting as default, clear other defaults first
    if (validatedData.isDefault) {
      const userMethods = await storage.getUserPaymentMethodsByUserId(userId);
      for (const method of userMethods) {
        if (method.isDefault) {
          await storage.updateUserPaymentMethod(method.id, { isDefault: false });
        }
      }
    }

    const newMethod = await storage.createUserPaymentMethod(formattedData);
    
    return res.status(201).json({
      success: true,
      method: newMethod,
      message: 'Payment method created successfully'
    });
  } catch (error) {
    console.error('Error creating user payment method:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payment method data',
        errors: error.errors
      });
    }
    return res.status(500).json({ success: false, message: 'Failed to create payment method' });
  }
});

/**
 * Update an existing payment method for the current user
 */
router.put('/user/payment-methods/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const methodId = parseInt(req.params.id);
    if (isNaN(methodId)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method ID' });
    }

    // Check if the payment method belongs to the user
    const existingMethod = await storage.getUserPaymentMethod(methodId);
    if (!existingMethod || existingMethod.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }

    // Validate the request body with enhanced schema for Philippine banking features
    const validationSchema = z.object({
      name: z.string().min(2).max(50).optional(),
      accountName: z.string().min(2).max(100).optional(),
      accountNumber: z.string().min(4).max(30).optional(),
      
      // Bank fields
      bankName: z.string().nullable().optional(),
      bank_name: z.string().nullable().optional(), // Using both formats for compatibility
      swiftCode: z.string().nullable().optional(),
      routingNumber: z.string().nullable().optional(),
      blockchainNetwork: z.string().nullable().optional(),
      
      // Philippine-specific fields
      instapayEnabled: z.boolean().optional(),
      pesonetEnabled: z.boolean().optional(),
      qrPhEnabled: z.boolean().optional(),
      
      // Handle both string and number inputs for numeric fields
      dailyTransferLimit: z.union([
        z.number(),
        z.string().transform(val => val === "" ? null : parseFloat(val))
      ]).nullable().optional(),
      
      perTransactionLimit: z.union([
        z.number(),
        z.string().transform(val => val === "" ? null : parseFloat(val))
      ]).nullable().optional(),
      
      // E-wallet specific fields
      eWalletProvider: z.string().nullable().optional(),
      eWalletLinkedMobile: z.string().nullable().optional(),
      
      // Remittance fields
      remittanceProvider: z.string().nullable().optional(),
      remittancePhoneNumber: z.string().nullable().optional(),
      
      // Verification fields
      verificationMethod: z.string().nullable().optional(),
      verificationStatus: z.string().optional(),
      
      // JSON fields properly handled
      verificationData: z.union([
        z.record(z.any()),
        z.string().transform(val => {
          try { return JSON.parse(val); } 
          catch { return {}; }
        })
      ]).nullable().optional(),
      
      additionalInfo: z.union([
        z.record(z.any()),
        z.string().transform(val => {
          try { return JSON.parse(val); } 
          catch { return {}; }
        })
      ]).nullable().optional(),
      
      isDefault: z.boolean().optional(),
    });

    const validatedData = validationSchema.parse(req.body);
    
    // Format numeric fields for database storage
    const formattedData = formatNumericFields(validatedData);

    // If setting as default, clear other defaults first
    if (validatedData.isDefault) {
      const userMethods = await storage.getUserPaymentMethodsByUserId(userId);
      for (const method of userMethods) {
        if (method.id !== methodId && method.isDefault) {
          await storage.updateUserPaymentMethod(method.id, { isDefault: false });
        }
      }
    }

    const updatedMethod = await storage.updateUserPaymentMethod(methodId, formattedData);
    
    return res.json({
      success: true,
      method: updatedMethod,
      message: 'Payment method updated successfully'
    });
  } catch (error) {
    console.error('Error updating user payment method:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payment method data',
        errors: error.errors
      });
    }
    return res.status(500).json({ success: false, message: 'Failed to update payment method' });
  }
});

/**
 * Delete a payment method for the current user
 */
router.delete('/user/payment-methods/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const methodId = parseInt(req.params.id);
    if (isNaN(methodId)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method ID' });
    }

    // Check if the payment method belongs to the user
    const existingMethod = await storage.getUserPaymentMethod(methodId);
    if (!existingMethod || existingMethod.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }

    const deleted = await storage.deleteUserPaymentMethod(methodId);
    
    return res.json({
      success: deleted,
      message: deleted ? 'Payment method deleted successfully' : 'Failed to delete payment method'
    });
  } catch (error) {
    console.error('Error deleting user payment method:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete payment method' });
  }
});

/**
 * Set a payment method as the default for the current user
 */
router.post('/user/payment-methods/:id/default', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const methodId = parseInt(req.params.id);
    if (isNaN(methodId)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method ID' });
    }

    // Check if the payment method belongs to the user
    const existingMethod = await storage.getUserPaymentMethod(methodId);
    if (!existingMethod || existingMethod.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }

    const updatedMethod = await storage.setDefaultUserPaymentMethod(userId, methodId);
    
    return res.json({
      success: true,
      method: updatedMethod,
      message: 'Default payment method updated successfully'
    });
  } catch (error) {
    console.error('Error setting default payment method:', error);
    return res.status(500).json({ success: false, message: 'Failed to set default payment method' });
  }
});

// ============== ADMIN PAYMENT METHODS ROUTES ==============

/**
 * Get all admin-managed payment methods
 */
router.get('/payment-methods', async (req: Request, res: Response) => {
  try {
    // Filter parameters
    const type = req.query.type as string | undefined;
    const isActive = req.query.isActive !== undefined 
      ? req.query.isActive === 'true' 
      : undefined;

    const paymentMethods = await storage.getPaymentMethods(type, isActive);
    
    return res.json({
      success: true,
      methods: paymentMethods
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch payment methods' });
  }
});

/**
 * Get a specific payment method by ID
 */
router.get('/payment-methods/:id', async (req: Request, res: Response) => {
  try {
    const methodId = parseInt(req.params.id);
    if (isNaN(methodId)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method ID' });
    }

    const paymentMethod = await storage.getPaymentMethod(methodId);
    if (!paymentMethod) {
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }
    
    return res.json({
      success: true,
      method: paymentMethod
    });
  } catch (error) {
    console.error('Error fetching payment method:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch payment method' });
  }
});

export default router;