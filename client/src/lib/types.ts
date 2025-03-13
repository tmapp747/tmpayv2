// User types
export interface User {
  id: number;
  username: string;
  email?: string;
  balance: string | number;
  pendingBalance: string | number;
  isVip: boolean;
  casinoId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Transaction types
export interface Transaction {
  id: number;
  userId: number;
  type: 'deposit' | 'withdraw' | 'transfer';
  method: 'gcash_qr' | 'bank_transfer' | 'crypto' | string;
  amount: string | number;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  paymentReference?: string;
  transactionId?: string;
  casinoReference?: string;
  metadata?: Record<string, any>;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// QR Payment types
export interface QrPayment {
  id: number;
  userId: number;
  transactionId: number;
  qrCodeData: string;
  amount: string | number;
  expiresAt: string | Date;
  directPayReference?: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  createdAt: string | Date;
  updatedAt: string | Date;
}

// API Request types
export interface GenerateQrCodeRequest {
  amount: number;
}

export interface GenerateQrCodeResponse {
  success: boolean;
  qrPayment: QrPayment;
  transaction: Transaction;
}

export interface CheckPaymentStatusResponse {
  success: boolean;
  status: string;
  qrPayment?: QrPayment;
  message?: string;
}

export interface CompletePaymentResponse {
  success: boolean;
  message: string;
  transaction: Transaction;
  newBalance: string | number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  message: string;
}

export interface GetUserInfoResponse {
  user: User;
}

export interface GetTransactionsResponse {
  transactions: Transaction[];
}

// Navigation Link type
export interface NavLink {
  path: string;
  label: string;
  icon: string;
}

// Quick Action type
export interface QuickAction {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// Deposit Amount type
export interface DepositAmountOption {
  value: number;
  label: string;
}
