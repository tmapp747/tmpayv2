/**
 * Mapping configurations for external API fields to our database fields
 * 
 * This centralizes all API field mappings to ensure consistency across the application
 * 
 * The updated system includes:
 * 1. Field mappings for each external API to our database fields
 * 2. Status mappings for payment processing systems
 * 3. Dual-status tracking (gcashStatus and casinoStatus) for detailed transaction processing
 * 4. Timeline status mapping for visual display of transaction progress
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
  },
  
  // GCash status mapping (for dual-status tracking)
  gcashStatusMapping: {
    "pending": "processing", // GCash payment is being processed
    "processing": "processing", // GCash payment is being processed
    "success": "completed", // GCash payment completed successfully
    "failed": "failed", // GCash payment failed
    "expired": "failed", // GCash payment expired (considered failed)
    "cancelled": "failed" // GCash payment cancelled (considered failed)
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
  },
  
  // Casino status mapping (for dual-status tracking)
  casinoStatusMapping: {
    "pending": "pending", // Casino transfer is pending
    "processing": "processing", // Casino transfer is being processed
    "completed": "completed", // Casino transfer completed successfully
    "failed": "failed", // Casino transfer failed
    "cancelled": "failed" // Casino transfer cancelled (considered failed for business logic)
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
  
  // GCash status timeline entries
  "gcash_processing": {
    label: "GCash Payment Processing",
    description: "GCash payment is being processed"
  },
  "gcash_completed": {
    label: "GCash Payment Completed",
    description: "GCash payment has been successfully completed"
  },
  "gcash_failed": {
    label: "GCash Payment Failed",
    description: "GCash payment has failed"
  },
  
  // Casino status timeline entries
  "casino_pending": {
    label: "Casino Transfer Pending",
    description: "Casino transfer is pending"
  },
  "casino_processing": {
    label: "Casino Transfer Processing",
    description: "Casino transfer is being processed"
  },
  "casino_completed": {
    label: "Casino Transfer Completed",
    description: "Casino transfer has been successfully completed"
  },
  "casino_failed": {
    label: "Casino Transfer Failed",
    description: "Casino transfer has failed"
  },
  
  // Legacy status entries for backward compatibility
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
  
  // Final transaction status entries
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

/**
 * Utility functions for dual-status mapping and transaction state management
 */

/**
 * Maps a DirectPay status to our gcashStatus field
 * @param directPayStatus Status from DirectPay API
 * @returns Standardized gcashStatus value
 */
export function mapDirectPayStatusToGcashStatus(directPayStatus: string): string {
  const gcashStatus = directPayApiFields.gcashStatusMapping[directPayStatus] || 'processing';
  return gcashStatus;
}

/**
 * Maps a Casino transfer status to our casinoStatus field
 * @param casinoStatus Status from Casino API
 * @returns Standardized casinoStatus value
 */
export function mapCasinoTransferStatusToCasinoStatus(casinoStatus: string): string {
  const mappedStatus = casino747ApiFields.casinoStatusMapping[casinoStatus] || 'pending';
  return mappedStatus;
}

/**
 * Determines the overall transaction status based on GCash and Casino statuses
 * 
 * This implements the sequential status flow logic:
 * 1. GCash payment must complete before casino processing begins
 * 2. Both statuses contribute to the final transaction status
 * 
 * @param gcashStatus The current GCash payment status
 * @param casinoStatus The current Casino transfer status
 * @returns The overall transaction status
 */
export function determineTransactionStatus(gcashStatus: string, casinoStatus: string): string {
  // If GCash payment failed, the whole transaction fails regardless of casino status
  if (gcashStatus === 'failed') {
    return 'failed';
  }
  
  // If GCash is still processing, transaction is processing (waiting for payment)
  if (gcashStatus === 'processing') {
    return 'processing';
  }
  
  // If GCash is completed but casino transfer is pending/processing
  if (gcashStatus === 'completed' && ['pending', 'processing'].includes(casinoStatus)) {
    return 'payment_completed'; // Payment done but waiting for casino transfer
  }
  
  // If GCash completed and casino transfer completed
  if (gcashStatus === 'completed' && casinoStatus === 'completed') {
    return 'completed'; // The entire transaction is complete
  }
  
  // If GCash completed but casino transfer failed
  if (gcashStatus === 'completed' && casinoStatus === 'failed') {
    return 'payment_completed'; // Payment was successful but casino transfer failed
  }
  
  // Default fallback
  return 'processing';
}

/**
 * Generates timeline entries for a transaction based on its dual-status state
 * 
 * @param transaction Transaction with gcashStatus and casinoStatus fields
 * @returns Array of timeline entries with status, label, description, and timestamp
 */
export function generateTransactionTimeline(transaction: any): any[] {
  if (!transaction) return [];
  
  const timeline = [];
  
  // Add transaction created entry
  timeline.push({
    status: 'created',
    label: transactionTimelineStatusMapping.created.label,
    description: transactionTimelineStatusMapping.created.description,
    timestamp: transaction.createdAt
  });
  
  // Add GCash status entries if available
  if (transaction.gcashStatus) {
    timeline.push({
      status: `gcash_${transaction.gcashStatus}`,
      label: transactionTimelineStatusMapping[`gcash_${transaction.gcashStatus}`]?.label || `GCash ${transaction.gcashStatus}`,
      description: transactionTimelineStatusMapping[`gcash_${transaction.gcashStatus}`]?.description || `GCash payment ${transaction.gcashStatus}`,
      timestamp: transaction.updatedAt // Use last update time or specific time if available
    });
  }
  
  // Add Casino status entries if payment was completed and casino processing started
  if (transaction.gcashStatus === 'completed' && transaction.casinoStatus) {
    timeline.push({
      status: `casino_${transaction.casinoStatus}`,
      label: transactionTimelineStatusMapping[`casino_${transaction.casinoStatus}`]?.label || `Casino ${transaction.casinoStatus}`,
      description: transactionTimelineStatusMapping[`casino_${transaction.casinoStatus}`]?.description || `Casino transfer ${transaction.casinoStatus}`,
      timestamp: transaction.updatedAt // Use last update time or specific time if available
    });
  }
  
  // Add final status if transaction is completed or failed
  if (['completed', 'failed'].includes(transaction.status)) {
    timeline.push({
      status: transaction.status,
      label: transactionTimelineStatusMapping[transaction.status].label,
      description: transactionTimelineStatusMapping[transaction.status].description,
      timestamp: transaction.updatedAt
    });
  }
  
  return timeline;
}