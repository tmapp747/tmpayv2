
import { Request, Response, NextFunction } from 'express';
import { testConnection } from '../db';
import { storage } from '../storage';

export async function connectionHealthCheck(req: Request, res: Response, next: NextFunction) {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Database connection check failed');
      return res.status(503).json({ error: 'Database connection unavailable' });
    }
    next();
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ error: 'Service temporarily unavailable' });
  }
}
