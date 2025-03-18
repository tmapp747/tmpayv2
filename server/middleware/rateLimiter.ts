/**
 * Rate limiting middleware for protecting API endpoints
 * 
 * This middleware provides protection against brute force and DoS attacks
 * by limiting the number of requests from a single IP address.
 */

import rateLimit from 'express-rate-limit';
import { 
  API_RATE_LIMIT_WINDOW_MS, 
  API_RATE_LIMIT_MAX_REQUESTS, 
  AUTH_RATE_LIMIT_MAX_REQUESTS 
} from '../constants';

/**
 * General API rate limiter for all API endpoints
 * Protects against excessive requests to public API endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: API_RATE_LIMIT_WINDOW_MS,
  max: API_RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

/**
 * Stricter rate limiter for authentication endpoints
 * Provides additional protection against brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: API_RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' }
});
import rateLimit from 'express-rate-limit';

export const authenticatedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests' }
});

export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Payment rate limit exceeded' }
});
