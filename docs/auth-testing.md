# Authentication System Testing Guide

This guide outlines steps to verify that the TMPay authentication system is functioning correctly.

## Testing Session-Based Authentication

### 1. User Registration Test

1. **Navigate to the registration page**
   - Go to `/auth` and click "Register"

2. **Enter valid user information**
   ```
   Username: testuser123
   Password: SecurePassword123!
   Email: test@example.com
   ```

3. **Expected Results**
   - Account creation successful
   - Redirect to login page
   - Success message displayed

### 2. User Login Test

1. **Navigate to the login page**
   - Go to `/auth`

2. **Enter valid credentials**
   ```
   Username: testuser123
   Password: SecurePassword123!
   ```

3. **Expected Results**
   - Login successful
   - Redirect to dashboard/home page
   - User information displayed in UI
   - Session cookie present in browser (check DevTools → Application → Cookies)

### 3. Session Persistence Test

1. **After successful login:**
   - Refresh the page

2. **Expected Results**
   - User remains logged in
   - No redirect to login page
   - User information still displayed

### 4. Protected Route Access Test

1. **While logged in:**
   - Navigate to protected routes like `/wallet`, `/profile`

2. **Expected Results**
   - Access granted to protected pages
   - User-specific data displayed correctly

### 5. Logout Test

1. **Click on the logout button**

2. **Expected Results**
   - Redirect to login page
   - Session cookie removed
   - Attempting to access protected routes redirects to login

### 6. Session Timeout Test

1. **Modify session configuration temporarily for testing**
   ```javascript
   // Reduce maxAge to 30 seconds for testing
   cookie: {
     maxAge: 30 * 1000
   }
   ```

2. **Log in and wait for 30+ seconds**

3. **Try to access a protected route**

4. **Expected Results**
   - Session expiration
   - Redirect to login page

## Testing Token-Based Authentication

### 1. Token Generation Test

Using a tool like Postman or curl:

```bash
curl -X POST https://api.tmpay.com/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser123","password":"SecurePassword123!"}'
```

**Expected Results**
- Success response with `accessToken` and `refreshToken`
- JWT tokens in valid format

### 2. Token Authentication Test

```bash
curl https://api.tmpay.com/api/user/info \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Results**
- Successful response with user information
- Same data as session-based auth

### 3. Token Refresh Test

```bash
curl -X POST https://api.tmpay.com/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

**Expected Results**
- New access token
- Previous access token no longer valid

### 4. Token Invalidation Test

1. **Logout using:**
```bash
curl -X POST https://api.tmpay.com/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

2. **Try to use the token again:**
```bash
curl https://api.tmpay.com/api/user/info \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Results**
- 401 Unauthorized response
- Token no longer valid

## Browser Console Tests

Run these tests in the browser console to verify client-side integration:

### Test Session Authentication

```javascript
// Test login
fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    username: 'testuser123',
    password: 'SecurePassword123!'
  })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);

// Test accessing protected endpoint
fetch('/api/user/info', {
  credentials: 'include'
})
.then(res => res.json())
.then(console.log)
.catch(console.error);

// Test logout
fetch('/api/auth/logout', {
  method: 'POST',
  credentials: 'include'
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
```

## Common Issues and Debugging

### Session Authentication Issues

1. **Session Not Persisting**
   - Check PostgreSQL connection
   - Verify session table exists and has entries
   - Check cookie settings (httpOnly, secure, maxAge)
   - Ensure proper CORS config with credentials

2. **Authentication Failure**
   - Check if username/password combination is correct
   - Verify bcrypt password hashing works correctly
   - Check Passport.js configuration
   - Ensure session middleware is properly configured

### Token Authentication Issues

1. **Invalid Token Errors**
   - Check token format and expiration
   - Verify server-side token validation logic
   - Check token storage mechanism
   - Ensure proper Authorization header format

2. **Token Refresh Failures**
   - Verify refresh token is still valid
   - Check if the refresh token is being stored correctly
   - Ensure token refresh endpoint is working

## Performance Testing

1. **Concurrent Login Test**
   - Simulate multiple users logging in simultaneously
   - Verify session store handles concurrent sessions correctly

2. **Load Testing Authentication Endpoints**
   - Test login/logout endpoints under load
   - Measure response times and success rates

## Security Testing

1. **Check for Session Fixation**
   - Verify session ID changes after login

2. **Test CSRF Protection**
   - Attempt cross-site requests without proper headers

3. **Check Password Policies**
   - Test minimum password requirements
   - Verify password hashing is working

4. **Check for Cookie Security**
   - Verify HttpOnly flag is set
   - Check Secure flag in production
   - Validate SameSite attribute is set properly