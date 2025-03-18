# TMPay API Documentation

## Base URL
```
https://api.tmpay.com
```

## Authentication

Most endpoints require authentication via:
1. Session-based (browser clients)
2. Bearer token (non-browser clients)

Include token in requests:
```
Authorization: Bearer <your_jwt_token>
```

## Core Endpoints

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "example_user",
  "password": "secure_password"
}
```

Response:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "example_user",
    "balance": "1000.00",
    "isVip": false,
    "casinoUsername": "example_user",
    "casinoClientId": 123456
  },
  "message": "Login successful"
}
```

#### Verify Username
```http
POST /api/auth/verify-username

{
  "username": "example_user",
  "userType": "player"
}
```

### User Operations

#### Get User Info
```http
GET /api/user/info
```

Response:
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
```http
GET /api/user/currency-balances
```

Response:
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
```http
POST /api/user/preferred-currency

{
  "currency": "PHP"
}
```

Response:
```json
{
  "success": true,
  "message": "Preferred currency updated successfully",
  "preferredCurrency": "USDT"
}
```

### Payment Operations

#### Generate GCash QR
```http
POST /api/payments/gcash/generate-qr

{
  "amount": 500
}
```

Response:
```json
{
  "success": true,
  "qrPayment": {
    "id": 1,
    "qrCodeData": "data:image/png;base64,...",
    "payUrl": "https://pay.direct-pay.ph/...",
    "amount": "500.00",
    "status": "pending"
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
```http
POST /api/payments/paygram/generate

{
  "amount": 100,
  "currency": "PHPT"
}
```

Response:
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
```http
POST /api/payments/manual/create

{
  "amount": 1000,
  "paymentMethod": "bank_transfer",
  "notes": "BDO transfer",
  "proofImageUrl": "https://..."
}
```

Response:
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
```http
POST /api/payments/manual/submit

{
  "reference": "MP123456789",
  "proofImageUrl": "https://storage.tmpay.com/receipts/receipt123.jpg"
}
```

Response:
```json
{
  "success": true,
  "message": "Payment proof submitted successfully",
  "paymentStatus": "pending_review"
}
```

#### Check Payment Status
```http
GET /api/payments/status/:referenceId
```

Response:
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
```http
POST /api/casino/user-details

{
  "username": "example_user"
}
```

Response:
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
```http
POST /api/casino/balance

{
  "username": "example_user",
  "clientId": 123456
}
```

Response:
```json
{
  "success": true,
  "balance": "5000.00",
  "currency": "PHP"
}
```

#### Casino Deposit
```http
POST /api/casino/deposit

{
  "amount": 1000,
  "casinoUsername": "example_user",
  "casinoClientId": 123456,
  "currency": "PHP"
}
```

Response:
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
```http
POST /api/casino/withdraw

{
  "casinoUsername": "example_user",
  "amount": 1000
}
```

Response:
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
```http
POST /api/casino/transfer

{
  "amount": 500,
  "fromUsername": "example_user",
  "toUsername": "another_user",
  "comment": "Transfer for services"
}
```

Response:
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
```http
GET /api/transactions
```

Query Parameters:
- limit (optional): Number of transactions to return
- offset (optional): Offset for pagination
- type (optional): Filter by transaction type
- status (optional): Filter by status

Response:
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
```http
GET /api/casino/transactions/:username
```

Response:
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
```http
GET /api/currencies
```

Response:
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
```http
POST /api/currency/exchange

{
  "fromCurrency": "PHP",
  "toCurrency": "USDT",
  "amount": 5500
}
```

Response:
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

### Webhook APIs

#### DirectPay Payment Webhook
```http
POST /api/webhook/directpay/payment
```

Request Body (from DirectPay):
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

Response:
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

### Admin Endpoints

Requires admin role authentication.

#### Get All Users
```http
GET /api/admin/users
```

Response:
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

#### Get Manual Payments
```http
GET /api/admin/manual-payments
```

Response:
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

#### Update Manual Payment Status
```http
POST /api/admin/manual-payment/:id/status

{
  "status": "approved",
  "adminNotes": "Payment verified"
}
```

Response:
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

## Manager Notification System

The system includes an automated manager notification feature that sends HTML-formatted notifications to the immediate manager of a player when important transactions occur.

### Notification Features

- **Automatic Manager Notification**: Sends HTML-formatted deposit notifications to player managers when transactions complete
- **Integrated into Transaction Flow**: Notifications are sent at key points in the deposit flow (webhook handlers and transfer completion)
- **Responsive Design**: Card-style layout with 747 Casino branding, optimized for both mobile and desktop
- **Error Handling**: Graceful error recovery ensures transaction completion even if notification fails
- **Transaction Details**: Complete information including amount, payment method, timestamp, and reference IDs

### Notification Content

HTML-formatted notification includes:
- Player username
- Transaction amount with currency
- Payment method (GCash QR, Direct GCash, Manual payment, etc.)
- Transaction reference ID
- Timestamp
- Status badge
- Link to casino dashboard

### Implementation

While there is no direct API endpoint to trigger notifications (they're sent automatically), they're integrated at these points:
- DirectPay webhook handler - when payment is confirmed successful
- `casino747CompleteTopup` function - after funds are transferred to casino

### Example Notification Structure

```json
{
  "recipient": "manager_username", 
  "subject": "Deposit Notification for Player example_user",
  "message": "<HTML content with card-style transaction details>",
  "sentAt": "2024-03-18T13:45:22Z",
  "status": "success"
}
```

## WebSocket Events

### Payment Updates
```javascript
socket.on('payment_status', (data) => {
  // data.status: 'completed' | 'failed' | 'expired'
  // data.paymentId: string
  // data.transactionId: string
});
```

## Rate Limits

- Authentication: 10 requests/minute/IP
- User endpoints: 60 requests/minute/user
- Payment endpoints: 20 requests/minute/user
- Admin endpoints: 100 requests/minute/admin

## Error Handling

All errors follow the format:
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional details"
  }
}
```

Common error codes:
- INVALID_TOKEN
- INSUFFICIENT_FUNDS
- PAYMENT_FAILED
- UNAUTHORIZED
- RESOURCE_NOT_FOUND

## Testing

Test accounts and environment details available in docs/auth-testing.md.