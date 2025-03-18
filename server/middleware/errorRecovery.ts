
import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

export async function errorRecoveryMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err.message.includes('session expired') || err.message.includes('invalid token')) {
    try {
      // Clear invalid session
      req.session.destroy((destroyErr) => {
        if (destroyErr) console.error('Error destroying session:', destroyErr);
      });
      
      return res.status(401).json({
        success: false,
        message: 'Session expired, please login again',
        code: 'SESSION_EXPIRED'
      });
    } catch (recoveryError) {
      console.error('Error in recovery middleware:', recoveryError);
    }
  }
  next(err);
}
