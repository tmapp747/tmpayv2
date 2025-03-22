/**
 * Session Manager for 747 Casino E-Wallet
 * 
 * This module centralizes all session-related functionality:
 * - Session status tracking (active, expired, unknown)
 * - Server connectivity tracking
 * - Ping checks for server availability
 * - Browser online/offline detection
 * 
 * This provides a single source of truth for authentication and
 * connectivity state throughout the application.
 */

// Define session status types
export type SessionStatus = 'active' | 'expired' | 'unknown';

// Class to manage session and connectivity state
class SessionManager {
  // Track session status
  private _sessionStatus: SessionStatus = 'unknown';
  
  // Track server connectivity
  private _isServerUnreachable: boolean = false;
  
  // Event listeners for status changes
  private listeners: Map<string, Set<Function>> = new Map();
  
  // Timer for automatic ping checks
  private pingCheckInterval: number | null = null;
  
  // Last time we successfully contacted the server
  private lastSuccessfulServerContact: number | null = null;
  
  constructor() {
    // Initialize session status from localStorage if available
    const storedStatus = localStorage.getItem('sessionState');
    if (storedStatus === 'active' || storedStatus === 'expired') {
      this._sessionStatus = storedStatus;
    }
    
    // Set up browser online/offline event listeners
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Start regular ping checks
    this.startPingChecks();
    
    console.log('Session manager initialized with status:', this._sessionStatus);
  }
  
  // Getters for state
  get sessionStatus(): SessionStatus {
    return this._sessionStatus;
  }
  
  get isServerUnreachable(): boolean {
    return this._isServerUnreachable;
  }
  
  // Setters with event notifications
  setSessionStatus(status: SessionStatus): void {
    if (this._sessionStatus !== status) {
      this._sessionStatus = status;
      localStorage.setItem('sessionState', status);
      this.notifyListeners('sessionStatus', status);
      console.log('Session status changed to:', status);
    }
  }
  
  setServerUnreachable(unreachable: boolean): void {
    if (this._isServerUnreachable !== unreachable) {
      this._isServerUnreachable = unreachable;
      this.notifyListeners('serverUnreachable', unreachable);
      console.log('Server unreachable status changed to:', unreachable);
      
      if (!unreachable) {
        this.lastSuccessfulServerContact = Date.now();
      }
      
      // If the server becomes reachable again, clear the error count
      if (!unreachable) {
        localStorage.setItem('serverErrorCount', '0');
      }
    }
  }
  
  // Event handlers for online/offline
  private handleOnline = (): void => {
    console.log('Browser online event detected');
    // When we come back online, we'll ping the server to check true connectivity
    this.pingServer();
  }
  
  private handleOffline = (): void => {
    console.log('Browser offline event detected');
    // Mark server as unreachable when offline to prevent unnecessary requests
    this.setServerUnreachable(true);
  }
  
  // Ping the server to check connectivity
  async pingServer(): Promise<boolean> {
    if (!navigator.onLine) {
      console.log('Browser reports offline, skipping ping');
      return false;
    }
    
    try {
      console.log('Pinging server to check connectivity...');
      
      // Use our simple ping endpoint
      const response = await fetch('/api/ping', { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        // Very short timeout to prevent long waits
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        console.log('Server ping successful, server is reachable');
        this.setServerUnreachable(false);
        this.lastSuccessfulServerContact = Date.now();
        return true;
      } else {
        console.log('Server ping failed with status:', response.status);
        this.setServerUnreachable(true);
        return false;
      }
    } catch (error) {
      console.error('Server ping failed:', error);
      this.setServerUnreachable(true);
      return false;
    }
  }
  
  // Set up regular ping checks to ensure server is still available
  startPingChecks(intervalMs: number = 30000): void {
    // Clear any existing interval
    if (this.pingCheckInterval) {
      window.clearInterval(this.pingCheckInterval);
    }
    
    // Set up new interval
    this.pingCheckInterval = window.setInterval(() => {
      // Only ping if online and we think server might be unreachable
      // or if it's been more than 5 minutes since our last successful contact
      const fiveMinutes = 5 * 60 * 1000;
      const needsFreshnessCheck = 
        this.lastSuccessfulServerContact === null || 
        (Date.now() - this.lastSuccessfulServerContact) > fiveMinutes;
      
      if (navigator.onLine && (this._isServerUnreachable || needsFreshnessCheck)) {
        this.pingServer();
      }
    }, intervalMs);
    
    console.log(`Server ping checks started with interval of ${intervalMs}ms`);
  }
  
  // Stop ping checks (typically on cleanup)
  stopPingChecks(): void {
    if (this.pingCheckInterval) {
      window.clearInterval(this.pingCheckInterval);
      this.pingCheckInterval = null;
      console.log('Server ping checks stopped');
    }
  }
  
  // Event subscription for other components
  subscribe(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);
    
    // Return an unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
      }
    };
  }
  
  // Notify all listeners of an event
  private notifyListeners(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in session manager listener for event ${event}:`, error);
        }
      });
    }
  }
  
  // Cleanup method (for component unmounting)
  cleanup(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.stopPingChecks();
    this.listeners.clear();
    console.log('Session manager cleaned up');
  }
}

// Create a singleton instance
const sessionManager = new SessionManager();

// Export the singleton
export default sessionManager;