# TMPay Technical Architecture

![TMPay Logo](../public/logo.png)

## Overview

This document outlines the technical architecture of the TMPay e-wallet platform, providing insights into the system design, components, data flow, and integration points. The architecture is designed for high availability, scalability, security, and performance.

## System Architecture Diagram

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Client Layer   │◄────►│    API Layer    │◄────►│  Service Layer  │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        ▲                        ▲                        ▲
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│   Integration   │◄────►│  Data Storage   │◄────►│   Background    │
│      Layer      │      │      Layer      │      │    Processes    │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## Architecture Layers

### 1. Client Layer

The client layer handles the user interface and interaction with the system.

#### Components:

- **Web Application**:
  - React.js SPA (Single Page Application)
  - TypeScript for type safety
  - TailwindCSS for styling
  - Shadcn UI component library
  - React Three Fiber for 3D visualizations
  - Framer Motion for animations

- **Mobile Responsiveness**:
  - Responsive design using TailwindCSS
  - Touch-friendly interface elements
  - Mobile-optimized layouts and navigation

#### Features:

- User authentication and registration
- Dashboard with account overview
- Fund deposit and withdrawal interfaces
- Casino account management
- Transaction history and reporting
- QR code scanning and display
- Profile management
- Admin dashboard and management tools

### 2. API Layer

The API layer serves as the interface between the client applications and the backend services, providing well-defined endpoints for all client-side operations.

#### Components:

- **Express.js Server**:
  - RESTful API endpoints
  - Built with TypeScript
  - JSON Web Token (JWT) authentication
  - Request validation using Zod schemas
  - Centralized error handling
  - Rate limiting and request throttling

#### Key API Groups:

- Authentication APIs
- User management APIs
- Transaction processing APIs
- Payment management APIs
- Casino integration APIs
- Admin management APIs
- Webhook receivers for external services

### 3. Service Layer

The service layer contains the core business logic of the application, implementing the functionality behind each API endpoint.

#### Components:

- **Authentication Service**:
  - User credential validation
  - Token generation and verification
  - Session management
  - Casino account verification

- **User Service**:
  - User profile management
  - Balance management
  - Security settings
  - Preference management

- **Transaction Service**:
  - Transaction creation and processing
  - Balance updates
  - Transaction status tracking
  - Transaction history management

- **Payment Service**:
  - Payment method management
  - Payment request generation
  - Payment verification
  - Payment receipt processing

- **Casino Integration Service**:
  - Casino user validation
  - Fund transfers to/from casino accounts
  - Casino balance queries
  - Casino transaction tracking

- **Admin Service**:
  - User management for administrators
  - System configuration
  - Manual payment verification
  - System monitoring and reporting

### 4. Integration Layer

The integration layer handles communication with external systems and third-party APIs.

#### Components:

- **DirectPay Integration**:
  - GCash QR code generation
  - Payment status verification
  - Webhook handling for payment notifications

- **747 Casino API Integration**:
  - User verification
  - Balance queries
  - Fund transfers
  - Transaction history retrieval

- **Paygram Integration**:
  - Crypto payment processing (PHPT/USDT)
  - Payment URL generation
  - Payment status verification

- **Notification Service**:
  - Email notifications
  - In-app notifications
  - Push notifications (for future mobile app)
  - HTML-formatted manager notifications
  - Automatic transaction status notifications

### 5. Data Storage Layer

The data storage layer manages the persistent storage of application data.

#### Components:

- **PostgreSQL Database**:
  - User data
  - Transaction records
  - Payment information
  - System configuration
  - Audit logs

- **Drizzle ORM**:
  - Type-safe database access
  - Query building
  - Migration management
  - Schema validation

#### Key Data Models:

- **User Model**:
  - User identification and authentication data
  - Profile information
  - Balance information
  - Casino account connection
  - Security settings

- **Transaction Model**:
  - Transaction metadata
  - Financial details
  - Status information
  - Audit trail
  - Balance snapshots

- **Payment Model**:
  - Payment method details
  - Payment processing information
  - Payment status tracking
  - Payment verification data

- **Casino Integration Model**:
  - Casino user details
  - Transfer records
  - Authorization tokens
  - Casino balance tracking

### 6. Background Processes

Background processes handle asynchronous tasks, scheduled jobs, and long-running operations.

#### Components:

- **Payment Verification Service**:
  - Periodic payment status checks
  - Payment timeout management
  - Transaction completion processing

- **Exchange Rate Service**:
  - Currency exchange rate updates
  - Rate calculation for currency conversion

- **Session Cleanup Service**:
  - Expired session removal
  - Token cleanup

- **Audit Service**:
  - Activity logging
  - Security event tracking
  - Compliance reporting

## Security Architecture

### Authentication and Authorization

- **Multi-factor Authentication**:
  - Password-based primary authentication
  - Optional SMS or email verification
  - Transaction PINs for high-value operations

- **Role-Based Access Control (RBAC)**:
  - Hierarchical permissions structure
  - Fine-grained access controls
  - Context-sensitive authorization

- **Session Management**:
  - Secure session handling
  - Automatic session expiration
  - Force logout capability

### Data Security

- **Encryption**:
  - TLS/SSL for all communications
  - Database encryption for sensitive data
  - Field-level encryption for PII
  - Secure key management

- **Sensitive Data Handling**:
  - PCI DSS compliance for payment data
  - Personally Identifiable Information (PII) protection
  - Data masking for sensitive information display

### API Security

- **Input Validation**:
  - Strict schema validation
  - Input sanitization
  - Parameter validation

- **Rate Limiting**:
  - Tiered rate limits based on operation sensitivity
  - IP-based throttling for public endpoints
  - User-based throttling for authenticated endpoints

- **Audit Logging**:
  - Comprehensive audit trail
  - Security event logging
  - Access logs for sensitive operations

## Data Flow

### Payment Processing Flow

1. **User Initiates Payment**:
   - User selects payment method and amount
   - Client validates input
   - Request sent to server via API

2. **Payment Request Creation**:
   - Server validates request
   - Transaction record created with 'pending' status
   - Payment API called based on selected method

3. **External Payment Processing**:
   - User completes payment through external provider
   - External provider sends callback/webhook
   - System verifies payment authenticity

4. **Transaction Completion**:
   - System updates transaction status
   - User balance updated
   - Notification sent to user
   - Optional: Funds transferred to casino account

### Casino Fund Transfer Flow

1. **User Initiates Casino Transfer**:
   - User selects amount to transfer
   - Client validates input
   - Request sent to server via API

2. **Transfer Request Validation**:
   - Server validates request
   - Checks user balance
   - Creates transaction record with 'pending' status

3. **Casino API Interaction**:
   - System retrieves casino authorization token
   - Calls casino transfer API
   - Processes casino API response

4. **Transfer Completion**:
   - Updates transaction status
   - Adjusts user e-wallet balance
   - Records casino balance update
   - Sends confirmation notification to user

## Integration Points

### DirectPay Integration

- **Integration Type**: REST API and Webhooks
- **Functionality**:
  - GCash QR code generation
  - Payment status verification
  - Payment notifications via webhooks
- **Authentication**: API key and secret
- **Data Exchange Format**: JSON
- **Endpoints Used**:
  - `/api/qrcode/generate` (POST)
  - `/api/payment/status` (GET)
  - Webhook endpoint for payment notifications

### 747 Casino API Integration

- **Integration Type**: REST API
- **Functionality**:
  - User verification
  - Balance queries
  - Fund transfers
  - Transaction history
- **Authentication**: JWT tokens per top manager
- **Data Exchange Format**: JSON
- **Endpoints Used**:
  - `/api/user/details` (GET)
  - `/api/user/balance` (GET)
  - `/api/transfer/funds` (POST)
  - `/api/transactions/history` (GET)

### Paygram Integration

- **Integration Type**: REST API and Callbacks
- **Functionality**:
  - Generate crypto payment URLs
  - Verify payment status
  - Process payment callbacks
- **Authentication**: API key and signature
- **Data Exchange Format**: JSON
- **Endpoints Used**:
  - `/api/invoice/create` (POST)
  - `/api/invoice/status` (GET)
  - Callback URL for payment notifications

## Scalability and Performance

### Horizontal Scalability

- **API Layer**: 
  - Stateless design for easy scaling
  - Load balancer support
  - Session store in Redis (future enhancement)

- **Database Layer**:
  - Connection pooling
  - Query optimization
  - Future support for read replicas

### Performance Optimizations

- **Caching Strategy**:
  - In-memory caching for frequently accessed data
  - Token caching for casino API authentication
  - Query result caching

- **Resource Efficiency**:
  - Optimized database queries
  - Efficient background job scheduling
  - Resource pooling

## Development and Deployment

### Development Environment

- **Local Development**:
  - Local PostgreSQL database
  - Development-specific configuration
  - Mock services for external APIs

- **Testing Environment**:
  - Automated testing with Jest
  - Integration testing with Supertest
  - E2E testing with Cypress (future enhancement)

### Deployment Process

- **Replit Deployment**:
  - Automated deployment through Replit
  - Environment-specific configuration
  - Database migration automation
  - Zero-downtime updates (future enhancement)

## Future Architecture Expansions

### Planned Enhancements

- **Mobile Application**:
  - Native mobile app development
  - Push notification integration
  - Biometric authentication

- **Additional Payment Methods**:
  - Credit/debit card integration
  - Additional e-wallet options
  - More cryptocurrency options

- **Advanced Analytics**:
  - Business intelligence dashboard
  - User behavior analytics
  - Fraud detection system

- **High Availability**:
  - Multi-region deployment
  - Automated failover
  - Disaster recovery procedures

## Appendix

### Technology Stack Details

- **Frontend**:
  - React 18
  - TypeScript 5
  - TailwindCSS 3
  - Shadcn UI
  - React Three Fiber
  - Framer Motion
  - TanStack Query (React Query)
  - Wouter for routing

- **Backend**:
  - Node.js 20
  - Express.js 4
  - TypeScript 5
  - PostgreSQL 15
  - Drizzle ORM
  - Zod for validation
  - JWT for authentication

---

© 2025 TMPay. All rights reserved.