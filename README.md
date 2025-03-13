# 747 Casino E-Wallet Platform

A sophisticated online casino e-wallet platform for 747, providing seamless financial transactions through DirectPay API and 747 Casino API integrations.

## Features

- Real-time payment processing via GCash QR codes
- Seamless integration with 747 Casino for balance transfers
- Comprehensive transaction history
- Secure user authentication
- Mobile-responsive UI

## Tech Stack

- **Frontend**: React with TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Express.js with TypeScript
- **API Integrations**: DirectPay API, 747 Casino API
- **State Management**: TanStack Query
- **Routing**: Wouter

## API Integrations

### DirectPay API

The integration with DirectPay API enables:

- CSRF token generation for secure API calls
- Authentication with session management
- GCash QR code generation for payments
- Webhook processing for payment notifications

### 747 Casino API

The integration with 747 Casino API enables:

- User detail lookups and validation
- Balance checking across platforms
- Deposit functionality from e-wallet to casino
- Withdrawal from casino to e-wallet
- Funds transfer between users
- Transaction history retrieval

## Environment Variables

The application uses the following environment variables:

- `BASE_URL`: The base URL of the application (for webhooks and redirects)
- `DIRECTPAY_USERNAME`: Username for DirectPay API
- `DIRECTPAY_PASSWORD`: Password for DirectPay API
- `CASINO747_API_KEY`: API key for 747 Casino API (if required)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables (create a `.env` file)
4. Start the development server:
   ```
   npm run dev
   ```

## Workflow

The payment flow follows these steps:

1. User requests a deposit via GCash QR code
2. Backend generates a QR code through DirectPay API
3. User scans and pays the QR code through GCash
4. DirectPay sends a webhook notification upon payment completion
5. Backend processes the webhook and updates transaction status
6. Backend transfers funds to the user's casino account via 747 Casino API
7. User's wallet and casino balances are updated

## Development Guidelines

- Use TypeScript for all new code
- Follow the established project structure
- Ensure proper error handling and fallbacks
- Maintain comprehensive logging
- Write clean, maintainable code