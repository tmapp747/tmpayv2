import React, { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { ArrowLeft, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import Sparkles from '@/components/ui/sparkles';
import { hapticFeedback } from '@/lib/mobile-utils';
import useIsMobile from '@/hooks/use-mobile';

type PaymentStatus = "completed" | "failed" | "pending";

interface PaymentParams {
  status: PaymentStatus;
  amount: string;
  transactionId: string;
}

export default function MobileThankYouPage() {
  const [, setLocation] = useLocation();
  const params = useParams<PaymentParams>();
  const isMobile = useIsMobile();
  const [showSparkles, setShowSparkles] = useState(false);
  
  // Destructure params with defaults
  const { 
    status = 'pending', 
    amount = '0', 
    transactionId = '0'
  } = params;
  
  // Format amount to display with proper currency symbol
  const formattedAmount = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(Number(amount));

  // Set up different content based on status
  const statusConfig = {
    completed: {
      title: 'Payment Successful!',
      icon: <CheckCircle className="h-16 w-16 text-emerald-500" />,
      message: `Your payment of ${formattedAmount} has been successfully processed.`,
      buttonText: 'View Transaction',
      buttonAction: () => setLocation('/mobile/history'),
      color: 'bg-emerald-500'
    },
    failed: {
      title: 'Payment Failed',
      icon: <AlertCircle className="h-16 w-16 text-red-500" />,
      message: 'We encountered an issue processing your payment. Please try again.',
      buttonText: 'Try Again',
      buttonAction: () => setLocation('/mobile/deposit'),
      color: 'bg-red-500'
    },
    pending: {
      title: 'Payment Processing',
      icon: <Clock className="h-16 w-16 text-amber-500" />,
      message: `Your payment of ${formattedAmount} is being processed. Please wait.`,
      buttonText: 'Check Status',
      buttonAction: () => setLocation('/mobile/history'),
      color: 'bg-amber-500'
    }
  };

  const currentStatus = statusConfig[status] || statusConfig.pending;

  // Apply haptic feedback on component mount
  useEffect(() => {
    if (isMobile) {
      if (status === 'completed') {
        hapticFeedback('heavy');
        // Delay showing sparkles for better effect
        setTimeout(() => setShowSparkles(true), 300);
      } else if (status === 'failed') {
        hapticFeedback('medium');
      }
    }
  }, [status, isMobile]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="text-white"
          onClick={() => setLocation('/mobile/wallet')}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold text-white ml-2">Payment Status</h1>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {status === 'completed' ? (
          <Sparkles 
            isActive={showSparkles}
            count={50}
            color="#10b981"
            size={15}
            speed={0.8}
            fadeOut={true}
            className="w-full max-w-md"
          >
            <Card className="w-full max-w-md p-8 flex flex-col items-center gap-6 shadow-lg">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="rounded-full p-4 bg-emerald-100"
              >
                {currentStatus.icon}
              </motion.div>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold text-center"
              >
                {currentStatus.title}
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center text-gray-600"
              >
                {currentStatus.message}
              </motion.p>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-2 text-sm text-gray-500"
              >
                Transaction ID: {transactionId}
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-full"
              >
                <Button
                  className="w-full bg-emerald-500 hover:bg-emerald-600"
                  onClick={currentStatus.buttonAction}
                >
                  {currentStatus.buttonText}
                </Button>
              </motion.div>
            </Card>
          </Sparkles>
        ) : (
          <Card className="w-full max-w-md p-8 flex flex-col items-center gap-6 shadow-lg">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className={`rounded-full p-4 ${status === 'failed' ? 'bg-red-100' : 'bg-amber-100'}`}
            >
              {currentStatus.icon}
            </motion.div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold text-center"
            >
              {currentStatus.title}
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center text-gray-600"
            >
              {currentStatus.message}
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-sm text-gray-500"
            >
              Transaction ID: {transactionId}
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-full"
            >
              <Button
                className={`w-full ${status === 'failed' ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}
                onClick={currentStatus.buttonAction}
              >
                {currentStatus.buttonText}
              </Button>
            </motion.div>
          </Card>
        )}
      </div>
      
      {/* Footer navigation */}
      <div className="p-4 text-center">
        <p className="text-sm text-gray-400">
          Need assistance? <Link href="/mobile/support" className="text-blue-400 hover:underline">Contact Support</Link>
        </p>
      </div>
    </div>
  );
}