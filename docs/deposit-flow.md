# GCash to Casino Deposit Flow

This document describes the complete flow for processing deposits from GCash to the 747 Casino platform.

## Overview

The deposit process consists of two main steps:
1. **GCash Payment Processing via DirectPay**: User pays via GCash using the DirectPay payment gateway
2. **Casino Balance Credit via 747 API**: System transfers funds from the top manager (Marcthepogi) to the user's casino account

## Detailed Flow

### Step 1: GCash Payment via DirectPay

1. User initiates a deposit from the website
2. Frontend calls `/api/payments/gcash/generate-qr` with the desired amount
3. Backend creates a pending transaction record
4. Backend calls DirectPay API to generate a QR code
5. Frontend displays the QR code to the user
6. User scans the QR code with their GCash app and completes the payment
7. DirectPay sends a webhook notification to our backend at `/api/webhook/directpay/payment`

### Step 2: Casino Balance Credit

1. When the webhook is received, our backend verifies the payment
2. If the payment is successful, it calls `casino747CompleteTopup` function
3. This function identifies the user by their casino client ID
4. It then calls `casino747Api.transferFunds` with:
   - Amount: The deposit amount
   - To: The user's casino client ID and username
   - From: "system" special username
   - Currency: "PHP" for Philippine Peso
   - Comment: Details about the deposit transaction

### Special "system" User Handling

The "system" username is a special case handled in `getAuthToken` method:
- When fromUsername is "system", it uses "Marcthepogi" as the top manager
- It retrieves Marcthepogi's authentication token (e726f734-0b50-4ca2-b8d7-bca385955acf)
- This token is used to authorize the transfer from Marcthepogi's account to the user's account

### Response Handling

The 747 Casino API returns a specific format on successful transfers:
```json
{ "status": 0, "message": "ok" }
```

Our system interprets this as a successful transfer and:
- Updates the transaction status to "completed"
- Updates the user's balance
- Records the transaction details for future reference

## Manager Notification System

When a deposit is successfully completed, the system automatically sends an HTML-formatted notification to the player's immediate manager:

1. The notification is triggered in two places:
   - In the `casino747CompleteTopup` function after the funds transfer succeeds
   - In the DirectPay webhook handler after confirming a successful payment

2. The notification includes detailed transaction information:
   - Player username
   - Deposit amount and currency
   - Payment method used (GCash QR, Direct GCash, Manual, etc.)
   - Transaction reference ID
   - Timestamp of the transaction
   - Status (COMPLETED)

3. The notification is sent using the `sendDepositNotification` method in `Casino747Api`:
   - Creates a beautifully formatted HTML email with card-style layout
   - Uses 747 Casino branding and styling
   - Includes a link to the casino dashboard for easy access

4. Error handling for notifications:
   - Notification errors are caught and logged but don't affect the transaction flow
   - This ensures that even if a notification fails, the transaction still completes
   - Detailed error logs are created for troubleshooting

## Error Handling

The system includes robust error handling:
- Multiple retry attempts for Casino API calls
- Detailed logging at each step of the process
- Fallback mechanisms if tokens expire or are not found
- Graceful recovery from notification failures

## Testing

A test script is available at `test-casino-transfer.ts` that can simulate the Casino API transfer part of the flow.

## Environment Variables

The following environment variables are used:
- `CASINO_TOKEN_MARCTHEPOGI`: Token for Marcthepogi (top manager)
- `CASINO_TOKEN_BOSSMARC747`: Token for Bossmarc747 (alternate top manager)
- `CASINO_TOKEN_TEAMMARC`: Token for Teammarc (alternate top manager)

If these environment variables are not set, the system falls back to hardcoded tokens for development purposes.