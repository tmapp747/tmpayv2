import rateLimit from 'express-rate-limit';
import { API_RATE_LIMIT_WINDOW_MS, API_RATE_LIMIT_MAX_REQUESTS, AUTH_RATE_LIMIT_MAX_REQUESTS } from '../constants';

/**
 * General API rate limiter middleware
 * 
 * This limits the number of requests to the API endpoints to prevent abuse
 * Default: 100 requests per 15 minutes per IP address
 */
export const apiLimiter = rateLimit({
  windowMs: API_RATE_LIMIT_WINDOW_MS, // 15 minutes
  max: API_RATE_LIMIT_MAX_REQUESTS, // 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});

/**
 * Auth-specific rate limiter middleware
 * 
 * This limits the number of authentication requests to prevent brute force attacks
 * Default: 10 auth requests per 15 minutes per IP address
 */
export const authLimiter = rateLimit({
  windowMs: API_RATE_LIMIT_WINDOW_MS, // 15 minutes
  max: AUTH_RATE_LIMIT_MAX_REQUESTS, // 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

/**
 * Custom rate limiter factory function
 * 
 * Creates a custom rate limiter with specified parameters
 * 
 * @param windowMs Time window in milliseconds
 * @param maxRequests Maximum number of requests within the window
 * @param message Custom error message
 * @returns Rate limiter middleware
 */
export function createRateLimiter(windowMs: number, maxRequests: number, message: string) {
  return rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message
    }
  });
}