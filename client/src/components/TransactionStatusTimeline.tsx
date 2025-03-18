import React from 'react';
import { format } from 'date-fns';
import { Check, Clock, X, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface TransactionStatusTimelineProps {
  paymentStatus: 'pending' | 'completed' | 'failed';
  casinoTransferStatus: 'pending' | 'completed' | 'failed';
  paymentCompletedAt?: string;
  casinoTransferCompletedAt?: string;
  interactive?: boolean; // Enable interactive features
}

export function TransactionStatusTimeline({ 
  paymentStatus, 
  casinoTransferStatus, 
  paymentCompletedAt, 
  casinoTransferCompletedAt,
  interactive = false
}: TransactionStatusTimelineProps) {
  
  // Format the timestamps
  const formattedPaymentTime = paymentCompletedAt 
    ? format(new Date(paymentCompletedAt), 'h:mm a')
    : null;
    
  const formattedCasinoTime = casinoTransferCompletedAt 
    ? format(new Date(casinoTransferCompletedAt), 'h:mm a')
    : null;

  // Interactive states for tooltips
  const [isPaymentHovered, setIsPaymentHovered] = React.useState(false);
  const [isCasinoHovered, setIsCasinoHovered] = React.useState(false);

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <Check size={12} className="text-white" />;
      case 'failed': return <X size={12} className="text-white" />;
      case 'pending': return <Clock size={12} className="text-white" />;
      default: return <Clock size={12} className="text-white" />;
    }
  };
  
  // Tooltip content for each step
  const paymentTooltip = () => {
    if (paymentStatus === 'completed') {
      return `Payment verified at ${formattedPaymentTime || 'unknown time'}`;
    } else if (paymentStatus === 'failed') {
      return 'Payment verification failed';
    } else {
      return 'Payment verification in progress';
    }
  };
  
  const casinoTooltip = () => {
    if (casinoTransferStatus === 'completed') {
      return `Casino transfer completed at ${formattedCasinoTime || 'unknown time'}`;
    } else if (casinoTransferStatus === 'failed') {
      return 'Casino transfer failed - contact support';
    } else {
      return 'Casino transfer in progress';
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* Timeline container */}
      <div className="relative flex items-center justify-between w-full px-2 py-1">
        {/* Step 1: Payment Verification */}
        <div 
          className={`relative z-10 ${interactive ? 'cursor-pointer' : ''}`}
          onMouseEnter={interactive ? () => setIsPaymentHovered(true) : undefined}
          onMouseLeave={interactive ? () => setIsPaymentHovered(false) : undefined}
        >
          <div 
            className={`w-6 h-6 rounded-full flex items-center justify-center ${getStatusColor(paymentStatus)}`}
          >
            {getStatusIcon(paymentStatus)}
          </div>
          
          {/* Payment step label */}
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <span className="text-[10px] text-blue-300">Payment</span>
          </div>
          
          {/* Interactive tooltip */}
          {interactive && isPaymentHovered && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-950 text-white text-xs py-1 px-2 rounded shadow-lg"
            >
              {paymentTooltip()}
            </motion.div>
          )}
          
          {/* Always show time for completed steps */}
          {paymentStatus === 'completed' && formattedPaymentTime && (
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <span className="text-[9px] text-green-300">{formattedPaymentTime}</span>
            </div>
          )}
        </div>
        
        {/* Connecting line */}
        <div className="flex-1 h-[2px] mx-1 relative">
          <div className={`absolute inset-0 ${
            paymentStatus === 'completed' 
              ? casinoTransferStatus === 'completed' 
                ? 'bg-green-500' 
                : casinoTransferStatus === 'failed'
                  ? 'bg-gradient-to-r from-green-500 to-red-500'
                  : 'bg-gradient-to-r from-green-500 to-yellow-500'
              : 'bg-gray-600'
          }`}></div>
          
          {/* Arrow for progress indication */}
          {paymentStatus === 'completed' && casinoTransferStatus === 'pending' && (
            <motion.div 
              className="absolute top-1/2 transform -translate-y-1/2"
              initial={{ left: '0%' }}
              animate={{ left: ['30%', '60%', '30%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
            >
              <ArrowRight size={10} className="text-yellow-400" />
            </motion.div>
          )}
        </div>
        
        {/* Step 2: Casino Transfer */}
        <div 
          className={`relative z-10 ${interactive ? 'cursor-pointer' : ''}`}
          onMouseEnter={interactive ? () => setIsCasinoHovered(true) : undefined}
          onMouseLeave={interactive ? () => setIsCasinoHovered(false) : undefined}
        >
          <div 
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              paymentStatus === 'completed' 
                ? getStatusColor(casinoTransferStatus) 
                : 'bg-gray-600'
            }`}
          >
            {paymentStatus === 'completed' 
              ? getStatusIcon(casinoTransferStatus) 
              : <Clock size={12} className="text-gray-300" />}
          </div>
          
          {/* Casino step label */}
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <span className="text-[10px] text-blue-300">Casino</span>
          </div>
          
          {/* Interactive tooltip */}
          {interactive && isCasinoHovered && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-950 text-white text-xs py-1 px-2 rounded shadow-lg"
            >
              {casinoTooltip()}
            </motion.div>
          )}
          
          {/* Always show time for completed steps */}
          {casinoTransferStatus === 'completed' && formattedCasinoTime && (
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <span className="text-[9px] text-green-300">{formattedCasinoTime}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Status indicator for overall process */}
      <div className="mt-3 text-center">
        {paymentStatus === 'completed' && casinoTransferStatus === 'completed' && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] text-green-400"
          >
            Transaction complete
          </motion.span>
        )}
        {paymentStatus === 'completed' && casinoTransferStatus === 'pending' && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-[10px] text-yellow-400"
          >
            Processing final transfer
          </motion.span>
        )}
        {paymentStatus === 'completed' && casinoTransferStatus === 'failed' && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] text-red-400"
          >
            Casino transfer failed
          </motion.span>
        )}
      </div>
    </div>
  );
}