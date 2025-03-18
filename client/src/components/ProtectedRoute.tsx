import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading, refreshToken } = useAuth();
  const [, navigate] = useLocation();
  const [isValidating, setIsValidating] = useState(false);
  const [validationAttempted, setValidationAttempted] = useState(false);

  // First load - try to validate the session if needed
  useEffect(() => {
    const validateSession = async () => {
      if (!user && !isLoading && !validationAttempted) {
        setIsValidating(true);
        setValidationAttempted(true);
        
        try {
          console.log('ProtectedRoute: Attempting to validate session on first load');
          // Attempt to refresh the session
          await refreshToken('');
          
          // We don't need to check the result here
          // The useAuth hook will update its state based on the refreshToken result
        } catch (error) {
          console.error('Session validation failed:', error);
        } finally {
          setIsValidating(false);
        }
      }
    };
    
    validateSession();
  }, [user, isLoading, refreshToken, validationAttempted]);

  // Redirect if needed after verification attempt
  useEffect(() => {
    if (!isLoading && !isValidating && !user) {
      console.log('ProtectedRoute: Redirecting to auth page');
      // Redirect to auth page
      navigate('/auth');
    }
  }, [user, isLoading, isValidating, navigate]);

  // Show loading spinner during initial load or validation
  if (isLoading || isValidating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#001138] to-[#002D87]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-white/70 text-sm">{isValidating ? 'Validating session...' : 'Loading...'}</p>
      </div>
    );
  }

  // Will redirect to /auth in the useEffect
  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;