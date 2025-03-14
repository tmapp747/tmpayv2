# TMPay API Documentation

![TMPay Logo](../public/logo.png)

## Overview

The TMPay API provides secure endpoints for authentication, payment processing, and casino fund transfers. This comprehensive documentation outlines all available endpoints, request/response formats, and authentication requirements.

## Base URL

```
https://api.tmpay.com
```

## Authentication

Most API endpoints require authentication using JSON Web Tokens (JWT). To authenticate:

1. Obtain a token via the login endpoint
2. Include the token in the Authorization header of subsequent requests:

```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

All API responses follow a consistent error format:

```json
{
  "success": false,
  "message": "Description of the error",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details"
  }
}
```

Common error codes:

| Code | Description |
|------|-------------|
| INVALID_TOKEN | Authentication token is invalid or expired |
| INSUFFICIENT_FUNDS | Not enough funds to complete transaction |
| INVALID_REQUEST | Request is malformed or missing required fields |
| PAYMENT_FAILED | Payment processing failed |
| RESOURCE_NOT_FOUND | Requested resource does not exist |
| UNAUTHORIZED | User not authorized to perform this action |

## API Endpoints

### Authentication

#### User Verification

```
POST /api/auth/verify-username
```

Verifies if a username exists in the 747 Casino system.

**Request Body:**

```json
{
  "username": "example_user",
  "isAgent": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "User verified successfully",
  "isAllowed": true,
  "topManager": "bossmarc747",
  "immediateManager": "Marcthepogi",
  "userType": "player",
  "clientId": 123456
}
```

#### Login

```
POST /api/auth/login
```

Authenticates a user and returns an access token.

**Request Body:**

```json
{
  "username": "example_user",
  "password": "secure_password"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "example_user",
    "balance": "1000.00",
    "pendingBalance": "0.00",
    "isVip": false,
    "casinoUsername": "example_user",
    "casinoClientId": 123456,
    "topManager": "bossmarc747",
    "casinoUserType": "player"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Logout

```
POST /api/auth/logout
```

Invalidates the current session token.

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### User Information

#### Get User Profile

```
GET /api/user/info
```

Returns the user's profile information.

**Response:**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "example_user",
    "email": "user@example.com",
    "balance": "1000.00",
    "pendingBalance": "0.00",
    "isVip": false,
    "casinoUsername": "example_user",
    "casinoClientId": 123456,
    "topManager": "bossmarc747",
    "immediateManager": "Marcthepogi",
    "casinoUserType": "player",
    "casinoBalance": "5000.00",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-02T00:00:00Z"
  }
}
```

#### Get Currency Balances

```
GET /api/user/currency-balances
```

Returns the user's balances in all supported currencies.

**Response:**

```json
{
  "success": true,
  "balances": {
    "PHP": "1000.00",
    "PHPT": "500.00",
    "USDT": "20.00"
  },
  "preferredCurrency": "PHP"
}
```

#### Update Preferred Currency

```
POST /api/user/preferred-currency
```

Updates the user's preferred currency for display and transactions.

**Request Body:**

```json
{
  "currency": "USDT"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Preferred currency updated successfully",
  "preferredCurrency": "USDT"
}
```

### Payment Operations

#### Generate GCash QR Code

```
POST /api/payments/gcash/generate-qr
```

Generates a QR code for GCash payment.

**Request Body:**

```json
{
  "amount": 500
}
```

**Response:**

```json
{
  "success": true,
  "qrPayment": {
    "id": 1,
    "userId": 1,
    "transactionId": 100,
    "qrCodeData": "data:image/png;base64,iVBORw0KGgoA...",
    "amount": "500.00",
    "expiresAt": "2023-07-15T12:30:00Z",
    "directPayReference": "DP123456789",
    "status": "pending",
    "createdAt": "2023-07-15T12:00:00Z",
    "updatedAt": "2023-07-15T12:00:00Z"
  },
  "transaction": {
    "id": 100,
    "userId": 1,
    "type": "deposit",
    "method": "gcash_qr",
    "amount": "500.00",
    "status": "pending",
    "paymentReference": "DP123456789",
    "createdAt": "2023-07-15T12:00:00Z",
    "updatedAt": "2023-07-15T12:00:00Z"
  }
}
```

#### Generate Paygram Payment

```
POST /api/payments/paygram/generate
```

Generates a payment URL for Paygram (PHPT/USDT) transactions.

**Request Body:**

```json
{
  "amount": 100,
  "currency": "PHPT"
}
```

**Response:**

```json
{
  "success": true,
  "paymentUrl": "https://pay.paygram.org/invoice/INV12345678",
  "invoiceCode": "INV12345678",
  "expiresAt": "2023-07-15T13:00:00Z",
  "transaction": {
    "id": 101,
    "userId": 1,
    "type": "deposit",
    "method": "crypto",
    "amount": "100.00",
    "status": "pending",
    "paymentReference": "INV12345678",
    "createdAt": "2023-07-15T12:05:00Z",
    "updatedAt": "2023-07-15T12:05:00Z"
  }
}
```

#### Create Manual Payment

```
POST /api/payments/manual/create
```

Initiates a manual payment process.

**Request Body:**

```json
{
  "amount": 1000,
  "paymentMethod": "bank_transfer",
  "bankAccount": "BDO",
  "notes": "Transfer from my BDO account"
}
```

**Response:**

```json
{
  "success": true,
  "manualPayment": {
    "id": 1,
    "userId": 1,
    "transactionId": 102,
    "amount": "1000.00",
    "paymentMethod": "bank_transfer",
    "reference": "MP123456789",
    "notes": "Transfer from my BDO account",
    "status": "pending",
    "createdAt": "2023-07-15T12:10:00Z",
    "updatedAt": "2023-07-15T12:10:00Z"
  },
  "transaction": {
    "id": 102,
    "userId": 1,
    "type": "deposit",
    "method": "bank_transfer",
    "amount": "1000.00",
    "status": "pending",
    "paymentReference": "MP123456789",
    "createdAt": "2023-07-15T12:10:00Z",
    "updatedAt": "2023-07-15T12:10:00Z"
  }
}
```

#### Submit Manual Payment Proof

```
POST /api/payments/manual/submit
```

Submit proof of payment for a manual payment.

**Request Body:**

```json
{
  "reference": "MP123456789",
  "proofImageUrl": "https://storage.tmpay.com/receipts/receipt123.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payment proof submitted successfully",
  "paymentStatus": "pending_review"
}
```

#### Check Payment Status

```
GET /api/payments/status/:referenceId
```

Checks the status of a payment by its reference ID.

**Response:**

```json
{
  "success": true,
  "status": "completed",
  "message": "Payment completed successfully",
  "paymentDetails": {
    "id": 1,
    "amount": "500.00",
    "method": "gcash_qr",
    "createdAt": "2023-07-15T12:00:00Z",
    "completedAt": "2023-07-15T12:05:00Z"
  }
}
```

### Casino Operations

#### Get Casino User Details

```
POST /api/casino/user-details
```

Retrieves user details from the 747 Casino system.

**Request Body:**

```json
{
  "username": "example_user"
}
```

**Response:**

```json
{
  "success": true,
  "casinoUser": {
    "clientId": 123456,
    "username": "example_user",
    "balance": "5000.00",
    "userType": "player",
    "topManager": "bossmarc747",
    "immediateManager": "Marcthepogi"
  }
}
```

#### Get Casino Balance

```
POST /api/casino/balance
```

Retrieves the user's current balance from the 747 Casino system.

**Request Body:**

```json
{
  "casinoClientId": 123456,
  "casinoUsername": "example_user"
}
```

**Response:**

```json
{
  "success": true,
  "balance": "5000.00",
  "currency": "PHP"
}
```

#### Casino Deposit

```
POST /api/casino/deposit
```

Transfers funds from the user's TMPay wallet to their 747 Casino account.

**Request Body:**

```json
{
  "casinoUsername": "example_user",
  "amount": 1000
}
```

**Response:**

```json
{
  "success": true,
  "message": "Funds transferred to casino account successfully",
  "transaction": {
    "id": 103,
    "userId": 1,
    "type": "casino_deposit",
    "method": "wallet_transfer",
    "amount": "1000.00",
    "status": "completed",
    "casinoReference": "CAS123456789",
    "casinoClientId": 123456,
    "casinoUsername": "example_user",
    "createdAt": "2023-07-15T12:20:00Z",
    "updatedAt": "2023-07-15T12:20:00Z"
  },
  "newCasinoBalance": "6000.00",
  "newBalance": "0.00"
}
```

#### Casino Withdraw

```
POST /api/casino/withdraw
```

Transfers funds from the user's 747 Casino account to their TMPay wallet.

**Request Body:**

```json
{
  "casinoUsername": "example_user",
  "amount": 1000
}
```

**Response:**

```json
{
  "success": true,
  "message": "Funds transferred from casino account successfully",
  "transaction": {
    "id": 104,
    "userId": 1,
    "type": "casino_withdraw",
    "method": "wallet_transfer",
    "amount": "1000.00",
    "status": "completed",
    "casinoReference": "CAS987654321",
    "casinoClientId": 123456,
    "casinoUsername": "example_user",
    "createdAt": "2023-07-15T12:25:00Z",
    "updatedAt": "2023-07-15T12:25:00Z"
  },
  "newCasinoBalance": "5000.00",
  "newBalance": "1000.00"
}
```

#### Casino Transfer

```
POST /api/casino/transfer
```

Transfers funds between casino users.

**Request Body:**

```json
{
  "amount": 500,
  "fromUsername": "example_user",
  "toUsername": "another_user",
  "comment": "Transfer for services"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Transfer completed successfully",
  "transaction": {
    "id": 105,
    "userId": 1,
    "type": "casino_transfer",
    "method": "casino_transfer",
    "amount": "500.00",
    "status": "completed",
    "casinoReference": "TRF123456789",
    "casinoClientId": 123456,
    "casinoUsername": "example_user",
    "destinationAddress": "another_user",
    "createdAt": "2023-07-15T12:30:00Z",
    "updatedAt": "2023-07-15T12:30:00Z"
  },
  "newBalance": "4500.00"
}
```

### Transaction Management

#### Get Transactions

```
GET /api/transactions
```

Retrieves the user's transaction history.

**Query Parameters:**

- `limit` (optional): Number of transactions to return (default: 20)
- `offset` (optional): Offset for pagination (default: 0)
- `type` (optional): Filter by transaction type
- `method` (optional): Filter by payment method
- `status` (optional): Filter by transaction status
- `startDate` (optional): Filter by start date (ISO format)
- `endDate` (optional): Filter by end date (ISO format)

**Response:**

```json
{
  "success": true,
  "transactions": [
    {
      "id": 105,
      "userId": 1,
      "type": "casino_transfer",
      "method": "casino_transfer",
      "amount": "500.00",
      "status": "completed",
      "casinoReference": "TRF123456789",
      "casinoClientId": 123456,
      "casinoUsername": "example_user",
      "destinationAddress": "another_user",
      "createdAt": "2023-07-15T12:30:00Z",
      "updatedAt": "2023-07-15T12:30:00Z"
    },
    {
      "id": 104,
      "userId": 1,
      "type": "casino_withdraw",
      "method": "wallet_transfer",
      "amount": "1000.00",
      "status": "completed",
      "casinoReference": "CAS987654321",
      "casinoClientId": 123456,
      "casinoUsername": "example_user",
      "createdAt": "2023-07-15T12:25:00Z",
      "updatedAt": "2023-07-15T12:25:00Z"
    }
    // More transactions...
  ],
  "count": 2,
  "total": 105
}
```

#### Get Casino Transactions

```
GET /api/casino/transactions/:username
```

Retrieves the user's transaction history from the 747 Casino system.

**Response:**

```json
{
  "success": true,
  "transactions": [
    {
      "id": "TRF123456789",
      "type": "transfer",
      "amount": "500.00",
      "currency": "PHP",
      "fromUsername": "example_user",
      "toUsername": "another_user",
      "comment": "Transfer for services",
      "timestamp": "2023-07-15T12:30:00Z"
    },
    {
      "id": "DEP987654321",
      "type": "deposit",
      "amount": "1000.00",
      "currency": "PHP",
      "toUsername": "example_user",
      "fromSystem": "TMPay E-Wallet",
      "timestamp": "2023-07-15T12:20:00Z"
    }
    // More transactions...
  ]
}
```

### Currency Operations

#### Get Available Currencies

```
GET /api/currencies
```

Returns all supported currencies.

**Response:**

```json
{
  "success": true,
  "currencies": ["PHP", "PHPT", "USDT"],
  "exchangeRates": {
    "PHP_PHPT": 1.0,
    "PHP_USDT": 0.018,
    "PHPT_USDT": 0.018,
    "USDT_PHP": 55.5,
    "USDT_PHPT": 55.5,
    "PHPT_PHP": 1.0
  }
}
```

#### Exchange Currency

```
POST /api/currency/exchange
```

Exchanges funds between supported currencies.

**Request Body:**

```json
{
  "fromCurrency": "PHP",
  "toCurrency": "USDT",
  "amount": 5500
}
```

**Response:**

```json
{
  "success": true,
  "message": "Currency exchanged successfully",
  "fromAmount": "5500.00",
  "toAmount": "100.00",
  "fromCurrency": "PHP",
  "toCurrency": "USDT",
  "rate": 0.018,
  "transaction": {
    "id": 106,
    "userId": 1,
    "type": "exchange",
    "method": "currency_exchange",
    "amount": "5500.00",
    "status": "completed",
    "metadata": {
      "fromCurrency": "PHP",
      "toCurrency": "USDT",
      "toAmount": "100.00",
      "rate": 0.018
    },
    "createdAt": "2023-07-15T12:35:00Z",
    "updatedAt": "2023-07-15T12:35:00Z"
  },
  "newBalances": {
    "PHP": "4500.00",
    "USDT": "120.00"
  }
}
```

## Webhook APIs

### DirectPay Payment Webhook

```
POST /api/webhook/directpay/payment
```

Webhook for receiving payment notifications from DirectPay.

**Request Body (from DirectPay):**

```json
{
  "reference": "DP123456789",
  "status": "completed",
  "amount": "500.00",
  "timestamp": "2023-07-15T12:05:00Z",
  "paymentDetails": {
    "method": "gcash",
    "accountNumber": "09*******12"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

## Admin APIs

These endpoints require admin authentication.

### Get All Users

```
GET /api/admin/users
```

Retrieves all registered users.

**Response:**

```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "username": "example_user",
      "email": "user@example.com",
      "balance": "1000.00",
      "pendingBalance": "0.00",
      "isVip": false,
      "casinoUsername": "example_user",
      "casinoClientId": 123456,
      "topManager": "bossmarc747",
      "immediateManager": "Marcthepogi",
      "casinoUserType": "player",
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-02T00:00:00Z"
    }
    // More users...
  ]
}
```

### Get Manual Payments

```
GET /api/admin/manual-payments
```

Retrieves all manual payments for administrative review.

**Response:**

```json
{
  "success": true,
  "payments": [
    {
      "id": 1,
      "userId": 1,
      "username": "example_user",
      "transactionId": 102,
      "amount": "1000.00",
      "paymentMethod": "bank_transfer",
      "reference": "MP123456789",
      "proofImageUrl": "https://storage.tmpay.com/receipts/receipt123.jpg",
      "notes": "Transfer from my BDO account",
      "adminId": null,
      "adminNotes": null,
      "status": "pending",
      "createdAt": "2023-07-15T12:10:00Z",
      "updatedAt": "2023-07-15T12:10:00Z"
    }
    // More payments...
  ]
}
```

### Update Manual Payment Status

```
POST /api/admin/manual-payment/:id/status
```

Updates the status of a manual payment.

**Request Body:**

```json
{
  "status": "approved",
  "adminNotes": "Payment verified against bank statement"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payment status updated successfully",
  "payment": {
    "id": 1,
    "userId": 1,
    "transactionId": 102,
    "amount": "1000.00",
    "paymentMethod": "bank_transfer",
    "reference": "MP123456789",
    "proofImageUrl": "https://storage.tmpay.com/receipts/receipt123.jpg",
    "notes": "Transfer from my BDO account",
    "adminId": 2,
    "adminNotes": "Payment verified against bank statement",
    "status": "approved",
    "createdAt": "2023-07-15T12:10:00Z",
    "updatedAt": "2023-07-15T12:40:00Z"
  }
}
```

## Rate Limiting

To ensure API stability, rate limits are applied:

- Authentication endpoints: 10 requests per minute per IP
- User endpoints: 60 requests per minute per user
- Payment endpoints: 20 requests per minute per user
- Admin endpoints: 100 requests per minute per admin

When a rate limit is exceeded, the API will respond with a 429 Too Many Requests status code.

## Development and Testing

For development and testing purposes, you can use the following sandbox environment:

```
https://sandbox.api.tmpay.com
```

Test accounts and credentials are available in the [Admin Guide](./admin-guide.md).

---

© 2025 TMPay. All rights reserved.