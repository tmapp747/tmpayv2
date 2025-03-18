/**
 * Mapping configurations for external API fields to our database fields
 * 
 * This centralizes all API field mappings to ensure consistency across the application
 */

// DirectPay API Field Mappings
export const directPayApiFields = {
  // Fields for outgoing requests to DirectPay
  requestFields: {
    amount: "amount",
    reference: "reference",
    webhookUrl: "webhook_url",
    redirectUrl: "redirect_url",
    currency: "currency",
    customerName: "customer_name",
    customerEmail: "customer_email",
    customerPhone: "customer_phone",
    description: "description"
  },
  
  // Fields from DirectPay responses
  responseFields: {
    transaction_id: "directPayReference",
    pay_url: "payUrl",
    qr_code: "qrCodeData",
    amount: "amount",
    reference: "reference",
    status: "status",
    expires_at: "expiresAt",
    currency: "currency"
  },
  
  // Fields from DirectPay webhooks
  webhookFields: {
    transaction_id: "directPayReference",
    reference: "reference",
    status: "status",
    amount: "amount",
    currency: "currency",
    payment_method: "paymentMethod",
    payment_details: "paymentDetails"
  },
  
  // Status mapping from DirectPay to our system
  paymentStatusMapping: {
    "pending": "pending",
    "processing": "processing",
    "success": "payment_completed",
    "failed": "failed",
    "expired": "expired",
    "cancelled": "cancelled"
  }
};

// 747 Casino API Field Mappings
export const casino747ApiFields = {
  // User details fields mapping
  userFields: {
    clientId: "casinoClientId",
    username: "casinoUsername",
    balance: "casinoBalance",
    topManager: "topManager",
    immediateManager: "immediateManager",
    userType: "casinoUserType",
    hierarchyLevel: "hierarchyLevel"
  },
  
  // Deposit request fields mapping
  depositFields: {
    amount: "amount",
    clientId: "clientId",
    reference: "reference",
    currency: "currency",
    description: "description"
  },
  
  // Deposit response fields mapping
  depositResponseFields: {
    transactionId: "casinoTransactionId",
    reference: "casinoReference",
    status: "casinoTransferStatus",
    amount: "amount",
    currency: "currency",
    description: "description",
    timestamp: "casinoTimestamp"
  },
  
  // Transfer request fields mapping
  transferFields: {
    amount: "amount",
    fromUsername: "fromUsername",
    fromClientId: "fromClientId",
    toUsername: "toUsername",
    toClientId: "toClientId",
    currency: "currency",
    reference: "reference",
    comment: "comment"
  },
  
  // Status mapping from Casino to our system
  transferStatusMapping: {
    "pending": "pending",
    "processing": "processing",
    "completed": "completed",
    "failed": "failed",
    "cancelled": "cancelled"
  }
};

// Paygram (Telegram) API Field Mappings
export const paygramApiFields = {
  // Fields for outgoing requests to Paygram
  requestFields: {
    amount: "amount",
    userId: "user_id",
    currency: "currency",
    callbackUrl: "callback_url",
    description: "description"
  },
  
  // Fields from Paygram responses
  responseFields: {
    invoice_id: "invoiceId",
    payment_url: "payUrl",
    amount: "amount",
    currency: "currency",
    status: "status",
    expires_at: "expiresAt"
  },
  
  // Fields from Paygram webhooks
  webhookFields: {
    invoice_id: "invoiceId",
    external_id: "telegramReference",
    status: "status",
    amount: "amount",
    currency: "currency",
    user_id: "userId"
  },
  
  // Status mapping from Paygram to our system
  paymentStatusMapping: {
    "pending": "pending",
    "processing": "processing",
    "completed": "payment_completed",
    "failed": "failed",
    "cancelled": "cancelled"
  }
};

// Manual Payment Field Mappings
export const manualPaymentFields = {
  // Fields for manual payment requests
  requestFields: {
    amount: "amount",
    reference: "reference",
    paymentMethod: "paymentMethod",
    notes: "notes",
    proofImageUrl: "proofImageUrl",
    senderName: "senderName",
    senderAccount: "senderAccount",
    currency: "currency",
    receiverDetails: "receiverDetails"
  },
  
  // Status mapping for manual payments
  paymentStatusMapping: {
    "pending": "pending",
    "processing": "processing",
    "completed": "payment_completed",
    "failed": "failed",
    "expired": "expired"
  }
};

// Transaction Status Mapping for all payment types
export const transactionStatusMapping = {
  // Standard status values used across the application
  "created": "Transaction created",
  "pending": "Payment pending",
  "processing": "Payment processing",
  "payment_completed": "Payment completed",
  "completed": "Transaction completed",
  "failed": "Transaction failed",
  "expired": "Payment expired",
  "cancelled": "Transaction cancelled",
  "refunded": "Transaction refunded",
  "disputed": "Transaction disputed"
};

// Transaction Timeline Status Details
export const transactionTimelineStatusMapping = {
  // Detailed information for transaction timeline display
  "created": {
    label: "Transaction Created",
    description: "Transaction has been created and is awaiting payment"
  },
  "pending": {
    label: "Payment Pending",
    description: "Waiting for payment confirmation"
  },
  "processing": {
    label: "Payment Processing",
    description: "Payment is being processed"
  },
  "payment_completed": {
    label: "Payment Completed",
    description: "Payment has been received and confirmed"
  },
  "casino_transfer_initiated": {
    label: "Casino Transfer Initiated",
    description: "Transferring funds to casino balance"
  },
  "casino_transfer_completed": {
    label: "Casino Transfer Completed",
    description: "Funds successfully transferred to casino balance"
  },
  "casino_transfer_failed": {
    label: "Casino Transfer Failed",
    description: "Failed to transfer funds to casino balance"
  },
  "completed": {
    label: "Transaction Completed",
    description: "Transaction has been completed successfully"
  },
  "failed": {
    label: "Transaction Failed",
    description: "Transaction has failed"
  },
  "expired": {
    label: "Payment Expired",
    description: "Payment time has expired"
  },
  "cancelled": {
    label: "Transaction Cancelled",
    description: "Transaction has been cancelled"
  },
  "refunded": {
    label: "Transaction Refunded",
    description: "Transaction has been refunded to customer"
  },
  "disputed": {
    label: "Transaction Disputed",
    description: "Transaction is under dispute"
  }
};