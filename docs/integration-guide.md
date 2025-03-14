# TMPay Integration Guide

![TMPay Logo](../public/logo.png)

## Overview

This guide provides comprehensive information for developers integrating the TMPay e-wallet platform with the 747 Casino platform, DirectPay payment services, and Paygram crypto payment services. It covers the integration architecture, authentication methods, API usage, webhook implementation, and best practices.

## Table of Contents

1. [Integration Architecture](#integration-architecture)
2. [747 Casino Integration](#747-casino-integration)
3. [DirectPay Integration](#directpay-integration)
4. [Paygram Integration](#paygram-integration)
5. [Environment Setup](#environment-setup)
6. [Authentication and Security](#authentication-and-security)
7. [Error Handling and Resilience](#error-handling-and-resilience)
8. [Testing and Validation](#testing-and-validation)
9. [Going Live](#going-live)
10. [Support and Maintenance](#support-and-maintenance)

## Integration Architecture

The TMPay platform integrates with three primary external systems:

1. **747 Casino Platform**: For user verification, balance queries, and fund transfers
2. **DirectPay**: For GCash QR payment processing
3. **Paygram**: For PHPT and USDT cryptocurrency payments

The integration architecture follows a service-oriented approach, with dedicated modules for each external system. Communication is primarily through RESTful APIs with JSON as the data exchange format.

### Integration Principles

- **Loose Coupling**: Minimal dependencies between TMPay and external systems
- **Resilience**: Error handling, retries, and graceful degradation
- **Security**: Secure authentication and data protection
- **Observability**: Comprehensive logging and monitoring
- **Idempotence**: Safe retries for critical operations

## 747 Casino Integration

### Overview

The 747 Casino integration enables:

- Verification of casino users
- Querying user balances
- Transferring funds between TMPay and casino accounts
- Retrieving transaction history

### Authentication

The 747 Casino API uses token-based authentication with these key features:

- Each top manager (Marcthepogi, bossmarc747, teammarc) has a unique authentication token
- Tokens are stored securely in environment variables
- Token expiry handling with automatic refresh
- Hierarchical organization with top managers and immediate managers

### Code Implementation

#### Setting Up Authentication

```typescript
// Environment variables setup
export const casinoTokens = {
  Marcthepogi: process.env.CASINO_TOKEN_MARCTHEPOGI,
  bossmarc747: process.env.CASINO_TOKEN_BOSSMARC747,
  teammarc: process.env.CASINO_TOKEN_TEAMMARC
};

// Token management
private async getAuthToken(username: string): Promise<string> {
  // 1. Get user details to find the top manager
  const userDetails = await this.getUserDetails(username);
  const topManager = userDetails.topManager;
  
  if (!topManager) {
    throw new Error(`No top manager found for user: ${username}`);
  }
  
  // 2. Check for cached token
  if (this.tokenCacheMap.has(topManager)) {
    const cachedData = this.tokenCacheMap.get(topManager)!;
    if (cachedData.expiry > new Date()) {
      return cachedData.token;
    }
  }
  
  // 3. Get token from environment
  let token: string | undefined;
  switch (topManager) {
    case 'Marcthepogi':
      token = process.env.CASINO_TOKEN_MARCTHEPOGI;
      break;
    case 'bossmarc747':
      token = process.env.CASINO_TOKEN_BOSSMARC747;
      break;
    case 'teammarc':
      token = process.env.CASINO_TOKEN_TEAMMARC;
      break;
  }
  
  if (!token) {
    throw new Error(`No auth token found in environment for manager: ${topManager}`);
  }
  
  // 4. Update token expiry and cache
  const expiryDate = new Date();
  expiryDate.setMinutes(expiryDate.getMinutes() + this.tokenExpiryMinutes);
  
  this.tokenCacheMap.set(topManager, {
    token,
    expiry: expiryDate
  });
  
  return token;
}
```

#### Getting User Details

```typescript
async getUserDetails(username: string) {
  try {
    const response = await axios.get(`${this.userLookupUrl}`, {
      params: { username }
    });
    
    if (response.data && response.data.success) {
      return {
        clientId: response.data.clientId,
        username: response.data.username,
        balance: response.data.balance,
        userType: response.data.userType,
        topManager: response.data.topManager,
        immediateManager: response.data.immediateManager
      };
    } else {
      throw new Error(response.data?.message || 'Failed to get user details');
    }
  } catch (error) {
    console.error(`Error getting user details for ${username}:`, error);
    throw new Error(`Failed to get user details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

#### Transferring Funds

```typescript
async transferFunds(
  amount: number,
  toClientId: number,
  toUsername: string,
  currency: string = "PHP",
  fromUsername: string,
  comment: string = ""
) {
  try {
    // 1. Get authentication token for the from user
    const token = await this.getAuthToken(fromUsername);
    
    // 2. Make API request to transfer funds
    const response = await axios.post(`${this.baseUrl}/api/transfer`, {
      amount,
      toClientId,
      toUsername,
      currency,
      comment
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.success) {
      return {
        transactionId: response.data.transactionId,
        newBalance: response.data.newBalance,
        timestamp: response.data.timestamp
      };
    } else {
      throw new Error(response.data?.message || 'Transfer failed');
    }
  } catch (error) {
    console.error(`Error transferring funds to ${toUsername}:`, error);
    throw new Error(`Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

### Best Practices

- Always cache authentication tokens to minimize API calls
- Implement proper error handling with specific error messages
- Use a retry mechanism for transient failures
- Validate user existence before attempting fund transfers
- Store transaction IDs for reconciliation

## DirectPay Integration

### Overview

The DirectPay integration enables:

- Generating GCash QR codes for payment
- Checking payment status
- Processing payment webhooks

### Authentication

DirectPay uses a combination of authentication methods:

- CSRF token for initial access
- Session-based authentication for API calls
- Username and password credentials stored securely

### Code Implementation

#### Authentication Flow

```typescript
private async getCsrfToken(): Promise<string> {
  try {
    const response = await axios.get(`${this.baseUrl}/login`);
    const $ = cheerio.load(response.data);
    const csrfToken = $('meta[name="csrf-token"]').attr('content');
    
    if (!csrfToken) {
      throw new Error('CSRF token not found');
    }
    
    // Store cookies for session management
    if (response.headers['set-cookie']) {
      this.cookies = response.headers['set-cookie'];
      
      // Extract PHP session ID
      const sessionCookie = this.cookies.find(cookie => cookie.includes('PHPSESSID'));
      if (sessionCookie) {
        const match = sessionCookie.match(/PHPSESSID=([^;]+)/);
        if (match && match[1]) {
          this.phpSessionId = match[1];
        }
      }
    }
    
    return csrfToken;
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    throw new Error(`Failed to get CSRF token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

private async authenticate(): Promise<string> {
  try {
    // 1. Check if we have a valid token
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.token;
    }
    
    // 2. Get CSRF token first
    this.csrfToken = await this.getCsrfToken();
    
    // 3. Perform login
    const response = await axios.post(
      `${this.baseUrl}/login`,
      {
        username: this.username,
        password: this.password,
        _csrf: this.csrfToken
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': this.csrfToken,
          'Cookie': this.cookies.join('; ')
        }
      }
    );
    
    // 4. Handle response
    if (response.data && response.data.token) {
      this.token = response.data.token;
      
      // Set token expiry (30 minutes from now)
      const expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + 30);
      this.tokenExpiry = expiryDate;
      
      return this.token;
    } else {
      throw new Error('Authentication failed: No token in response');
    }
  } catch (error) {
    console.error('Authentication error:', error);
    throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

#### Generating GCash QR Code

```typescript
async generateGCashQR(amount: number, webhookUrl: string, redirectUrl: string): Promise<{
  qrCodeUrl: string;
  paymentReference: string;
  amount: number;
  expiresAt: Date;
}> {
  try {
    // 1. Ensure we're authenticated
    const token = await this.authenticate();
    
    // 2. Make API request to generate QR code
    const response = await axios.post(
      `${this.baseUrl}/generate-gcash-qr`,
      {
        amount,
        webhook_url: webhookUrl,
        redirect_url: redirectUrl
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': this.csrfToken,
          'Cookie': this.cookies.join('; ')
        }
      }
    );
    
    // 3. Handle response
    if (response.data && response.data.success) {
      // Calculate expiry (10 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);
      
      return {
        qrCodeUrl: response.data.qrCodeUrl,
        paymentReference: response.data.reference,
        amount,
        expiresAt
      };
    } else {
      throw new Error(response.data?.message || 'Failed to generate QR code');
    }
  } catch (error) {
    console.error('Error generating GCash QR:', error);
    throw new Error(`QR generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

#### Checking Payment Status

```typescript
async checkPaymentStatus(reference: string): Promise<{
  status: 'pending' | 'completed' | 'failed' | 'expired';
  paymentDetails?: any;
}> {
  try {
    // 1. Ensure we're authenticated
    const token = await this.authenticate();
    
    // 2. Make API request to check payment status
    const response = await axios.get(
      `${this.baseUrl}/payment/${reference}/status`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRF-TOKEN': this.csrfToken,
          'Cookie': this.cookies.join('; ')
        }
      }
    );
    
    // 3. Handle response
    if (response.data) {
      return {
        status: response.data.status,
        paymentDetails: response.data.details || {}
      };
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
    throw new Error(`Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

#### Processing Webhooks

In your Express route handler:

```typescript
app.post("/api/webhook/directpay/payment", async (req: Request, res: Response) => {
  try {
    // 1. Validate webhook payload
    const { reference, status, amount, timestamp } = req.body;
    
    if (!reference || !status) {
      return res.status(400).json({ success: false, message: 'Invalid webhook payload' });
    }
    
    // 2. Get the payment record
    const qrPayment = await storage.getQrPaymentByReference(reference);
    
    if (!qrPayment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    // 3. Update payment status
    if (status === 'completed') {
      // Update payment status
      await storage.updateQrPaymentStatus(qrPayment.id, 'completed');
      
      // Get the transaction
      const transaction = await storage.getTransaction(qrPayment.transactionId);
      
      if (transaction) {
        // Update transaction status
        await storage.updateTransactionStatus(transaction.id, 'completed', reference);
        
        // Get user
        const user = await storage.getUser(transaction.userId);
        
        if (user) {
          // Update user balance
          await storage.updateUserBalance(user.id, parseFloat(transaction.amount.toString()));
          
          // Complete the transaction with financial details
          await storage.completeTransaction(transaction.id, {
            paymentTimestamp: timestamp,
            completedAt: new Date()
          });
          
          // If the user has casino details, transfer funds to casino
          if (user.casinoUsername && user.casinoClientId) {
            try {
              // Transfer funds to casino
              const casinoResult = await casino747PrepareTopup(
                user.casinoUsername,
                parseFloat(transaction.amount.toString()),
                reference
              );
              
              console.log('Casino transfer result:', casinoResult);
            } catch (casinoError) {
              console.error('Failed to transfer to casino:', casinoError);
              // Still mark payment as successful, but log the casino transfer failure
            }
          }
        }
      }
    } else if (status === 'failed') {
      await storage.updateQrPaymentStatus(qrPayment.id, 'failed');
      await storage.updateTransactionStatus(qrPayment.transactionId, 'failed', reference);
    }
    
    // 4. Acknowledge webhook
    return res.status(200).json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing DirectPay webhook:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Webhook processing failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
});
```

### Best Practices

- Implement proper authentication token management with automatic refresh
- Handle webhook idempotency to prevent duplicate processing
- Validate webhook payloads for security
- Log all API interactions for debugging
- Implement timeouts for API calls to prevent hanging requests

## Paygram Integration

### Overview

The Paygram integration enables:

- Generating payment URLs for PHPT and USDT transactions
- Checking payment status
- Processing payment callbacks

### Authentication

Paygram uses API key authentication:

- API key and token required for all requests
- Callback authentication via shared secrets

### Code Implementation

#### Generating Payment URL

```typescript
async generatePaymentUrl(
  userId: string,
  amount: number,
  currency: string = "PHPT"
): Promise<{
  paymentUrl: string;
  invoiceCode: string;
  expiresAt: Date;
}> {
  try {
    // 1. Make API request to generate payment URL
    const response = await axios.post(
      `${this.baseUrl}/invoice/create`,
      {
        amount,
        currency,
        callback_url: `${this.callbackUrl}?userId=${userId}`,
        reference: `TMPAY-${userId}-${Date.now()}`
      },
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // 2. Handle response
    if (response.data && response.data.success) {
      // Calculate expiry (30 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);
      
      return {
        paymentUrl: response.data.payment_url,
        invoiceCode: response.data.invoice_code,
        expiresAt
      };
    } else {
      throw new Error(response.data?.message || 'Failed to generate payment URL');
    }
  } catch (error) {
    console.error('Error generating Paygram payment URL:', error);
    throw new Error(`Payment URL generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

#### Checking Payment Status

```typescript
async checkPaymentStatus(userId: string, invoiceCode: string): Promise<{
  status: 'pending' | 'completed' | 'failed' | 'expired';
  amount?: number;
  currency?: string;
}> {
  try {
    // 1. Make API request to check payment status
    const response = await axios.get(
      `${this.baseUrl}/invoice/${invoiceCode}/info`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );
    
    // 2. Handle response
    if (response.data) {
      return {
        status: this.mapPaygramStatus(response.data.status),
        amount: response.data.amount,
        currency: response.data.currency
      };
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error checking Paygram payment status:', error);
    throw new Error(`Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

private mapPaygramStatus(paygramStatus: string): 'pending' | 'completed' | 'failed' | 'expired' {
  switch (paygramStatus) {
    case 'paid':
      return 'completed';
    case 'unpaid':
      return 'pending';
    case 'expired':
      return 'expired';
    case 'cancelled':
      return 'failed';
    default:
      return 'pending';
  }
}
```

#### Processing Callbacks

```typescript
async processWebhook(payload: any): Promise<boolean> {
  try {
    // 1. Validate webhook payload
    if (!payload.invoice_code || !payload.status) {
      throw new Error('Invalid webhook payload');
    }
    
    // 2. Verify webhook signature (implementation depends on Paygram's requirements)
    
    // 3. Get the payment record from your database
    const telegramPayment = await storage.getTelegramPaymentByInvoiceCode(payload.invoice_code);
    
    if (!telegramPayment) {
      throw new Error('Payment not found');
    }
    
    // 4. Update payment status
    const newStatus = this.mapPaygramStatus(payload.status);
    await storage.updateTelegramPaymentStatus(telegramPayment.id, newStatus);
    
    // 5. Get and update the transaction
    const transaction = await storage.getTransaction(telegramPayment.transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    await storage.updateTransactionStatus(transaction.id, newStatus, payload.invoice_code);
    
    // 6. If payment is completed, update user balance
    if (newStatus === 'completed') {
      const user = await storage.getUser(transaction.userId);
      
      if (user) {
        // Update user balance
        await storage.updateUserCurrencyBalance(
          user.id,
          payload.currency as Currency,
          parseFloat(payload.amount)
        );
        
        // Complete the transaction
        await storage.completeTransaction(transaction.id, {
          paymentTimestamp: new Date(payload.timestamp),
          completedAt: new Date()
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error processing Paygram webhook:', error);
    return false;
  }
}
```

### Best Practices

- Always validate callback authenticity
- Store invoice codes for reconciliation
- Handle currency conversion appropriately
- Implement proper error handling
- Log all API interactions

## Environment Setup

### Environment Variables

Set up the following environment variables for integrations:

```
# DirectPay Integration
DIRECTPAY_API_URL=https://direct-payph.com/api
DIRECTPAY_USERNAME=your_username
DIRECTPAY_PASSWORD=your_password

# 747 Casino Integration
CASINO_TOKEN_MARCTHEPOGI=your_token_for_marcthepogi
CASINO_TOKEN_BOSSMARC747=your_token_for_bossmarc747
CASINO_TOKEN_TEAMMARC=your_token_for_teammarc

# Paygram Integration
PAYGRAM_API_URL=https://api.pay-gram.org
PAYGRAM_API_KEY=your_api_key
PAYGRAM_CALLBACK_URL=https://your-domain.com/api/webhook/paygram
```

### Configuration Loading

```typescript
// DirectPay configuration
export class DirectPayApi {
  private baseUrl: string;
  private username: string;
  private password: string;
  
  constructor() {
    this.baseUrl = process.env.DIRECTPAY_API_URL || 'https://direct-payph.com/api';
    this.username = process.env.DIRECTPAY_USERNAME || '';
    this.password = process.env.DIRECTPAY_PASSWORD || '';
    
    if (!this.username || !this.password) {
      console.error('DirectPay credentials not found in environment variables');
    }
    
    console.log(`DirectPay API Base URL: ${this.baseUrl}`);
  }
}

// 747 Casino configuration
export class Casino747Api {
  private baseUrl: string = 'https://bridge.747lc.com';
  private userLookupUrl: string = 'https://tmpay747.azurewebsites.net/api/Bridge/get-user';
  private tokenExpiryMinutes: number = 30;
  
  constructor() {
    // Validate environment variables
    if (!process.env.CASINO_TOKEN_MARCTHEPOGI || 
        !process.env.CASINO_TOKEN_BOSSMARC747 || 
        !process.env.CASINO_TOKEN_TEAMMARC) {
      console.warn('One or more 747 Casino tokens missing from environment variables');
    }
    
    // Initialize tokens
    this.initTokens().then(() => {
      console.log('Finished initializing casino API tokens');
    }).catch(error => {
      console.error('Failed to initialize casino API tokens:', error);
    });
  }
}
```

## Authentication and Security

### Secure Token Handling

- Store all API keys and tokens in environment variables
- Never hardcode credentials in source code
- Implement token refresh mechanisms
- Use secure storage for persistent tokens

### Error Handling

```typescript
try {
  // API operation
} catch (error) {
  if (axios.isAxiosError(error)) {
    // Network-related error
    if (error.response) {
      // Server responded with an error status
      console.error('API error response:', error.response.status, error.response.data);
      
      if (error.response.status === 401) {
        // Authentication error, clear token and retry
        this.token = null;
        this.tokenExpiry = null;
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('No response received:', error.request);
    } else {
      // Request setup error
      console.error('Error setting up request:', error.message);
    }
  } else {
    // Non-Axios error
    console.error('Non-API error:', error);
  }
  
  throw new Error(`Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
```

### Rate Limiting

Implement exponential backoff for retries:

```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if retry makes sense (don't retry client errors like 400)
      if (axios.isAxiosError(error) && error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }
      
      // Calculate backoff delay: 1s, 2s, 4s...
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}
```

## Error Handling and Resilience

### Transaction Integrity

Ensure transaction integrity with proper state management:

```typescript
async function processPayment(userId: number, amount: number): Promise<Transaction> {
  let transaction: Transaction | undefined;
  
  try {
    // 1. Create transaction record first (pending status)
    transaction = await storage.createTransaction({
      userId,
      type: 'deposit',
      method: 'gcash_qr',
      amount,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // 2. Generate QR code
    const qrResult = await directPayApi.generateGCashQR(
      amount,
      `${process.env.API_BASE_URL}/webhook/directpay/payment`,
      `${process.env.FRONTEND_URL}/payment-thank-you?reference=${transaction.id}`
    );
    
    // 3. Create QR payment record
    await storage.createQrPayment({
      userId,
      transactionId: transaction.id,
      qrCodeData: qrResult.qrCodeUrl,
      amount,
      expiresAt: qrResult.expiresAt,
      directPayReference: qrResult.paymentReference,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // 4. Update transaction with payment reference
    await storage.updateTransactionStatus(
      transaction.id,
      'pending',
      qrResult.paymentReference
    );
    
    return transaction;
  } catch (error) {
    // If we created a transaction record but something else failed,
    // mark the transaction as failed
    if (transaction) {
      await storage.updateTransactionStatus(
        transaction.id,
        'failed',
        undefined,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
    
    throw error;
  }
}
```

### Idempotency

Implement idempotency keys for critical operations:

```typescript
async function handlePaymentWebhook(reference: string, status: string): Promise<boolean> {
  // Generate a nonce based on reference and status to ensure idempotency
  const nonce = `webhook_${reference}_${status}_${Date.now()}`;
  
  // Check if this webhook has already been processed
  const existingTransaction = await storage.getTransactionByNonce(nonce);
  
  if (existingTransaction) {
    console.log(`Webhook already processed with nonce: ${nonce}`);
    return true;
  }
  
  // Process the webhook normally...
  
  // Set the nonce to mark this webhook as processed
  await storage.setTransactionNonce(transaction.id, nonce);
  
  return true;
}
```

## Testing and Validation

### Testing Endpoints

For each integration, implement test endpoints:

```typescript
// DirectPay test endpoint
app.get("/api/test/directpay/generate-qr", async (req: Request, res: Response) => {
  try {
    const amount = parseFloat(req.query.amount as string) || 100;
    const result = await directPayApi.generateGCashQR(
      amount,
      `${process.env.API_BASE_URL}/webhook/directpay/payment`,
      `${process.env.FRONTEND_URL}/payment-thank-you`
    );
    
    res.json({
      success: true,
      qrCode: result.qrCodeUrl,
      reference: result.paymentReference,
      expiryTime: result.expiresAt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 747 Casino test endpoint
app.get("/api/test/casino/user-details", async (req: Request, res: Response) => {
  try {
    const username = req.query.username as string;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username parameter is required'
      });
    }
    
    const result = await casino747Api.getUserDetails(username);
    
    res.json({
      success: true,
      userDetails: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
```

### Webhook Testing

Create a webhook simulator for testing:

```typescript
// Simulate DirectPay webhook
app.post("/api/test/simulate-webhook", async (req: Request, res: Response) => {
  try {
    const { reference, status, amount } = req.body;
    
    if (!reference || !status) {
      return res.status(400).json({
        success: false,
        message: 'Reference and status are required'
      });
    }
    
    // Create a webhook payload
    const webhookPayload = {
      reference,
      status,
      amount: amount || 100,
      timestamp: new Date().toISOString(),
      paymentDetails: {
        method: 'gcash',
        accountNumber: '09*******12'
      }
    };
    
    // Make a request to your webhook endpoint
    const webhookResponse = await axios.post(
      `${process.env.API_BASE_URL}/api/webhook/directpay/payment`,
      webhookPayload
    );
    
    res.json({
      success: true,
      webhookResponse: webhookResponse.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
```

## Going Live

### Pre-Launch Checklist

Before deploying to production:

- Ensure all API keys for production are securely configured
- Verify webhook URLs are correctly set
- Test end-to-end payment flows
- Implement monitoring for all integrations
- Set up alerts for integration failures
- Ensure database backups are configured
- Document rollback procedures

### Monitoring

Implement comprehensive logging and monitoring:

```typescript
// Middleware for API request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log request
  console.log(`${req.method} ${req.originalUrl} - Started`);
  
  // Add response listener to log completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.originalUrl} - Completed in ${duration}ms with status ${res.statusCode}`);
  });
  
  next();
});

// Track integration health
const integrationHealth = {
  directPay: {
    lastSuccess: null as Date | null,
    failureCount: 0,
    isHealthy: true
  },
  casino747: {
    lastSuccess: null as Date | null,
    failureCount: 0,
    isHealthy: true
  },
  paygram: {
    lastSuccess: null as Date | null,
    failureCount: 0,
    isHealthy: true
  }
};

// Update health status after API calls
function updateIntegrationHealth(integration: 'directPay' | 'casino747' | 'paygram', success: boolean) {
  if (success) {
    integrationHealth[integration].lastSuccess = new Date();
    integrationHealth[integration].failureCount = 0;
    integrationHealth[integration].isHealthy = true;
  } else {
    integrationHealth[integration].failureCount++;
    
    // Mark as unhealthy after 3 consecutive failures
    if (integrationHealth[integration].failureCount >= 3) {
      integrationHealth[integration].isHealthy = false;
    }
  }
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    integrations: integrationHealth,
    serverTime: new Date()
  });
});
```

## Support and Maintenance

### Troubleshooting

Common integration issues and solutions:

1. **Authentication Failures**
   - Check API credentials
   - Verify token expiration
   - Look for clock synchronization issues

2. **Webhook Issues**
   - Ensure webhook URLs are accessible
   - Check for firewalls blocking incoming requests
   - Verify payload format matches expectations

3. **Transaction Reconciliation**
   - Implement daily reconciliation process
   - Store all external transaction IDs
   - Create reconciliation reports

### Contact Information

Key contacts for each integration:

- **DirectPay Support**: support@direct-payph.com
- **747 Casino Support**: support@747lc.com
- **Paygram Support**: support@pay-gram.org

### Emergency Procedures

In case of critical integration failures:

1. **Fallback Modes**
   - Disable affected payment methods
   - Switch to manual verification mode
   - Communicate status to users

2. **Recovery Steps**
   - Identify and resolve issues
   - Run reconciliation process
   - Verify all pending transactions
   - Re-enable automated processing

---

© 2025 TMPay. All rights reserved.