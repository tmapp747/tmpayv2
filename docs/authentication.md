# TMPay Authentication System Documentation

## Overview

TMPay implements a robust, hybrid authentication system that uses both session-based authentication (primary) and token-based authentication (legacy support). This dual approach ensures both security and backward compatibility with existing integrations.

## Authentication Methods

### 1. Session-Based Authentication (Primary)

Session-based authentication uses Passport.js with server-side session management stored in PostgreSQL. This method is more secure as it:

- Stores session data on the server, not in the browser
- Provides CSRF protection
- Enables easy session invalidation
- Reduces attack surface compared to JWT tokens

### 2. Token-Based Authentication (Legacy Support)

The system maintains backward compatibility with existing integrations by supporting token-based authentication:

- Access tokens (short-lived)
- Refresh tokens (long-lived)
- Automatic token refresh mechanisms

## Implementation Details

### Session Configuration

Sessions are configured with:

- Secure cookie settings
- PostgreSQL session store
- Session expiry settings
- Session regeneration on login/logout for security

```javascript
// Session configuration
app.use(
  session({
    store: new PgSessionStore({
      pool,
      tableName: 'session', // Uses the 'session' table in PostgreSQL
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);
```

### Passport.js Integration

Passport.js handles user authentication with:

- Local strategy for username/password authentication
- Serialization/deserialization for session management

```javascript
// Passport initialization
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) return done(null, false, { message: 'Invalid username or password' });
      
      // Compare password using secure methods
      const passwordMatches = await comparePasswords(password, user.password);
      if (!passwordMatches) return done(null, false, { message: 'Invalid username or password' });
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

// Serialization for storing in session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialization for retrieving from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});
```

### Security Enhancements

#### 1. Password Hashing

All passwords are securely hashed using bcrypt:

```javascript
/**
 * Hashes a password using bcrypt
 * Always uses bcrypt regardless of environment for security
 */
export async function hashPassword(password: string) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}
```

#### 2. Password Migration System

The system supports automatic migration from plaintext to bcrypt-hashed passwords:

```javascript
/**
 * Compares a supplied password with a stored password
 * Handles both bcrypt hashed passwords and plaintext passwords during migration period
 * Uses constant-time comparison to prevent timing attacks where needed
 */
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  // Check if password is hashed with bcrypt
  if (isPasswordHashed(stored)) {
    // Use bcrypt for comparison (timing-safe)
    return bcrypt.compare(supplied, stored);
  } else {
    // Legacy plaintext passwords - use constant-time comparison
    // and schedule migration to bcrypt
    const match = crypto.timingSafeEqual(
      Buffer.from(supplied),
      Buffer.from(stored)
    );
    
    // If match, schedule migration to bcrypt
    if (match) {
      // Migrate password to bcrypt in the background
      hashPassword(supplied).then(hashedPassword => {
        // Update the user's password to the hashed version
        // This is an async operation that doesn't block the login flow
        storage.updateUserPassword(user.id, hashedPassword);
      }).catch(error => {
        console.error('Failed to migrate password to bcrypt:', error);
      });
    }
    
    return match;
  }
}
```

#### 3. Session Regeneration

Sessions are regenerated on login and logout to prevent session fixation attacks:

```javascript
// On login
req.session.regenerate((err) => {
  if (err) return next(err);
  // ...login logic
});

// On logout
req.session.destroy((err) => {
  if (err) return next(err);
  // ...logout logic
});
```

## Authentication Flow

### Login Flow

1. User submits username and password
2. Passport.js verifies credentials
3. If valid:
   - Session is regenerated for security
   - User ID is stored in session
   - If plaintext password, it's migrated to bcrypt
   - Access token is generated for legacy API support
4. User is now authenticated for both session and token-based methods

### Session Verification Flow

1. For protected routes, the `authMiddleware` checks:
   - First, if user is authenticated via session
   - If not, falls back to token-based auth
2. If authenticated, the user object is attached to the request
3. If not authenticated, returns 401 Unauthorized

### Logout Flow

1. User requests logout
2. Session is destroyed
3. Access and refresh tokens are invalidated
4. Cookies are cleared
5. User is redirected to login page

## Client-Side Integration

### Session Authentication

The frontend automatically includes session cookies with requests:

```typescript
// API request with session cookies included automatically by the browser
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = endpoint.startsWith('http') ? endpoint : endpoint;
  
  const defaultOptions: RequestInit = {
    credentials: 'include', // Include cookies for session auth
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  const response = await fetch(url, { ...defaultOptions, ...options });
  
  // Handle 401 Unauthorized with automatic redirect
  if (response.status === 401) {
    // Redirect to login page
    window.location.href = '/auth';
    throw new Error('Session expired. Please login again.');
  }
  
  return response.json();
}
```

### Legacy Token Authentication

For API clients that don't support cookies, token-based authentication is available:

```typescript
// Example of token-based authentication
const response = await fetch('/api/data', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

## Database Schema

The authentication system relies on several database tables:

1. `users` - Stores user account information including passwords
2. `session` - Stores session data (managed by connect-pg-simple)

## Security Considerations

1. **CSRF Protection**
   - Session cookies are HttpOnly and (in production) Secure
   - Consider implementing CSRF tokens for sensitive operations

2. **Session Expiry**
   - Sessions expire after 24 hours of inactivity
   - Configure shorter timeouts for high-security applications

3. **Password Storage**
   - All passwords are hashed with bcrypt
   - Legacy plaintext passwords are automatically migrated

4. **Rate Limiting**
   - Consider implementing rate limiting on login attempts
   - Block IPs after multiple failed login attempts

5. **Audit Logging**
   - Log all authentication events for security monitoring
   - Include IP address, timestamp, and success/failure status

## Troubleshooting

### Common Issues

1. **Session Not Persisting**
   - Check PostgreSQL connection
   - Verify session secret is consistent
   - Ensure cookies are not being blocked

2. **Authentication Failing**
   - Check username/password combination
   - Verify user account exists and is active
   - Check for session table issues

3. **Token Refresh Failing**
   - Verify refresh token is valid and not expired
   - Check token storage in database

### Debugging Tools

1. **Session Inspection**
   - Use the `/api/debug/session` endpoint (development only)
   - Check session table in PostgreSQL

2. **Token Verification**
   - Use the `/api/debug/verify-token` endpoint (development only)

## Migration Guide

### From Token-Only to Hybrid Authentication

1. Ensure all clients include credentials in requests:
   ```typescript
   fetch(url, { credentials: 'include' })
   ```

2. Update client SDKs to handle both authentication methods
3. Test thoroughly with both authentication methods
4. Gradually transition clients to session-based authentication

## Best Practices

1. Always use HTTPS in production
2. Implement proper password policies
3. Use secure session configurations
4. Implement multi-factor authentication for sensitive operations
5. Regularly audit authentication logs
6. Set appropriate session timeouts
7. Implement proper error handling