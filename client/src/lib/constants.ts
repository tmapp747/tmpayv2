// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
  },
  USER: {
    INFO: '/api/user/info',
  },
  TRANSACTIONS: {
    LIST: '/api/transactions',
  },
  PAYMENTS: {
    GENERATE_QR: '/api/payments/gcash/generate-qr',
    CHECK_STATUS: (referenceId: string) => `/api/payments/status/${referenceId}`,
    SIMULATE_COMPLETION: '/api/payments/simulate-completion',
  }
};

// Quick action buttons
export const QUICK_ACTIONS = [
  {
    id: 'gcash_qr',
    name: 'GCash QR',
    icon: 'qrcode',
    color: 'secondary',
  },
  {
    id: 'cards',
    name: 'Cards',
    icon: 'credit-card',
    color: 'secondary',
  },
  {
    id: 'crypto',
    name: 'Crypto',
    icon: 'coins',
    color: 'secondary',
  },
  {
    id: 'more',
    name: 'More',
    icon: 'exchange-alt',
    color: 'secondary',
  },
];

// Predefined deposit amounts
export const DEPOSIT_AMOUNTS = [
  { value: 500, label: '₱500' },
  { value: 1000, label: '₱1,000' },
  { value: 2000, label: '₱2,000' },
  { value: 5000, label: '₱5,000' },
  { value: 10000, label: '₱10,000' },
  { value: 20000, label: '₱20,000' },
];

// Payment status codes
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  EXPIRED: 'expired',
};

// Transaction types
export const TRANSACTION_TYPES = {
  DEPOSIT: 'deposit',
  WITHDRAW: 'withdraw',
  TRANSFER: 'transfer',
};

// Transaction methods
export const TRANSACTION_METHODS = {
  GCASH_QR: 'gcash_qr',
  BANK_TRANSFER: 'bank_transfer',
  CRYPTO: 'crypto',
};

// Limits
export const LIMITS = {
  MIN_DEPOSIT: 100,
  MAX_DEPOSIT: 50000,
};
