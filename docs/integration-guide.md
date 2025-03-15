# TMPay Authentication Integration Guide

This guide provides practical instructions for integrating with the TMPay authentication system.

## Available Authentication Methods

TMPay supports two authentication methods:

1. **Session-based Authentication** (Recommended)
   - Secure server-side session management
   - Automatic cookie handling by browsers
   - CSRF protection
   - Simpler client-side implementation

2. **Token-based Authentication** (Legacy Support)
   - Access tokens for short-lived authentication
   - Refresh tokens for maintaining long-term access
   - Requires manual token management

## Frontend Integration

### React Integration with Session Authentication

```typescript
// src/lib/api-client.ts

/**
 * Make an authenticated API request with session cookies
 * For web applications using browser-based clients
 */
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
  
  // Handle response
  if (!response.ok) {
    if (response.status === 401) {
      // Redirect to login page on authentication failure
      window.location.href = '/auth';
      throw new Error('Authentication required');
    }
    
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
  }
  
  return response.json();
}

// Example usage in a React component
import { apiRequest } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';

function UserProfile() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => apiRequest('/api/user/info')
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>Welcome, {data.user.username}!</h1>
      <p>Balance: {data.user.balance}</p>
    </div>
  );
}
```

### Login Form Implementation

```typescript
// src/pages/auth-page.tsx

import { useState } from 'react';
import { apiRequest } from '@/lib/api-client';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      
      // Redirect on successful login
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <div>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### Logout Implementation

```typescript
// src/components/LogoutButton.tsx

import { useNavigate } from 'wouter';
import { apiRequest } from '@/lib/api-client';

function LogoutButton() {
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}
```

## Backend API Integration

### Authentication Middleware (Express)

If you're building an API that needs to authenticate with TMPay, use this middleware pattern:

```typescript
// Your custom middleware
import axios from 'axios';

async function authMiddleware(req, res, next) {
  try {
    // Get the session cookie from the request
    const cookies = req.headers.cookie;
    
    // Forward the cookie to TMPay auth endpoint
    const response = await axios.get('https://api.tmpay.com/api/auth/verify', {
      headers: {
        Cookie: cookies
      }
    });
    
    // If authentication is successful, attach user to request
    if (response.data.success) {
      req.user = response.data.user;
      next();
    } else {
      res.status(401).json({ message: 'Authentication required' });
    }
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
}

// Usage in your routes
app.get('/protected-route', authMiddleware, (req, res) => {
  // Access authenticated user via req.user
  res.json({ data: 'Protected data', user: req.user });
});
```

## Non-Browser Clients (Mobile Apps, CLI Tools)

For clients that don't support cookies (mobile apps, CLI tools), use token-based authentication:

```typescript
// Example for a mobile app using token auth
async function loginWithTokens(username, password) {
  try {
    const response = await fetch('https://api.tmpay.com/api/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store tokens securely
      await secureStorage.set('accessToken', data.accessToken);
      await secureStorage.set('refreshToken', data.refreshToken);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
}

// Making authenticated requests with token
async function fetchWithToken(endpoint) {
  const accessToken = await secureStorage.get('accessToken');
  
  try {
    const response = await fetch(`https://api.tmpay.com${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    // Handle 401 by refreshing token
    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return fetchWithToken(endpoint); // Retry with new token
      } else {
        throw new Error('Authentication failed');
      }
    }
    
    return response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Refreshing an expired token
async function refreshAccessToken() {
  const refreshToken = await secureStorage.get('refreshToken');
  
  try {
    const response = await fetch('https://api.tmpay.com/api/auth/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });
    
    const data = await response.json();
    
    if (data.success) {
      await secureStorage.set('accessToken', data.accessToken);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}
```

## Common Integration Patterns

### React Query Integration

```typescript
// src/lib/queryClient.ts

import { QueryClient } from '@tanstack/react-query';

// Create a custom fetcher that handles authentication
export async function queryFetcher(url) {
  const response = await fetch(url, {
    credentials: 'include' // Include session cookies
  });
  
  if (!response.ok) {
    // Handle authentication errors
    if (response.status === 401) {
      window.location.href = '/auth';
      throw new Error('Session expired');
    }
    
    throw new Error('API request failed');
  }
  
  return response.json();
}

// Configure query client with defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: ({ queryKey }) => queryFetcher(queryKey[0]),
      retry: 1,
      staleTime: 60000 // 1 minute
    }
  }
});
```

### Protected Routes in React

```typescript
// src/components/ProtectedRoute.tsx

import { Redirect } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';

export function ProtectedRoute({ component: Component }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['auth/status'],
    queryFn: () => apiRequest('/api/auth/status'),
    retry: false
  });
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (error || !data?.isAuthenticated) {
    return <Redirect to="/auth" />;
  }
  
  return <Component />;
}

// Usage
import { Route, Switch } from 'wouter';
import { ProtectedRoute } from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/auth-page';

function App() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
    </Switch>
  );
}
```

## Testing Authentication

### Testing with Jest and React Testing Library

```typescript
// src/components/__tests__/Login.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../LoginForm';
import { apiRequest } from '@/lib/api-client';

// Mock the apiRequest function
jest.mock('@/lib/api-client', () => ({
  apiRequest: jest.fn()
}));

describe('LoginForm', () => {
  test('submits username and password', async () => {
    // Mock successful login
    (apiRequest as jest.Mock).mockResolvedValueOnce({ 
      success: true, 
      user: { id: 1, username: 'testuser' } 
    });
    
    render(<LoginForm />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' }
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Verify API was called correctly
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ username: 'testuser', password: 'password123' })
        })
      );
    });
  });
  
  test('displays error message on failed login', async () => {
    // Mock failed login
    (apiRequest as jest.Mock).mockRejectedValueOnce(new Error('Invalid credentials'));
    
    render(<LoginForm />);
    
    // Fill out and submit the form
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' }
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
```

## Security Best Practices

1. **Always use HTTPS**
   - Ensure all authentication traffic is encrypted
   - Set the `Secure` flag on cookies in production

2. **Implement proper CORS**
   - Restrict access to trusted origins
   - Be careful with `credentials: 'include'` and CORS settings

3. **Use HTTPOnly cookies**
   - Prevent JavaScript access to session cookies
   - Mitigates XSS attacks against authentication

4. **Implement rate limiting**
   - Limit login attempts to prevent brute force attacks
   - Apply IP-based rate limiting on authentication endpoints

5. **Handle token storage securely**
   - Never store tokens in localStorage (vulnerable to XSS)
   - For web: Use HttpOnly cookies
   - For mobile: Use secure storage mechanisms (Keychain/KeyStore)

6. **Implement proper logout**
   - Clear all authentication data on both client and server
   - Invalidate sessions and tokens on logout

## Troubleshooting

### Common Issues and Solutions

#### "Authentication Failed" Errors

- Check if cookies are being properly sent
- Verify that CORS is properly configured
- Ensure the session is still valid on the server

```typescript
// Test if cookies are being sent
fetch('/api/auth/status', {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
```

#### CORS Issues

If you're getting CORS errors when credentials are included:

```
Access to fetch at 'https://api.tmpay.com/api/user/info' from origin 'https://app.tmpay.com' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the 
requested resource.
```

Ensure your server has the correct CORS configuration:

```typescript
// Server-side CORS configuration (Express)
import cors from 'cors';

app.use(cors({
  origin: ['https://app.tmpay.com'], // Whitelist specific origins
  credentials: true, // Allow credentials (cookies)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

#### Session Not Persisting

- Check if cookies are being properly set
- Verify that the session store (PostgreSQL) is working correctly
- Ensure cookies aren't being blocked by browser settings

```typescript
// Debugging session issues
app.get('/api/debug/session', (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    res.json({
      sessionID: req.sessionID,
      session: req.session,
      user: req.user
    });
  } else {
    res.status(404).json({ message: 'Not available in production' });
  }
});
```

## API Reference

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Authenticate and create session |
| `/api/auth/logout` | POST | End session and logout |
| `/api/auth/token` | POST | Get access token (for non-browser clients) |
| `/api/auth/refresh-token` | POST | Refresh an expired access token |
| `/api/auth/register` | POST | Create a new user account |
| `/api/auth/verify-username` | POST | Verify if username exists and is allowed |
| `/api/auth/status` | GET | Check authentication status |
| `/api/user/info` | GET | Get current user information |

### Request/Response Examples

#### Login (Session Authentication)

Request:
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "user123",
  "password": "secure_password"
}
```

Response:
```json
{
  "success": true,
  "user": {
    "id": 42,
    "username": "user123",
    "email": "user@example.com",
    "balance": "1000.00",
    "isVip": false
  },
  "message": "Login successful"
}
```

#### Get User Info

Request:
```http
GET /api/user/info
Cookie: connect.sid=s%3A9OpQpZsR1L9LC...
```

Response:
```json
{
  "success": true,
  "user": {
    "username": "user123",
    "email": "user@example.com",
    "balance": "1000.00",
    "pendingBalance": "0.00",
    "isVip": false,
    "casinoUsername": "casino_user123",
    "casinoClientId": 12345
  }
}
```

#### Token Authentication (Non-Browser Clients)

Request:
```http
POST /api/auth/token
Content-Type: application/json

{
  "username": "user123",
  "password": "secure_password"
}
```

Response:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

#### Using Access Token

Request:
```http
GET /api/user/info
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Response: (same as session-based authentication)