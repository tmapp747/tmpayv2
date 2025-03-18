/**
 * API Mapper Utility
 * 
 * This utility provides functions to map between our database fields and external API fields,
 * ensuring consistent data transformation across the application.
 */

import { 
  directPayApiFields, 
  casino747ApiFields, 
  paygramApiFields, 
  manualPaymentFields,
  transactionStatusMapping,
  transactionTimelineStatusMapping
} from '../../shared/api-mapping';

/**
 * Maps DirectPay API response to our database fields
 * @param directPayResponse The response from DirectPay API
 * @returns Mapped response with our field names
 */
export function mapDirectPayResponseToDbFields(directPayResponse: Record<string, any>): Record<string, any> {
  const mappedResponse: Record<string, any> = {};
  
  for (const [directPayField, dbField] of Object.entries(directPayApiFields.responseFields)) {
    if (directPayResponse[directPayField] !== undefined) {
      mappedResponse[dbField] = directPayResponse[directPayField];
    }
  }
  
  // Map payment status if present
  if (directPayResponse.status && directPayApiFields.paymentStatusMapping[directPayResponse.status]) {
    mappedResponse.status = directPayApiFields.paymentStatusMapping[directPayResponse.status];
  }
  
  return mappedResponse;
}

/**
 * Maps our database fields to DirectPay API request format
 * @param dbFields Our database fields
 * @returns Mapped request with DirectPay field names
 */
export function mapDbFieldsToDirectPayRequest(dbFields: Record<string, any>): Record<string, any> {
  const mappedRequest: Record<string, any> = {};
  
  for (const [dbField, directPayField] of Object.entries(directPayApiFields.requestFields)) {
    if (dbFields[dbField] !== undefined) {
      mappedRequest[directPayField] = dbFields[dbField];
    }
  }
  
  return mappedRequest;
}

/**
 * Maps DirectPay webhook payload to our database fields
 * @param webhookPayload The webhook payload from DirectPay
 * @returns Mapped payload with our field names
 */
export function mapDirectPayWebhookToDbFields(webhookPayload: Record<string, any>): Record<string, any> {
  const mappedPayload: Record<string, any> = {};
  
  for (const [webhookField, dbField] of Object.entries(directPayApiFields.webhookFields)) {
    if (webhookPayload[webhookField] !== undefined) {
      mappedPayload[dbField] = webhookPayload[webhookField];
    }
  }
  
  // Map payment status if present
  if (webhookPayload.status && directPayApiFields.paymentStatusMapping[webhookPayload.status]) {
    mappedPayload.status = directPayApiFields.paymentStatusMapping[webhookPayload.status];
  }
  
  return mappedPayload;
}

/**
 * Maps 747 Casino API user response to our database fields
 * @param casinoResponse The user response from 747 Casino API
 * @returns Mapped user with our field names
 */
export function mapCasinoUserToDbFields(casinoResponse: Record<string, any>): Record<string, any> {
  const mappedUser: Record<string, any> = {};
  
  for (const [casinoField, dbField] of Object.entries(casino747ApiFields.userFields)) {
    if (casinoResponse[casinoField] !== undefined) {
      mappedUser[dbField] = casinoResponse[casinoField];
    }
  }
  
  return mappedUser;
}

/**
 * Maps our database fields to 747 Casino API deposit request format
 * @param dbFields Our database fields
 * @returns Mapped request with Casino field names
 */
export function mapDbFieldsToCasinoDeposit(dbFields: Record<string, any>): Record<string, any> {
  const mappedRequest: Record<string, any> = {};
  
  for (const [dbField, casinoField] of Object.entries(casino747ApiFields.depositFields)) {
    if (dbFields[dbField] !== undefined) {
      mappedRequest[casinoField] = dbFields[dbField];
    }
  }
  
  return mappedRequest;
}

/**
 * Maps 747 Casino API deposit response to our database fields
 * @param casinoResponse The deposit response from 747 Casino API
 * @returns Mapped response with our field names
 */
export function mapCasinoDepositResponseToDbFields(casinoResponse: Record<string, any>): Record<string, any> {
  const mappedResponse: Record<string, any> = {};
  
  for (const [casinoField, dbField] of Object.entries(casino747ApiFields.depositResponseFields)) {
    if (casinoResponse[casinoField] !== undefined) {
      mappedResponse[dbField] = casinoResponse[casinoField];
    }
  }
  
  // Map transfer status if present
  if (casinoResponse.status && casino747ApiFields.transferStatusMapping[casinoResponse.status]) {
    mappedResponse.casinoTransferStatus = casino747ApiFields.transferStatusMapping[casinoResponse.status];
  }
  
  return mappedResponse;
}

/**
 * Maps our database fields to 747 Casino API transfer request format
 * @param dbFields Our database fields
 * @returns Mapped request with Casino field names
 */
export function mapDbFieldsToCasinoTransfer(dbFields: Record<string, any>): Record<string, any> {
  const mappedRequest: Record<string, any> = {};
  
  for (const [dbField, casinoField] of Object.entries(casino747ApiFields.transferFields)) {
    if (dbFields[dbField] !== undefined) {
      mappedRequest[casinoField] = dbFields[dbField];
    }
  }
  
  return mappedRequest;
}

/**
 * Maps Paygram (Telegram) API response to our database fields
 * @param paygramResponse The response from Paygram API
 * @returns Mapped response with our field names
 */
export function mapPaygramResponseToDbFields(paygramResponse: Record<string, any>): Record<string, any> {
  const mappedResponse: Record<string, any> = {};
  
  for (const [paygramField, dbField] of Object.entries(paygramApiFields.responseFields)) {
    if (paygramResponse[paygramField] !== undefined) {
      mappedResponse[dbField] = paygramResponse[paygramField];
    }
  }
  
  // Map payment status if present
  if (paygramResponse.status && paygramApiFields.paymentStatusMapping[paygramResponse.status]) {
    mappedResponse.status = paygramApiFields.paymentStatusMapping[paygramResponse.status];
  }
  
  return mappedResponse;
}

/**
 * Maps our database fields to Paygram API request format
 * @param dbFields Our database fields
 * @returns Mapped request with Paygram field names
 */
export function mapDbFieldsToPaygramRequest(dbFields: Record<string, any>): Record<string, any> {
  const mappedRequest: Record<string, any> = {};
  
  for (const [dbField, paygramField] of Object.entries(paygramApiFields.requestFields)) {
    if (dbFields[dbField] !== undefined) {
      mappedRequest[paygramField] = dbFields[dbField];
    }
  }
  
  return mappedRequest;
}

/**
 * Maps Paygram webhook payload to our database fields
 * @param webhookPayload The webhook payload from Paygram
 * @returns Mapped payload with our field names
 */
export function mapPaygramWebhookToDbFields(webhookPayload: Record<string, any>): Record<string, any> {
  const mappedPayload: Record<string, any> = {};
  
  for (const [webhookField, dbField] of Object.entries(paygramApiFields.webhookFields)) {
    if (webhookPayload[webhookField] !== undefined) {
      mappedPayload[dbField] = webhookPayload[webhookField];
    }
  }
  
  // Map payment status if present
  if (webhookPayload.status && paygramApiFields.paymentStatusMapping[webhookPayload.status]) {
    mappedPayload.status = paygramApiFields.paymentStatusMapping[webhookPayload.status];
  }
  
  return mappedPayload;
}

/**
 * Maps manual payment request to our database fields
 * @param manualPaymentRequest The manual payment request
 * @returns Mapped request with our field names
 */
export function mapManualPaymentRequestToDbFields(manualPaymentRequest: Record<string, any>): Record<string, any> {
  const mappedRequest: Record<string, any> = {};
  
  for (const [requestField, dbField] of Object.entries(manualPaymentFields.requestFields)) {
    if (manualPaymentRequest[requestField] !== undefined) {
      mappedRequest[dbField] = manualPaymentRequest[requestField];
    }
  }
  
  return mappedRequest;
}

/**
 * Generates transaction timeline entries based on status changes
 * @param currentStatus The current transaction status
 * @param previousStatus The previous transaction status (if any)
 * @param metadata Additional metadata for the timeline entry
 * @returns Timeline entry object
 */
export function generateTransactionTimelineEntry(
  currentStatus: string,
  previousStatus?: string,
  metadata?: Record<string, any>
): Record<string, any> {
  // Get timeline status mapping
  const statusInfo = transactionTimelineStatusMapping[currentStatus] || {
    label: `Status: ${currentStatus}`,
    description: `Transaction status changed to ${currentStatus}`
  };
  
  return {
    status: currentStatus,
    label: statusInfo.label,
    description: statusInfo.description,
    timestamp: new Date().toISOString(),
    metadata: metadata || {}
  };
}

/**
 * Gets the next transaction status based on current status and event
 * @param currentStatus The current transaction status
 * @param event The event that occurred (payment_completed, payment_failed, etc.)
 * @returns The next transaction status
 */
export function getNextTransactionStatus(currentStatus: string, event: string): string {
  // Define status transitions based on current status and event
  const statusTransitions: Record<string, Record<string, string>> = {
    'pending': {
      'payment_completed': 'payment_completed',
      'payment_failed': 'failed',
      'payment_expired': 'expired',
      'payment_cancelled': 'cancelled'
    },
    'processing': {
      'payment_completed': 'payment_completed',
      'payment_failed': 'failed',
      'payment_expired': 'expired',
      'payment_cancelled': 'cancelled'
    },
    'payment_completed': {
      'casino_transfer_completed': 'completed',
      'casino_transfer_failed': 'payment_completed', // Payment completed but casino transfer failed
      'refund_initiated': 'refunded'
    },
    'completed': {
      'refund_initiated': 'refunded',
      'dispute_opened': 'disputed'
    }
  };
  
  // Return next status if defined, otherwise keep current status
  return statusTransitions[currentStatus]?.[event] || currentStatus;
}