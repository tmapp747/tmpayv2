# Authentication System FAQ

## General Questions

### Q: Why did we move from token-based to session-based authentication?
**A:** While token-based authentication works well for many applications, session-based authentication offers several advantages:

1. **Enhanced Security**: Session data is stored server-side, reducing client-side attack vectors
2. **Reduced Payload Size**: No need to transmit tokens in every request
3. **Easier Invalidation**: Sessions can be terminated immediately server-side
4. **CSRF Protection**: Better protection against Cross-Site Request Forgery
5. **Simpler Client Implementation**: Browsers handle cookie management automatically

We've maintained token-based authentication as a fallback for non-browser clients.

### Q: Will this change break existing integrations?
**A:** No. We've implemented a hybrid approach that supports both session-based and token-based authentication. All existing token-based integrations will continue to work without modification.

### Q: How long do sessions last?
**A:** Default session duration is 24 hours of inactivity. After this period, users will need to login again. This can be configured in the session settings if needed.

### Q: How are passwords stored?
**A:** All passwords are hashed using bcrypt with a work factor of 10. This is an industry-standard one-way hashing algorithm designed specifically for password storage.

## Session Authentication

### Q: How do sessions work?
**A:** When a user logs in, their user ID is stored in a session on the server. A session ID is sent to the browser as a cookie. On subsequent requests, the browser sends this cookie, and the server uses it to retrieve the session data and identify the user.

### Q: Where is session data stored?
**A:** Session data is stored in a PostgreSQL database table named `session`. This provides persistence across server restarts and scalability across multiple instances.

### Q: Are sessions secure?
**A:** Yes. We implement several security measures:
- Sessions are regenerated on login/logout to prevent session fixation
- Session cookies are HttpOnly to prevent JavaScript access
- In production, cookies are marked Secure (HTTPS-only)
- Session data is stored server-side, not in the cookie itself

### Q: Do I need to do anything special to handle sessions in my frontend code?
**A:** For most web applications, you simply need to include `credentials: 'include'` in your fetch requests. The browser will automatically handle sending and receiving cookies.

## Token Authentication

### Q: Are tokens still supported?
**A:** Yes. Token-based authentication is still fully supported for non-browser clients like mobile apps, desktop applications, and API integrations.

### Q: How long do tokens last?
**A:** Access tokens expire after 1 hour. Refresh tokens expire after 30 days. This balances security and convenience.

### Q: How do I refresh an expired token?
**A:** Send a POST request to `/api/auth/refresh-token` with your refresh token in the request body. You'll receive a new access token in response.

### Q: Where should I store tokens in a mobile app?
**A:** Use secure storage appropriate for your platform:
- iOS: Keychain
- Android: EncryptedSharedPreferences or Keystore
- React Native: Secure storage libraries like react-native-keychain
- Never store tokens in plain SharedPreferences or localStorage

## Troubleshooting

### Q: Users are getting logged out unexpectedly. Why?
**A:** Common causes include:
1. Session expiration (default 24 hours)
2. Server restarts without persistent session storage
3. CORS issues with cookies 
4. Browser privacy settings blocking cookies

Check server logs for session-related errors and verify PostgreSQL session storage is working correctly.

### Q: Why am I getting CORS errors after implementing session auth?
**A:** For sessions with cookies to work across domains:
1. Server must have proper CORS configuration with `credentials: true`
2. Client must use `credentials: 'include'` in requests
3. CORS must specify exact origins, not wildcards (`*`)

Example server configuration:
```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com',
  credentials: true
}));
```

### Q: Token authentication stopped working after the update. Why?
**A:** Check the following:
1. Ensure you're still sending the Authorization header correctly: `Authorization: Bearer YOUR_TOKEN`
2. Verify token format hasn't changed
3. Check token expiration - you may need to refresh

### Q: How can I test if my session is working correctly?
**A:** In development, you can use this endpoint to check your current session:
```javascript
fetch('/api/debug/session', { credentials: 'include' })
  .then(res => res.json())
  .then(console.log);
```

## Security Questions

### Q: Is the session cookie vulnerable to XSS attacks?
**A:** The session cookie is set with the HttpOnly flag, which prevents JavaScript from accessing it. This significantly reduces the risk from XSS attacks.

### Q: How are we protecting against CSRF attacks?
**A:** Our session implementation includes several CSRF protections:
1. For state-changing operations, we verify the request comes from our application
2. SameSite cookie attributes (Lax by default)
3. Cross-origin request verification

### Q: What happens if someone steals a session cookie?
**A:** If a session cookie is compromised (which is difficult due to HttpOnly), the attacker could impersonate the user until the session expires. We recommend implementing additional security measures for high-value operations:
1. Re-authentication for sensitive actions
2. IP-based session validation
3. Activity monitoring

### Q: Is the password reset flow secure?
**A:** Yes. Password resets generate a one-time token tied to the user's account and sent to their verified email. The token expires after use or a short time period.

## Implementation Details

### Q: What technologies are used for authentication?
**A:** Our authentication system uses:
- Passport.js for authentication strategies
- Express-session for session management
- Connect-pg-simple for PostgreSQL session storage
- Bcrypt for password hashing
- Custom middleware for hybrid auth support

### Q: Can we customize the session duration?
**A:** Yes. Modify the `maxAge` setting in the session configuration:
```javascript
app.use(session({
  // ...other options
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    // ...other cookie options
  }
}));
```

### Q: How do we handle session storage at scale?
**A:** Using PostgreSQL for session storage allows us to:
1. Scale horizontally across multiple app servers
2. Persist sessions through server restarts
3. Manage session data alongside application data
4. Implement sophisticated session queries and management

For very high-scale applications, Redis can be substituted as the session store.

### Q: Can we log users out remotely?
**A:** Yes. By marking their session as invalid in the database, we can force users to re-authenticate. This can be implemented through an admin panel or API.