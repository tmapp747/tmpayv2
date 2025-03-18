import React from 'react';
import { Transaction } from '@/lib/types';
import { 
  ArrowRightIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  AlertCircleIcon,
  ClockIcon
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { TRANSACTION_TYPES } from '@/lib/constants';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TransactionStatusTimelineProps {
  transaction: Transaction;
  className?: string;
}

export function TransactionStatusTimeline({ transaction, className = '' }: TransactionStatusTimelineProps) {
  if (!transaction) return null;
  
  const { status, metadata } = transaction;
  
  // For the payment_completed status, we show both the payment and casino transfer status
  const isPaymentCompleted = status === 'payment_completed';
  const isFullyCompleted = status === 'completed';
  
  // The metadata contains the detailed status information for each step
  const casinoTransferStatus = metadata?.casinoTransferStatus || 'pending';
  const paymentCompletedAt = metadata?.paymentCompletedAt ? new Date(metadata.paymentCompletedAt) : null;
  const casinoTransferCompletedAt = metadata?.casinoTransferCompletedAt ? new Date(metadata.casinoTransferCompletedAt) : null;
  const casinoTransferError = metadata?.casinoTransferError;
  
  // If the transaction is fully completed, both steps are successful
  // If the transaction is payment_completed, then only the payment is completed
  const isPaymentSuccessful = isPaymentCompleted || isFullyCompleted;
  const isCasinoSuccessful = isFullyCompleted || (isPaymentCompleted && casinoTransferStatus === 'completed');
  const isCasinoFailed = isPaymentCompleted && casinoTransferStatus === 'failed';
  const isCasinoPending = isPaymentCompleted && casinoTransferStatus === 'pending';
  
  // Format the timestamp if valid
  const formatTime = (date: Date | null) => {
    if (!date || !isValid(date)) return null;
    return format(date, 'h:mm a');
  };
  
  const paymentTime = formatTime(paymentCompletedAt);
  const casinoTime = formatTime(casinoTransferCompletedAt);
  
  if (transaction.type !== 'casino_deposit') {
    // For non-casino transactions, show a simpler status
    return (
      <div className={`flex flex-col w-full my-2 ${className}`}>
        <div className="flex items-center justify-center text-sm">
          <div className="flex flex-col items-center">
            {status === 'completed' ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : status === 'pending' ? (
              <ClockIcon className="h-5 w-5 text-yellow-500" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-500" />
            )}
            <span className="text-xs mt-1">
              {status === 'completed' ? 'Completed' : 
               status === 'pending' ? 'Pending' : 'Failed'}
            </span>
          </div>
        </div>
      </div>
    );
  }
  
  // For casino deposits, show the dual-state timeline
  return (
    <div className={`flex flex-col w-full my-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        {/* Payment Verification Step */}
        <div className="flex flex-col items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                {isPaymentSuccessful ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : status === 'pending' ? (
                  <ClockIcon className="h-5 w-5 text-yellow-500" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p>Payment {isPaymentSuccessful ? 'verified' : status}</p>
                {paymentTime && <p className="text-xs">at {paymentTime}</p>}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="text-xs mt-1">Payment</span>
          {paymentTime && <span className="text-[10px] text-gray-500">{paymentTime}</span>}
        </div>
        
        {/* Connection Line */}
        <div className="flex-1 mx-2 flex items-center">
          <div className="h-0.5 w-full bg-gray-300"></div>
          <ArrowRightIcon className="h-4 w-4 text-gray-400" />
        </div>
        
        {/* Casino Transfer Step */}
        <div className="flex flex-col items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                {isCasinoSuccessful ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : isCasinoFailed ? (
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                ) : (
                  <ClockIcon className="h-5 w-5 text-yellow-500" />
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p>Casino transfer {isCasinoSuccessful ? 'completed' : isCasinoFailed ? 'failed' : 'pending'}</p>
                {casinoTime && <p className="text-xs">at {casinoTime}</p>}
                {isCasinoFailed && casinoTransferError && (
                  <p className="text-xs text-red-500">{casinoTransferError}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="text-xs mt-1">Casino</span>
          {casinoTime && <span className="text-[10px] text-gray-500">{casinoTime}</span>}
        </div>
      </div>
      
      {/* Status Message */}
      <div className="text-xs text-center mt-2 text-gray-500">
        {isCasinoSuccessful ? (
          <span className="text-green-600">Funds transferred to casino account</span>
        ) : isCasinoFailed ? (
          <span className="text-red-600">Casino transfer failed. Support notified.</span>
        ) : isPaymentSuccessful ? (
          <span className="text-yellow-600">Payment verified. Casino transfer in progress...</span>
        ) : (
          <span>Transaction {status}</span>
        )}
      </div>
    </div>
  );
}

export default TransactionStatusTimeline;