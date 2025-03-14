
/**
 * API client utility for making authenticated requests
 */

export async function apiRequest(
  method: string,
  endpoint: string,
  body?: any,
  headers?: Record<string, string>
) {
  // Get auth token from localStorage if available
  const userData = localStorage.getItem('userData');
  let token = '';
  
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      token = parsed.accessToken || '';
    } catch (e) {
      console.error('Error parsing user data from localStorage', e);
    }
  }
  
  // Build request options
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...headers,
    },
    credentials: 'include',
  };
  
  // Add body for non-GET requests
  if (method !== 'GET' && body) {
    options.body = JSON.stringify(body);
  }
  
  // Make the request
  const res = await fetch(endpoint, options);
  
  return res;
}
