// User types
export interface User {
  id: number;
  username: string;
  email?: string;
  balance: string | number;
  pendingBalance: string | number;
  isVip: boolean;
  casinoId: string;
  // 747 Casino-specific fields
  casinoUsername?: string;
  casinoClientId?: number;
  topManager?: string;
  immediateManager?: string;
  casinoUserType?: string;
  casinoBalance?: string | number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Transaction types
export interface Transaction {
  id: number;
  userId: number;
  type: 'deposit' | 'withdraw' | 'transfer' | 'casino_deposit' | 'casino_withdraw';
  method: 'gcash_qr' | 'bank_transfer' | 'crypto' | 'casino_transfer' | string;
  amount: string | number;
  status: 'pending' | 'completed' | 'failed' | 'expired' | 'payment_completed';
  paymentReference?: string;
  transactionId?: string;
  casinoReference?: string;
  // Status tracking fields
  statusUpdatedAt?: string | Date;
  statusHistory?: Array<{status: string, timestamp: string, note?: string}>;
  completedAt?: string | Date;
  // Financial tracking
  balanceBefore?: string | number;
  balanceAfter?: string | number;
  fee?: string | number;
  // 747 Casino-specific fields
  casinoClientId?: number;
  casinoUsername?: string;
  destinationAddress?: string;
  destinationNetwork?: string;
  uniqueId?: string;
  currency?: string;
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

// Casino API Request/Response types
export interface CasinoGetUserDetailsRequest {
  username: string;
}

export interface CasinoGetUserDetailsResponse {
  success: boolean;
  casinoUser: {
    clientId: number;
    username: string;
    balance: string | number;
    userType: string;
    topManager?: string;
    immediateManager?: string;
  };
  message?: string;
}

export interface CasinoBalanceRequest {
  casinoClientId: number;
  casinoUsername: string;
}

export interface CasinoBalanceResponse {
  success: boolean;
  balance: string | number;
  message?: string;
}

export interface CasinoDepositRequest {
  casinoUsername: string;
  amount: number;
}

export interface CasinoWithdrawRequest {
  casinoUsername: string;
  amount: number;
}

export interface CasinoTransferRequest {
  amount: number;
  fromUsername: string;
  toUsername: string;
  comment?: string;
}

export interface CasinoTransactionResponse {
  success: boolean;
  transaction: Transaction;
  newCasinoBalance?: string | number;
  newBalance: string | number;
  message: string;
}

export interface CasinoTransactionsRequest {
  username: string;
}

export interface CasinoTransactionsResponse {
  success: boolean;
  transactions: any[];
  message?: string;
}

export interface CasinoSendMessageRequest {
  username: string;
  subject: string;
  message: string;
}

export interface CasinoSendMessageResponse {
  success: boolean;
  messageId?: string;
  message: string;
}

export interface CasinoGetHierarchyRequest {
  username: string;
  isAgent: boolean;
}

export interface CasinoGetHierarchyResponse {
  success: boolean;
  hierarchy?: Array<{
    id: number;
    clientId: number;
    username: string;
    parentClientId: number | null;
  }>;
  user?: {
    id: number;
    clientId: number;
    username: string;
    parentClientId: number;
  };
  message: string;
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
