# Manager Notification System

## Overview

The Manager Notification System is an essential component of the 747 Casino E-Wallet Platform that automatically alerts managers when their players complete deposit transactions. It ensures managers are immediately informed about financial activities within their hierarchy, enabling prompt player support and efficient operational oversight.

## Features

- **Dual-Mode Operation**: Works in both production and testing modes
  - Production mode: Uses authenticated user's hierarchy information
  - Test mode: Supports direct manager specification for testing

- **Automatic Manager Determination**: 
  - Identifies the correct manager in the player's hierarchy
  - Falls back to database lookup if session data is unavailable
  - Uses API-based hierarchy lookup as a fallback
  - Provides sensible defaults when manager information is missing

- **Beautiful HTML Notifications**:
  - Mobile-responsive design
  - Brand-consistent styling
  - Clear information hierarchy
  - Includes all relevant transaction details

- **Robust Error Handling**:
  - Input parameter validation
  - Proper amount formatting
  - Date/time formatting with fallbacks
  - Request timeout protection (15 seconds)
  - Detailed error reporting

- **Comprehensive Logging**:
  - Tracks each step of the notification process
  - Provides clear error messages
  - Logs authentication token management
  - Records delivery status

## Integration Points

The notification system is triggered in several key places:

1. **In the DirectPay Webhook Handler**:
   - After confirming a successful GCash payment
   - Before marking the transaction as completed

2. **In the Manual Payment Approval Workflow**:
   - When an admin approves a manual payment
   - After funds are added to the player's wallet

3. **In the Batch Processing System**:
   - When processing previously pending transactions
   - After successfully completing a casino transfer

## Usage

### Production Mode

```typescript
// Inside an authenticated route handler where user info is available
const transactionResult = await completeTransaction(transactionId);
if (transactionResult.success) {
  await casino747Api.sendDepositNotification(
    req.user.username,
    {
      amount: parseFloat(transaction.amount),
      currency: transaction.currency || 'PHP',
      method: getMethodDisplayName(transaction.method),
      reference: transaction.paymentReference || `tx-${transaction.id}`,
      timestamp: transaction.completedAt || new Date()
    },
    undefined, // No manager override in production
    {
      // Use the authenticated user's hierarchy info
      immediateManager: req.user.immediateManager,
      topManager: req.user.topManager
    }
  );
}
```

### Testing Mode

```typescript
// For testing purposes when no authenticated user is available
await casino747Api.sendDepositNotification(
  'Athan45', // player username
  {
    amount: 100,
    currency: 'PHP',
    method: 'GCash QR Payment',
    reference: 'TEST-REF-12345',
    timestamp: new Date()
  },
  'platalyn@gmail.com' // Direct manager override for testing
);
```

## Notification Template

The notification includes the following information:

- **Player Username**: The casino username of the player
- **Amount**: The precise deposit amount with currency symbol
- **Payment Method**: The method used (GCash, Manual Bank Transfer, etc.)
- **Reference ID**: The unique transaction reference for tracking
- **Timestamp**: The date and time the deposit was completed
- **Status**: Always "Success" when the notification is sent

## Error Handling

The system includes robust error handling:

- **Authentication Failures**: If authentication token cannot be obtained, the notification is skipped but the transaction still completes
- **API Timeouts**: If the notification API doesn't respond within 15 seconds, the system logs this but doesn't block the transaction
- **Missing User Data**: If user hierarchy information is missing, the system provides defaults
- **Connection Errors**: Network or API errors are caught and logged, ensuring they don't impact the core transaction flow

## Testing

The notification system includes comprehensive testing tools:

- **test-comprehensive-notification.ts**: Unified test script supporting both test and real data modes
- **test-manager-notification.ts**: Focused test for the manager notification feature
- **test-deposit-notification-debug.ts**: Debug tool for isolating notification issues

## Configuration

The notification system uses the following environment variables:

- `CASINO_TOKEN_MARCTHEPOGI`: Authentication token for Marcthepogi account
- `CASINO_TOKEN_BOSSMARC747`: Authentication token for Bossmarc747 account
- `CASINO_TOKEN_TEAMMARC`: Authentication token for TeamMarc account

## Improvements

Future improvements to the notification system may include:

- **Notification Queue**: Implement a queue for handling notification failures with automatic retries
- **Read Receipts**: Track when managers view notifications
- **Action Buttons**: Add interactive elements to the HTML template for quick actions
- **Notification History**: Store all sent notifications for audit purposes
- **User Preferences**: Allow managers to customize notification preferences