# Authentication Testing Documentation

## Authentication Endpoints

The 747 Casino E-Wallet Platform provides the following authentication endpoints:

- `POST /api/auth/verify-username`: Verify if a username exists and checks casino connections
- `POST /api/auth/login`: Authenticate a user with username and password
- `POST /api/auth/refresh-token`: Refresh an expired access token using a valid refresh token
- `POST /api/auth/logout`: Invalidate user session and tokens

## Test User Credentials

For testing purposes, the following credentials can be used:

- **Username**: `Wakay`
- **Password**: `Wakay@123`
- **User Type**: `player`
- **Casino Client ID**: `329777805`
- **Top Manager**: `Marcthepogi`
- **Immediate Manager**: `platalyn@gmail.com`

## Testing Methods

### 1. cURL Command (test-login-curl.sh)

To test authentication via cURL, use the test-login-curl.sh script:

```bash
chmod +x test-login-curl.sh
./test-login-curl.sh
```

This script performs:
1. POST request to `/api/auth/login` with test credentials
2. Saves session cookies to cookies.txt
3. Makes an authenticated request to `/api/user/info` using the saved cookies

### 2. Node.js Script (test-login-api.mjs)

For programmatic testing with Node.js:

```bash
node test-login-api.mjs
```

This script:
1. Uses node-fetch to authenticate with the API
2. Demonstrates both cookie-based and token-based authentication attempts
3. Provides detailed output of user information from the login response

### 3. Transaction Listing Test (test-transaction-list.mjs)

To test the transaction listing functionality:

```bash
node test-transaction-list.mjs
```

This script:
1. Authenticates the test user
2. Fetches and displays the user's transaction history
3. Shows details for the most recent transaction

## Authentication Response Format

A successful login response includes:

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "username": "Wakay",
    "casinoId": "329777805",
    "email": "wakatkrsh@gmail.com",
    "balance": "100.00",
    "pendingBalance": "200.00",
    "isVip": false,
    "casinoUsername": "Wakay",
    "casinoClientId": 329777805,
    "topManager": "Marcthepogi",
    "immediateManager": "platalyn@gmail.com",
    "casinoUserType": "player",
    "casinoBalance": "0",
    "accessToken": "token_value_here",
    "refreshToken": "refresh_token_value_here",
    "currencyBalances": {},
    "preferredCurrency": "PHP",
    "isAuthorized": true,
    "allowedTopManagers": [
      "Marcthepogi",
      "bossmarc747",
      "teammarc"
    ],
    "id": 1,
    "balances": {
      "PHP": "100.00"
    },
    "hierarchyLevel": 0,
    "accessTokenExpiry": "2025-03-18T17:37:57.036Z",
    "refreshTokenExpiry": "2025-04-17T16:37:57.067Z",
    "casinoAuthTokenExpiry": null,
    "casinoAuthToken": "CASINO_TOKEN_MARCTHEPOGI",
    "createdAt": "2025-03-15T14:38:34.711Z",
    "updatedAt": "2025-03-18T16:37:57.067Z"
  }
}
```

## Authentication Methods

The platform supports two authentication methods:

1. **Session-based (Cookie) Authentication**
   - More secure for browser-based interactions
   - Automatically handles token refreshing
   - Preferred for web application access

2. **Token-based Authentication**
   - For API access from external systems
   - Requires manual handling of token refresh
   - Uses the `Authorization: Bearer {token}` header format

## Known Issues

1. SQL errors in `updateUserHierarchyInfo` and `setUserAllowedTopManagers` functions
   - These errors don't impact core authentication functionality
   - Should be fixed for complete hierarchy management

2. Token-based authentication may not be fully implemented
   - Current tests show cookies are required for session maintenance
   - Further development may be needed for pure token-based API access