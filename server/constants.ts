/**
 * Global constants for the server application
 * 
 * This file contains all global constants used throughout the application.
 * It allows for easy configuration and ensures consistency.
 */

// Database settings
export const DB_DEBUG = false;
export const DB_CONNECTION_RETRIES = 3;
export const DB_RETRY_DELAY_MS = 5000;

// Authentication settings
export const ACCESS_TOKEN_EXPIRY = 60 * 60; // 1 hour in seconds
export const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds
export const CASINO_TOKEN_EXPIRY = 30 * 60; // 30 minutes in seconds
export const PASSWORD_SALT_ROUNDS = 10;

// Payment settings
export const QR_PAYMENT_EXPIRY_HOURS = 0.5; // 30 minutes
export const MANUAL_PAYMENT_EXPIRY_HOURS = 48; // 48 hours
export const TELEGRAM_PAYMENT_EXPIRY_HOURS = 1; // 1 hour
export const PAYMENT_REMINDER_THRESHOLD_MINUTES = 10;

// Casino API settings
export const CASINO_API_BASE_URL = 'https://bridge.747lc.com';
export const CASINO_USER_LOOKUP_URL = 'https://tmpay747.azurewebsites.net/api/Bridge/get-user';

// DirectPay API settings
export const DIRECTPAY_API_BASE_URL = 'https://direct-payph.com/api';
export const DIRECTPAY_MAX_REQUESTS = 5;
export const DIRECTPAY_REQUEST_INTERVAL_MS = 1000;

// Paygram API settings
export const PAYGRAM_API_BASE_URL = 'https://api.pay-gram.org';

// File storage settings
export const FILE_STORAGE_BASE_DIR = './public/assets';
export const FILE_STORAGE_SUB_DIRS = ['uploads', 'receipts', 'profiles', 'qrcodes'];

// Rate limiting settings
export const API_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const API_RATE_LIMIT_MAX_REQUESTS = 100;
export const AUTH_RATE_LIMIT_MAX_REQUESTS = 10;

// Global variables for the top managers in the casino system
export const DEFAULT_TOP_MANAGERS = ['Marcthepogi', 'bossmarc747', 'teammarc'];
export const DEFAULT_TOP_MANAGER = 'Marcthepogi';

// Global transaction status variables
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  DISPUTED: 'disputed'
};

// Global payment status variables
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing', 
  COMPLETED: 'completed',
  FAILED: 'failed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
};

// Casino statuses
export const CASINO_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};