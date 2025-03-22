/**
 * Re-export auth components from use-auth-manager
 * 
 * This file exists solely to maintain backward compatibility with existing code
 * that imports from use-auth.tsx. All actual implementation has been moved to
 * use-auth-manager.tsx for better code organization and maintenance.
 */

import { AuthProvider, useAuth } from './use-auth-manager';

// Export the components and hooks
export { AuthProvider, useAuth };