/**
 * Request validation middleware
 * 
 * This middleware validates incoming requests against Zod schemas
 * to ensure data integrity and security before processing.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Middleware factory that creates a validator for incoming requests
 * based on the provided Zod schema
 * 
 * @param schema The Zod schema to validate against
 * @returns Express middleware function
 */
export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate the request body against the schema
      const validatedData = await schema.parseAsync(req.body);
      
      // Replace the request body with the validated data
      req.body = validatedData;
      
      next();
    } catch (error: any) {
      // Return validation errors to the client
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors || [{ message: 'Invalid request data' }]
      });
    }
  };
};