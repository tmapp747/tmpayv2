# Manager Notifications System

## Overview

The Manager Notifications System is a sophisticated communication mechanism built into the TMPay platform. It enables automated, real-time notifications to casino managers when important events occur, particularly successful deposits by players.

This system ensures that managers are immediately informed of financial activities within their hierarchy, allowing for prompt player support and efficient operational management.

## Notification System

The notification system operates through the 747 Casino messaging infrastructure, sending beautifully formatted HTML messages directly to the appropriate manager's inbox. The system:

- Automatically determines the correct manager in the player's hierarchy
- Formats transaction details in an easy-to-read card layout
- Includes all relevant transaction data
- Is triggered automatically upon successful deposit completion
- Works with all payment methods (GCash, Manual, Telegram, etc.)

### Technical Implementation

The notification system is implemented in the `casino747Api.ts` file under the `sendDepositNotification` method. This method handles:

1. **Dynamic recipient determination**: Identifies the correct manager based on the player's hierarchy
2. **HTML templating**: Generates a responsive HTML email template 
3. **Error handling**: Ensures notification failures don't impact core transaction processing
4. **Multi-payment support**: Adapts notification format based on payment method

## HTML Email Templates

The notification system uses HTML templates to create visually appealing, information-rich messages that display well across all devices and email clients.

### Sample Template

The notification appears as a card-like interface with the following components:

<div class="notification-sample">
  <div class="card-header">
    <div class="card-title">Deposit Completed Successfully</div>
  </div>
  
  <div class="amount">₱ 1,000.00</div>
  
  <div class="detail-row">
    <div class="detail-label">Player</div>
    <div class="detail-value">Beding1948</div>
  </div>
  
  <div class="detail-row">
    <div class="detail-label">Payment Method</div>
    <div class="detail-value">GCash QR</div>
  </div>
  
  <div class="detail-row">
    <div class="detail-label">Reference</div>
    <div class="detail-value">Beding1948_a41ae11</div>
  </div>
  
  <div class="detail-row">
    <div class="detail-label">Date & Time</div>
    <div class="detail-value">March 18, 2025 14:30:45</div>
  </div>
  
  <div class="detail-row">
    <div class="detail-label">Status</div>
    <div class="detail-value"><span class="status">Completed</span></div>
  </div>
</div>

## Message Delivery

Messages are delivered using the 747 Casino messaging API. The process flow is:

1. Deposit transaction completes successfully
2. System identifies the player's immediate manager
3. HTML notification is generated with transaction details
4. Message is sent via the `sendMessage` API endpoint
5. Manager receives the notification in their casino messaging inbox

## Configuration Options

The notification system provides several configuration options:

### Manager Selection

By default, notifications are sent to the player's immediate manager, but this can be configured to:

- Send to the top manager only
- Send to both immediate and top manager
- Send to a custom list of managers

### Notification Triggers

Notifications can be triggered by different events:

- Successful deposits (default)
- Failed deposits
- Withdrawals
- Casino transfers
- Status changes

Configure these settings in the `server/constants.ts` file under the `NOTIFICATION_SETTINGS` section.

## Troubleshooting

Common issues and their solutions:

### Notification Not Received

1. Verify the player's hierarchy information is correct
2. Check that the manager username exists and is active
3. Confirm the player has the correct `immediateManager` field value
4. Look for error logs indicating API failures

### Formatting Issues

1. Some email clients may strip HTML formatting
2. Ensure the template uses inline CSS for maximum compatibility
3. Test notifications in different email clients
4. Consider offering a plain text fallback

### API Errors

1. Check casino API authentication status
2. Verify the message content doesn't contain restricted characters
3. Ensure the message size is within acceptable limits
4. Look for API rate limiting issues

---

For more information about developing custom notifications or extending the system, please contact the development team.