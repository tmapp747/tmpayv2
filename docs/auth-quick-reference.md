# TMPay Authentication - Quick Reference Card

## Authentication Methods

| Method | Use Case | Security | Implementation |
|--------|----------|----------|---------------|
| **Session-based** | Browser clients | High (server-side storage) | Uses cookies, Passport.js |
| **Token-based** | Non-browser clients | Medium (client storage) | JWT tokens, Authorization header |

## Session Authentication

### Login
```typescript
fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
```

### Make Authenticated Request
```typescript
fetch('/api/protected-endpoint', {
  credentials: 'include'  // This includes session cookies automatically
});
```

### Logout
```typescript
fetch('/api/auth/logout', {
  method: 'POST',
  credentials: 'include'
});
```

## Token Authentication

### Login and Get Tokens
```typescript
fetch('/api/auth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
// Returns { accessToken, refreshToken }
```

### Make Authenticated Request
```typescript
fetch('/api/protected-endpoint', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

### Refresh Token
```typescript
fetch('/api/auth/refresh-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
});
// Returns { accessToken }
```

## Security Checklist

- [x] All passwords hashed with bcrypt
- [x] Automatic migration from plaintext to hashed passwords
- [x] Session regeneration on login/logout
- [x] HttpOnly session cookies
- [x] PostgreSQL session storage
- [x] Access token expiration (1 hour)
- [x] Refresh token expiration (30 days)
- [x] Proper CORS configuration with credentials

## Troubleshooting

| Problem | Possible Causes | Solution |
|---------|----------------|----------|
| Authentication failing | Invalid credentials | Verify username/password |
| | Session expired | Re-login |
| | Missing cookies | Ensure `credentials: 'include'` |
| | CORS issues | Check server CORS config |
| | No session store | Verify PostgreSQL connection |
| Session not persisting | Cookie settings | Check HttpOnly, Secure flags |
| | Session storage | Verify PostgreSQL session table |
| | Browser settings | Check if cookies are blocked |
| Token refresh failing | Expired refresh token | Force re-login |
| | Invalid token | Check token format & storage |

## Implementation Details

### Server-side Setup

```typescript
// Session configuration
app.use(session({
  store: new PgSessionStore({
    pool,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'tmpay-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());
```

### Authentication Middleware

```typescript
async function authMiddleware(req: Request, res: Response, next: Function) {
  // Check if user is authenticated via session
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Fall back to token-based auth
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const user = await storage.getUserByAccessToken(token);
      if (user && !(await storage.isTokenExpired(user.id))) {
        req.user = user;
        return next();
      }
    } catch (error) {
      console.error('Token authentication error:', error);
    }
  }
  
  return res.status(401).json({ 
    success: false, 
    message: 'Authentication required' 
  });
}
```