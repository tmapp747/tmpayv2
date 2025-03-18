/**
 * API Field Mapping Schema
 * This file maps external API fields to our database fields for consistent integration
 */

// DirectPay API field mapping
export const directPayApiFields = {
  // Response fields from DirectPay generateGCashQR
  responseFields: {
    // DirectPay API fields -> Our DB fields
    reference: 'directPayReference', // DirectPay transaction reference
    payUrl: 'payUrl',                // Payment URL for redirecting users
    qrCodeData: 'qrCodeData',        // QR code data for display
    transactionId: 'transactionId',  // DirectPay transaction ID
    status: 'status',                // Payment status
    amount: 'amount',                // Payment amount
    expiresAt: 'expiresAt',          // Payment expiration timestamp
  },
  
  // Request fields for DirectPay generateGCashQR
  requestFields: {
    // Our fields -> DirectPay API fields
    amount: 'amount',                // Payment amount
    webhookUrl: 'webhook_url',       // Webhook URL for payment notifications
    redirectUrl: 'redirect_url',     // Redirect URL after payment
    reference: 'ref_id',             // Our reference ID
  },
  
  // DirectPay webhook payload fields
  webhookFields: {
    // DirectPay webhook -> Our DB fields
    reference: 'directPayReference', // DirectPay reference from webhook
    status: 'status',                // Payment status
    amount: 'amount',                // Payment amount
    transactionId: 'directPayTransactionId', // Their transaction ID
    processingFee: 'processingFee',  // Processing fee amount
    netAmount: 'netAmount',          // Net amount after fees
    metadata: 'metadata',            // Additional payment metadata
  },
  
  // Payment statuses from DirectPay
  paymentStatusMapping: {
    // DirectPay status -> Our status
    'pending': 'pending',
    'processing': 'processing',
    'success': 'payment_completed',
    'failed': 'failed',
    'expired': 'expired',
    'cancelled': 'cancelled',
  }
};

// 747 Casino API field mapping
export const casino747ApiFields = {
  // User fields mapping
  userFields: {
    // Casino API fields -> Our DB fields
    clientId: 'casinoClientId',      // Casino client ID
    username: 'casinoUsername',      // Casino username
    balance: 'casinoBalance',        // Casino balance
    topManager: 'topManager',        // Top manager username
    immediateManager: 'immediateManager', // Immediate manager username
    userType: 'casinoUserType',      // User type in casino system
    token: 'casinoAuthToken',        // Casino authorization token
    token_expiry: 'casinoAuthTokenExpiry', // Casino token expiry
    status: 'casinoStatus',          // Account status in casino
  },
  
  // Deposit request fields
  depositFields: {
    // Our fields -> Casino API fields
    casinoClientId: 'clientId',      // Casino client ID
    amount: 'amount',                // Deposit amount
    currency: 'currency',            // Currency code
    paymentReference: 'reference',   // Payment reference
  },
  
  // Deposit response fields
  depositResponseFields: {
    // Casino API fields -> Our DB fields
    status: 'casinoTransferStatus',  // Casino transfer status
    reference: 'casinoReference',    // Casino reference
    transactionId: 'casinoTransactionId', // Casino transaction ID
    balanceBefore: 'casinoBalanceBefore', // Balance before transaction
    balanceAfter: 'casinoBalanceAfter', // Balance after transaction
  },
  
  // Transfer fields
  transferFields: {
    // Our fields -> Casino API fields
    fromCasinoUsername: 'fromUsername', // Sender username
    toClientId: 'toClientId',        // Recipient client ID
    toUsername: 'toUsername',        // Recipient username
    amount: 'amount',                // Transfer amount
    currency: 'currency',            // Currency code
    comment: 'comment',              // Transfer comment/description
  },
  
  // Status mapping for casino transfers
  transferStatusMapping: {
    // Casino status -> Our status
    'pending': 'pending',
    'processing': 'processing',
    'success': 'completed',
    'failed': 'failed',
    'cancelled': 'cancelled'
  }
};

// Paygram (Telegram) API field mapping
export const paygramApiFields = {
  // Response fields from Paygram
  responseFields: {
    // Paygram API fields -> Our DB fields
    invoiceCode: 'telegramReference', // Telegram invoice code
    paymentUrl: 'payUrl',            // Payment URL for redirecting
    status: 'status',                // Payment status
    amount: 'amount',                // Payment amount
    currency: 'currency',            // Currency (PHPT, USDT)
    expiresAt: 'expiresAt',          // Payment expiration timestamp
  },
  
  // Request fields for Paygram
  requestFields: {
    // Our fields -> Paygram API fields
    userId: 'userId',                // User ID in our system
    amount: 'amount',                // Payment amount
    currency: 'currency',            // Currency code
    callbackUrl: 'callback_url',     // Callback URL for payment notifications
  },
  
  // Paygram webhook payload fields
  webhookFields: {
    // Paygram webhook -> Our DB fields
    invoiceCode: 'telegramReference', // Telegram invoice code
    status: 'status',                // Payment status
    amount: 'amount',                // Payment amount
    currency: 'currency',            // Currency code
    sender: 'senderAddress',         // Sender wallet address
    recipient: 'recipientAddress',   // Recipient wallet address
    txHash: 'transactionHash',       // Blockchain transaction hash
  },
  
  // Payment statuses from Paygram
  paymentStatusMapping: {
    // Paygram status -> Our status
    'pending': 'pending',
    'processing': 'processing',
    'completed': 'payment_completed',
    'failed': 'failed',
    'expired': 'expired',
  }
};

// Manual Payment field mapping
export const manualPaymentFields = {
  // Request fields for manual payments
  requestFields: {
    // Our fields -> Processing fields
    amount: 'amount',                // Payment amount
    paymentMethod: 'paymentMethod',  // Payment method (gcash, bank_transfer, etc.)
    notes: 'notes',                  // Payment notes
    reference: 'reference',          // Payment reference
    proofImageUrl: 'proofImageUrl',  // URL to uploaded receipt image
  },
  
  // Response fields from manual payments
  responseFields: {
    // Processing fields -> Our DB fields
    id: 'manualPaymentId',           // Manual payment ID
    status: 'status',                // Payment status
    adminId: 'adminId',              // Admin who approved/rejected
    adminNotes: 'adminNotes',        // Admin notes
    transactionId: 'transactionId',  // Associated transaction ID
  },
  
  // Status mapping for manual payments
  statusMapping: {
    // Admin status -> Transaction status
    'pending': 'pending',
    'approved': 'payment_completed',
    'rejected': 'failed',
  },
  
  // Payment method types
  paymentMethodTypes: [
    'gcash',
    'paymaya',
    'bank_transfer',
    'remittance',
    'other'
  ]
};

// Shared transaction status mapping
export const transactionStatusMapping = {
  // Payment status -> Transaction status
  'pending': 'pending',
  'processing': 'processing',
  'payment_completed': 'payment_completed',  // Payment received but casino transfer may be pending
  'completed': 'completed',                  // Full transaction completed including casino transfer
  'failed': 'failed',
  'expired': 'expired',
  'cancelled': 'cancelled',
  'refunded': 'refunded',
  'disputed': 'disputed',
};

// Transaction timeline status mapping
export const transactionTimelineStatusMapping = {
  'created': {
    label: 'Transaction Created',
    description: 'Payment request initiated'
  },
  'pending': {
    label: 'Payment Pending',
    description: 'Waiting for payment confirmation'
  },
  'processing': {
    label: 'Processing Payment',
    description: 'Payment is being processed'
  },
  'payment_completed': {
    label: 'Payment Completed',
    description: 'Payment received and confirmed'
  },
  'casino_transfer_pending': {
    label: 'Casino Transfer Pending',
    description: 'Payment completed, waiting for casino transfer'
  },
  'casino_transfer_processing': {
    label: 'Casino Transfer Processing',
    description: 'Casino transfer in progress'
  },
  'casino_transfer_completed': {
    label: 'Casino Transfer Completed',
    description: 'Funds successfully transferred to casino'
  },
  'casino_transfer_failed': {
    label: 'Casino Transfer Failed',
    description: 'Failed to transfer funds to casino'
  },
  'completed': {
    label: 'Transaction Completed',
    description: 'Transaction fully completed'
  },
  'failed': {
    label: 'Transaction Failed',
    description: 'Transaction failed to complete'
  },
  'expired': {
    label: 'Transaction Expired',
    description: 'Payment request expired'
  },
  'cancelled': {
    label: 'Transaction Cancelled',
    description: 'Transaction cancelled by user or system'
  },
  'refunded': {
    label: 'Transaction Refunded',
    description: 'Payment was refunded'
  },
  'disputed': {
    label: 'Transaction Disputed',
    description: 'Transaction under dispute or investigation'
  }
};