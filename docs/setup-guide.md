# TMPay Setup and Deployment Guide

![TMPay Logo](../public/logo.png)

## Overview

This guide provides step-by-step instructions for setting up and deploying the TMPay e-wallet platform. It covers environment setup, configuration, database initialization, API integration, and deployment procedures.

## Prerequisites

Before starting the setup process, ensure you have:

1. **Access to Environment**
   - Replit account with appropriate permissions
   - Access to the TMPay repository

2. **Required Credentials**
   - DirectPay API credentials
   - 747 Casino manager tokens
   - Paygram API credentials (if using crypto payments)
   - PostgreSQL database credentials

3. **Additional Requirements**
   - Node.js v20 or later
   - PostgreSQL 15 or later
   - HTTPS domain for webhook endpoints

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/tmpay-ewallet.git
cd tmpay-ewallet
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/tmpay_db

# Server Configuration
PORT=5000
NODE_ENV=production
API_BASE_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Authentication
JWT_SECRET=your_very_secure_jwt_secret_key
SESSION_SECRET=your_very_secure_session_secret

# DirectPay Integration
DIRECTPAY_API_URL=https://direct-payph.com/api
DIRECTPAY_USERNAME=your_directpay_username
DIRECTPAY_PASSWORD=your_directpay_password

# 747 Casino Integration
CASINO_TOKEN_MARCTHEPOGI=your_marcthepogi_token
CASINO_TOKEN_BOSSMARC747=your_bossmarc747_token
CASINO_TOKEN_TEAMMARC=your_teammarc_token

# Paygram Integration (Optional)
PAYGRAM_API_URL=https://api.pay-gram.org
PAYGRAM_API_KEY=your_paygram_api_key
PAYGRAM_API_TOKEN=your_paygram_api_token
PAYGRAM_CALLBACK_URL=https://yourdomain.com/api/webhook/paygram
```

Replace all placeholder values with your actual credentials and configuration.

### 3. Install Dependencies

```bash
npm install
```

### 4. Database Setup

Initialize the PostgreSQL database:

```bash
# Generate database schema
npm run db:push

# Seed the database with initial data (if needed)
npm run db:seed
```

## Configuration

### 1. Configure Exchange Rates

Update exchange rates in the appropriate configuration files or database tables:

```typescript
// Example exchange rate configuration
const exchangeRates = {
  PHP_PHPT: 1.0,     // 1 PHP = 1 PHPT
  PHP_USDT: 0.018,   // 1 PHP = 0.018 USDT
  PHPT_USDT: 0.018,  // 1 PHPT = 0.018 USDT
  USDT_PHP: 55.5,    // 1 USDT = 55.5 PHP
  USDT_PHPT: 55.5,   // 1 USDT = 55.5 PHPT
  PHPT_PHP: 1.0      // 1 PHPT = 1 PHP
};
```

### 2. Configure Transaction Limits

Set appropriate transaction limits for different payment methods:

```typescript
// Example transaction limit configuration
const transactionLimits = {
  gcash: {
    min: 100,    // Minimum: ₱100
    max: 50000   // Maximum: ₱50,000
  },
  bank_transfer: {
    min: 1000,   // Minimum: ₱1,000
    max: 100000  // Maximum: ₱100,000
  },
  crypto: {
    min: 500,    // Minimum: ₱500
    max: 500000  // Maximum: ₱500,000
  }
};
```

### 3. Configure API Integrations

Verify that all API integrations are properly configured:

- **DirectPay**: Ensure webhooks are properly set up
- **747 Casino**: Verify that tokens are valid
- **Paygram**: Configure callback URLs

## Building the Application

### 1. Build the Frontend

```bash
npm run build
```

This command compiles the React frontend application.

### 2. Test the Full Application

```bash
npm run dev
```

This starts the application in development mode. Verify that:

- The web interface loads correctly
- API endpoints respond as expected
- Database connections are working
- External API integrations are functioning

## Deployment

### Deploying on Replit

1. **Push to Replit Repository**

   Ensure your code is committed to the Replit repository.

2. **Set Environment Variables**

   Configure all required environment variables in the Replit Secrets panel.

3. **Start the Application**

   Run the application using the configured start command:

   ```bash
   npm run start
   ```

4. **Configure Custom Domain** (Optional)

   If using a custom domain:
   - Add your domain in the Replit domain settings
   - Configure DNS settings with your domain provider
   - Set up SSL certificates

### Alternative Deployment Options

#### Docker Deployment

1. Create a Dockerfile:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "run", "start"]
```

2. Build and run the Docker container:

```bash
docker build -t tmpay-ewallet .
docker run -p 5000:5000 --env-file .env tmpay-ewallet
```

#### Traditional VPS Deployment

1. Set up a VPS with Node.js and PostgreSQL
2. Clone the repository
3. Configure environment variables
4. Set up a process manager like PM2:

```bash
npm install -g pm2
pm2 start npm --name "tmpay" -- run start
pm2 startup
pm2 save
```

5. Configure Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

6. Set up SSL with Certbot:

```bash
certbot --nginx -d yourdomain.com
```

## Post-Deployment Verification

After deployment, verify the following:

1. **Web Interface**: 
   - Confirm the web interface loads correctly
   - Test user registration and login
   - Verify all major features

2. **API Functionality**:
   - Test key API endpoints
   - Verify authentication is working
   - Check that rate limiting is functioning

3. **External Integrations**:
   - Test DirectPay integration
   - Verify 747 Casino API connections
   - Check Paygram integration (if applicable)

4. **Webhook Endpoints**:
   - Verify webhook URLs are accessible
   - Test webhook processing

## Monitoring and Maintenance

### Monitoring Setup

1. **Application Logs**
   - Set up log aggregation
   - Configure log rotation

2. **Performance Monitoring**
   - Monitor API response times
   - Track database performance
   - Set up alerts for slow responses

3. **Error Tracking**
   - Implement error reporting
   - Set up notifications for critical errors

### Maintenance Procedures

1. **Database Backups**
   - Configure regular database backups
   - Test backup restoration process

2. **Security Updates**
   - Regularly update dependencies
   - Apply security patches promptly

3. **Performance Optimization**
   - Analyze and optimize slow queries
   - Monitor and adjust resource allocation

## Troubleshooting

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Database connection errors | Check DATABASE_URL environment variable and database server status |
| API integration failures | Verify API credentials and endpoint URLs |
| Webhook processing issues | Ensure webhook URLs are publicly accessible and properly configured |
| Performance problems | Check database indexing, optimize queries, and monitor resource usage |

### Support Resources

- **Technical Support**: Contact technical support at support@tmpay.com
- **Documentation**: Refer to the comprehensive documentation in the `docs` directory
- **Issue Tracking**: Report issues through the project's issue tracker

## Appendix

### Useful Commands

```bash
# Start the application in development mode
npm run dev

# Build the application
npm run build

# Start the application in production mode
npm run start

# Run database migrations
npm run db:push

# Check for security vulnerabilities
npm audit

# Run tests
npm test
```

### Version Compatibility

| Dependency | Supported Versions |
|------------|-------------------|
| Node.js | 18.x, 20.x |
| PostgreSQL | 14.x, 15.x |
| React | 18.x |
| Express | 4.x |

---

© 2025 TMPay. All rights reserved.