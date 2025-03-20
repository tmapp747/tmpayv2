/**
 * API Mapper Utility
 * 
 * This utility provides functions to map between our database fields and external API fields,
 * ensuring consistent data transformation across the application.
 */
import { directPayApiFields, casino747ApiFields, paygramApiFields } from '../../shared/api-mapping';

/**
 * Maps DirectPay API response to our database fields
 * @param directPayResponse The response from DirectPay API
 * @returns Mapped response with our field names
 */
export function mapDirectPayResponseToDbFields(directPayResponse: Record<string, any>): Record<string, any> {
  const mappedResponse: Record<string, any> = {};
  
  // Loop through each field mapping and apply it
  Object.entries(directPayApiFields).forEach(([ourField, directPayField]) => {
    if (directPayResponse.hasOwnProperty(directPayField)) {
      mappedResponse[ourField] = directPayResponse[directPayField];
    }
  });
  
  // Add original response as a nested object for reference
  mappedResponse.originalResponse = directPayResponse;
  
  return mappedResponse;
}

/**
 * Maps our database fields to DirectPay API request format
 * @param dbFields Our database fields
 * @returns Mapped request with DirectPay field names
 */
export function mapDbFieldsToDirectPayRequest(dbFields: Record<string, any>): Record<string, any> {
  const mappedRequest: Record<string, any> = {};
  
  // Reverse mapping from our fields to DirectPay fields
  Object.entries(directPayApiFields).forEach(([ourField, directPayField]) => {
    if (dbFields.hasOwnProperty(ourField)) {
      mappedRequest[directPayField] = dbFields[ourField];
    }
  });
  
  return mappedRequest;
}

/**
 * Maps DirectPay webhook payload to our database fields
 * @param webhookPayload The webhook payload from DirectPay
 * @returns Mapped payload with our field names
 */
export function mapDirectPayWebhookToDbFields(webhookPayload: Record<string, any>): Record<string, any> {
  const mappedPayload: Record<string, any> = {
    webhookReceivedAt: new Date().toISOString(),
    webhookPayload: webhookPayload,
  };
  
  // Extract reference ID (critical field)
  if (webhookPayload.refId) {
    mappedPayload.reference = webhookPayload.refId;
  }
  
  // Extract payment status
  if (webhookPayload.status) {
    mappedPayload.paymentStatus = webhookPayload.status;
  }
  
  // Extract transaction amount if available
  if (webhookPayload.transactionAmount) {
    mappedPayload.confirmedAmount = parseFloat(webhookPayload.transactionAmount);
  }
  
  // Extract fee if available
  if (webhookPayload.fee) {
    mappedPayload.fee = parseFloat(webhookPayload.fee);
  }
  
  // Add any additional fields from the extra object
  if (webhookPayload.extra && typeof webhookPayload.extra === 'object') {
    Object.entries(webhookPayload.extra).forEach(([key, value]) => {
      mappedPayload[`extra_${key}`] = value;
    });
  }
  
  return mappedPayload;
}

/**
 * Maps Casino 747 API response to our database fields
 * @param casinoResponse The response from Casino 747 API
 * @returns Mapped response with our field names
 */
export function mapCasino747ResponseToDbFields(casinoResponse: Record<string, any>): Record<string, any> {
  const mappedResponse: Record<string, any> = {};
  
  // Loop through each field mapping and apply it
  Object.entries(casino747ApiFields).forEach(([ourField, casinoField]) => {
    if (casinoResponse.hasOwnProperty(casinoField)) {
      mappedResponse[ourField] = casinoResponse[casinoField];
    }
  });
  
  // Add original response as a nested object for reference
  mappedResponse.originalResponse = casinoResponse;
  
  return mappedResponse;
}

/**
 * Maps Paygram API response to our database fields
 * @param paygramResponse The response from Paygram API
 * @returns Mapped response with our field names
 */
export function mapPaygramResponseToDbFields(paygramResponse: Record<string, any>): Record<string, any> {
  const mappedResponse: Record<string, any> = {};
  
  // Loop through each field mapping and apply it
  Object.entries(paygramApiFields).forEach(([ourField, paygramField]) => {
    if (paygramResponse.hasOwnProperty(paygramField)) {
      mappedResponse[ourField] = paygramResponse[paygramField];
    }
  });
  
  // Add original response as a nested object for reference
  mappedResponse.originalResponse = paygramResponse;
  
  return mappedResponse;
}

/**
 * Maps Paygram webhook payload to our database fields
 * @param webhookPayload The webhook payload from Paygram
 * @returns Mapped payload with our field names
 */
export function mapPaygramWebhookToDbFields(webhookPayload: Record<string, any>): Record<string, any> {
  const mappedPayload: Record<string, any> = {
    webhookReceivedAt: new Date().toISOString(),
    webhookPayload: webhookPayload,
  };
  
  // Extract invoice code
  if (webhookPayload.invoiceCode) {
    mappedPayload.invoiceCode = webhookPayload.invoiceCode;
  }
  
  // Extract reference ID (if available)
  if (webhookPayload.referenceId) {
    mappedPayload.reference = webhookPayload.referenceId;
  }
  
  // Extract payment status
  if (webhookPayload.status) {
    mappedPayload.paymentStatus = webhookPayload.status;
  }
  
  // Extract transaction amount if available
  if (webhookPayload.amount) {
    mappedPayload.confirmedAmount = parseFloat(webhookPayload.amount);
  }
  
  // Extract currency if available
  if (webhookPayload.currency) {
    mappedPayload.currency = webhookPayload.currency;
  }
  
  return mappedPayload;
}