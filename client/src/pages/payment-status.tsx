import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Hexagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MobilePaymentStatus from '@/components/mobile/MobilePaymentStatus';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';

const PaymentStatusPage = () => {
  const [location, navigate] = useLocation();
  const { isLoggedIn } = useAuth();
  
  // Extract reference and id from URL query params
  const searchParams = new URLSearchParams(window.location.search);
  const reference = searchParams.get('reference');
  const transactionId = searchParams.get('id') ? Number(searchParams.get('id')) : undefined;
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      // Store current URL to redirect back after authentication
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
      navigate('/mobile/auth');
    }
  }, [isLoggedIn, navigate]);
  
  if (!isLoggedIn) {
    return null; // Don't render anything while redirecting
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001138] to-[#002D87] text-white">
      {/* Header */}
      <header className="p-4 sticky top-0 z-40 backdrop-blur-md bg-[#00174F]/70">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="rounded-full h-10 w-10 p-0 mr-3 text-white"
            onClick={() => navigate('/mobile/wallet')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Payment Status</h1>
            <p className="text-sm text-blue-300">Track your transaction</p>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <motion.div 
        className="p-4 pt-2 pb-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {(!reference && !transactionId) ? (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
            <Hexagon className="h-16 w-16 text-blue-400 mb-2" />
            <h2 className="text-xl font-semibold">No Transaction Information</h2>
            <p className="text-blue-200">
              No reference or transaction ID was provided to check the status.
            </p>
            <Button
              className="mt-4"
              onClick={() => navigate('/mobile/wallet')}
            >
              Return to Wallet
            </Button>
          </div>
        ) : (
          <MobilePaymentStatus 
            reference={reference || undefined} 
            transactionId={transactionId} 
          />
        )}
      </motion.div>
    </div>
  );
};

export default PaymentStatusPage;