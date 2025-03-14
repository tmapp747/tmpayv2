# TMPay Administration Guide

![TMPay Logo](../public/logo.png)

## Table of Contents

1. [Introduction](#introduction)
2. [Administrator Access](#administrator-access)
3. [Admin Dashboard](#admin-dashboard)
4. [User Management](#user-management)
5. [Transaction Management](#transaction-management)
6. [Manual Payment Verification](#manual-payment-verification)
7. [System Monitoring](#system-monitoring)
8. [Configuration Management](#configuration-management)
9. [Audit and Compliance](#audit-and-compliance)
10. [Security Management](#security-management)
11. [Appendix](#appendix)

## Introduction

This guide provides detailed instructions for system administrators of the TMPay e-wallet platform. It covers essential administrative functions, security protocols, and operational procedures required to maintain and support the system effectively.

## Administrator Access

### Access Levels

TMPay has a hierarchical access control system with the following roles:

1. **Super Admin**: Full system access with configuration capabilities
2. **Admin**: Access to user management and transaction processing
3. **Support**: Limited administrative access for customer support
4. **Auditor**: Read-only access for monitoring and compliance

### Admin Accounts

Admin accounts are created through a secure provisioning process. The default Super Admin credentials are provided during system deployment.

### Login Process

1. Navigate to the admin login URL: `https://admin.tmpay.com`
2. Enter your admin credentials
3. Complete the two-factor authentication process

### Password Policy

- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, and special characters
- Changed every 30 days
- No reuse of the last 5 passwords

## Admin Dashboard

The administrative dashboard provides a comprehensive overview of system operations.

### Key Metrics

- **Active Users**: Number of users currently online
- **Daily Transactions**: Count and volume of transactions in the last 24 hours
- **Pending Approvals**: Number of manual transactions awaiting approval
- **System Status**: Health indicators for all connected services
- **Error Rate**: Percentage of failed transactions

### Navigation

The main navigation menu includes:

- **Dashboard**: Overview and key metrics
- **Users**: User management and details
- **Transactions**: Transaction history and processing
- **Payments**: Payment method management
- **Reports**: Analytics and reporting
- **Settings**: System configuration
- **Logs**: System and audit logs

## User Management

### Viewing Users

1. Navigate to the Users section from the main menu
2. View a list of all users with key information:
   - Username
   - Email
   - Balance
   - Registration date
   - Last login
   - Account status

### User Details

Click on a user to view detailed information:

- **Profile Information**: Personal details and contact information
- **Account Status**: Active, Suspended, or Locked
- **Balance Information**: Current balance, pending transactions, and history
- **Casino Account Details**: Associated casino username and client ID
- **Security Information**: Login history and security settings

### User Actions

Administrators can perform the following actions:

- **Reset Password**: Generate a temporary password for the user
- **Lock/Unlock Account**: Temporarily disable account access
- **Adjust Balance**: Manually adjust a user's balance (with appropriate authorization)
- **View Transactions**: See all transactions associated with the user
- **Add Notes**: Attach administrative notes to the user profile

### Creating Admin Users

Super Admins can create new administrator accounts:

1. Navigate to Users > Admin Users
2. Click "Add New Admin"
3. Fill in the required information:
   - Username
   - Email
   - Role assignment
   - Permission groups
4. Set initial password and security settings
5. The new admin will receive login instructions via email

## Transaction Management

### Transaction Overview

The transaction management interface provides a comprehensive view of all financial operations:

- **Recent Transactions**: Latest transactions across the platform
- **Transaction Filters**: Filter by type, status, amount, date, etc.
- **Transaction Search**: Search by reference number, username, or amount
- **Bulk Actions**: Process multiple transactions simultaneously

### Transaction Details

Each transaction record includes:

- **Transaction ID**: Unique identifier
- **User Information**: User who initiated the transaction
- **Type**: Deposit, withdrawal, transfer, casino deposit, casino withdrawal
- **Method**: Payment method used
- **Amount**: Transaction amount
- **Status**: Current status (pending, completed, failed, etc.)
- **Timestamps**: Creation and completion times
- **Reference Numbers**: Internal and external reference numbers
- **Metadata**: Additional transaction-specific data

### Manual Transaction Processing

For transactions requiring manual intervention:

1. Navigate to Transactions > Pending Approval
2. Review transaction details thoroughly
3. Verify any supporting documentation or proof of payment
4. Approve or reject the transaction with appropriate notes
5. The system will automatically update balances and notify the user

### Transaction Adjustment

In case of disputes or errors:

1. Locate the transaction in question
2. Click "Adjust Transaction"
3. Select the appropriate action:
   - Reverse transaction
   - Modify amount
   - Change status
4. Provide detailed notes explaining the adjustment
5. Submit with appropriate authorization

## Manual Payment Verification

### Verification Queue

1. Navigate to Payments > Manual Verification
2. View a list of all manual payments awaiting verification
3. Sort by amount, date, or payment method

### Verification Process

1. Select a payment to verify
2. Review the provided information:
   - User details
   - Payment amount
   - Bank/payment method
   - Reference number
   - Timestamp
3. Examine the uploaded proof of payment (receipt or screenshot)
4. Compare the payment details with the system record
5. If necessary, check the actual bank statement or transaction log
6. Make a decision:
   - Approve: Confirm the payment and release funds to the user
   - Reject: Decline the payment with a reason
   - Request More Information: Ask the user for additional proof

### Verification Guidelines

- Always verify that the amount, date, and reference number match
- Check that the account name matches the user or their registered information
- Be wary of edited or manipulated screenshots
- For large transactions (over ₱10,000), perform additional verification steps
- Document your verification process with notes

## System Monitoring

### Dashboard Monitoring

The admin dashboard displays real-time alerts for:

- Payment gateway availability
- Database connection status
- API response times
- Error rates
- Unusual transaction patterns

### Automated Alerts

Configure alert thresholds for:

1. High transaction failure rates
2. API integration errors
3. Security exceptions
4. Load and performance issues
5. Database errors

### Log Monitoring

Access system logs from the Logs section of the admin panel:

- **Application Logs**: General system operation logs
- **Transaction Logs**: Detailed transaction processing logs
- **Error Logs**: System errors and exceptions
- **Security Logs**: Authentication and security-related events
- **API Logs**: External API communication logs

## Configuration Management

### System Settings

Administrators can configure various system parameters:

- **Transaction Limits**: Minimum and maximum transaction amounts
- **Fee Structure**: Configure fees for different transaction types
- **Exchange Rates**: Update currency exchange rates
- **Timeout Settings**: Session and transaction timeout periods
- **Notification Settings**: Configure email and SMS notifications

### Payment Method Configuration

1. Navigate to Settings > Payment Methods
2. Configure available payment options:
   - GCash QR integration settings
   - Paygram API configuration
   - Bank transfer details
   - Casino transfer settings

### Integration Settings

Manage external API connections:

- **747 Casino API**: Connection settings and credentials
- **DirectPay API**: API keys and webhook configuration
- **Paygram API**: API keys and callback URLs

## Audit and Compliance

### Audit Trail

All administrative actions are logged in the audit trail:

1. Navigate to Logs > Audit Trail
2. View a chronological list of all admin actions
3. Details include:
   - Admin username
   - Action performed
   - Affected user or resource
   - Timestamp
   - IP address

### Compliance Reporting

Generate compliance reports for regulatory requirements:

1. Navigate to Reports > Compliance
2. Select report type:
   - Transaction Volume Report
   - User Activity Report
   - AML Monitoring Report
   - Suspicious Activity Report
3. Set date range and filtering criteria
4. Generate and export reports in PDF or Excel format

### Data Retention

The system maintains records according to the following retention policy:

- User account data: 7 years after account closure
- Transaction records: 10 years
- Communication logs: 5 years
- Session logs: 1 year

## Security Management

### User Session Management

Monitor and manage active sessions:

1. Navigate to Security > Active Sessions
2. View all currently active user and admin sessions
3. Terminate suspicious sessions as needed

### API Key Management

1. Navigate to Security > API Keys
2. View, rotate, or revoke API keys for external services
3. Monitor API usage and set rate limits

### Two-Factor Authentication

Configure 2FA requirements:

1. Navigate to Security > Authentication
2. Set 2FA requirements for different user roles
3. Configure allowed 2FA methods

## Appendix

### Sandbox Environment

For testing and training, use the sandbox environment:

- URL: `https://sandbox.tmpay.com/admin`
- Test Admin Credentials:
  - Username: `admin_test`
  - Password: `Test@123456`

### Support and Escalation

For technical support or emergency assistance:

1. Primary contact: IT Support Team at support@tmpay.com
2. Escalation: System Administrator at sysadmin@tmpay.com
3. Emergency: Emergency Response Team at emergency@tmpay.com or +63 XXX XXX XXXX

### Common Issues and Resolutions

| Issue | Resolution |
|-------|------------|
| Payment gateway timeout | Check external service status and restart the connection |
| Database connection error | Verify database server status and connection parameters |
| High transaction failure rate | Review transaction logs and payment gateway status |
| User balance discrepancy | Check transaction history for failed updates or duplicate entries |

---

© 2025 TMPay. All rights reserved.