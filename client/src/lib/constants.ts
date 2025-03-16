// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/login',
    LOGOUT: '/api/logout',
    REGISTER: '/api/register',
    VERIFY_USERNAME: '/api/auth/verify-username',
  },
  USER: {
    INFO: '/api/user/info',
    PREFERENCES: {
      GET: (key: string) => `/api/user/preferences/${key}`,
      SET: (key: string) => `/api/user/preferences/${key}`,
    },
    PREFERRED_CURRENCY: '/api/user/preferred-currency',
  },
  TRANSACTIONS: {
    LIST: '/api/transactions',
  },
  PAYMENTS: {
    GENERATE_QR: '/api/payments/gcash/generate-qr',
    CHECK_STATUS: (referenceId: string) => `/api/payments/status/${referenceId}`,
    SIMULATE_COMPLETION: '/api/payments/simulate-completion',
  },
  CASINO: {
    USER_DETAILS: '/api/casino/user-details',
    BALANCE: '/api/casino/balance',
    BALANCE_REALTIME: '/api/casino/balance-realtime',
    DEPOSIT: '/api/casino/deposit',
    WITHDRAW: '/api/casino/withdraw',
    TRANSFER: '/api/casino/transfer',
    TRANSACTIONS: (username: string) => `/api/casino/transactions/${username}`,
    SEND_MESSAGE: '/api/casino/send-message',
    USER_HIERARCHY: '/api/casino/user-hierarchy',
  }
};

// Quick action buttons
export const QUICK_ACTIONS = [
  {
    id: 'deposit',
    name: 'Deposit',
    icon: 'qrcode',
    color: 'green',
    description: 'Top up your wallet',
  },
  {
    id: 'transfer',
    name: 'Transfer',
    icon: 'exchange-alt',
    color: 'blue',
    description: 'Send to casino account',
  },
  {
    id: 'history',
    name: 'History',
    icon: 'trending-up',
    color: 'purple',
    description: 'View all transactions',
  },
  {
    id: 'casino',
    name: 'Casino',
    icon: 'coins',
    color: 'yellow',
    description: 'Play now',
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
  CASINO_DEPOSIT: 'casino_deposit',
  CASINO_WITHDRAW: 'casino_withdraw',
};

// Transaction methods
export const TRANSACTION_METHODS = {
  GCASH_QR: 'gcash_qr',
  BANK_TRANSFER: 'bank_transfer',
  CRYPTO: 'crypto',
  CASINO_TRANSFER: 'casino_transfer',
};

// Limits
export const LIMITS = {
  MIN_DEPOSIT: 100,
  MAX_DEPOSIT: 50000,
};
