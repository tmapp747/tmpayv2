import React from 'react';
import { Check, ArrowRight, X, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionStatusTimelineProps {
  paymentStatus: 'pending' | 'completed' | 'failed';
  casinoTransferStatus?: 'pending' | 'completed' | 'failed' | 'not_started';
  paymentCompletedAt?: string;
  casinoTransferCompletedAt?: string;
  className?: string;
}

export function TransactionStatusTimeline({
  paymentStatus,
  casinoTransferStatus = 'not_started',
  paymentCompletedAt,
  casinoTransferCompletedAt,
  className
}: TransactionStatusTimelineProps) {
  
  // Format time to show only HH:MM
  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check size={14} className="text-green-500" />;
      case 'pending':
        return <Clock size={14} className="text-yellow-500 animate-pulse" />;
      case 'failed':
        return <X size={14} className="text-red-500" />;
      case 'not_started':
        return <Clock size={14} className="text-gray-400" />;
      default:
        return <Clock size={14} className="text-gray-400" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      case 'not_started':
      default:
        return 'bg-gray-300';
    }
  };

  // Get line color
  const getLineColor = () => {
    if (paymentStatus === 'failed') return 'bg-red-300';
    if (paymentStatus === 'completed' && casinoTransferStatus === 'failed') return 'bg-gradient-to-r from-green-400 to-red-400';
    if (paymentStatus === 'completed' && casinoTransferStatus === 'pending') return 'bg-gradient-to-r from-green-400 to-yellow-400';
    if (paymentStatus === 'completed' && casinoTransferStatus === 'completed') return 'bg-green-400';
    return 'bg-gray-300';
  };

  return (
    <div className={cn("flex items-center w-full", className)}>
      {/* Payment Step */}
      <div className="flex flex-col items-center">
        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", 
          paymentStatus === 'completed' ? 'bg-green-100 border border-green-500' : 
          paymentStatus === 'pending' ? 'bg-yellow-100 border border-yellow-500' :
          'bg-red-100 border border-red-500'
        )}>
          {getStatusIcon(paymentStatus)}
        </div>
        <div className="text-xs mt-1 font-medium">Payment</div>
        {paymentCompletedAt && (
          <div className="text-[10px] text-blue-400">{formatTime(paymentCompletedAt)}</div>
        )}
      </div>

      {/* Connecting Line */}
      <div className={cn("h-0.5 flex-1 mx-1", getLineColor())}></div>

      {/* Arrow Icon */}
      <div className="mx-1">
        <ArrowRight size={12} className="text-blue-400" />
      </div>

      {/* Connecting Line */}
      <div className={cn("h-0.5 flex-1 mx-1", getLineColor())}></div>

      {/* Casino Transfer Step */}
      <div className="flex flex-col items-center">
        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center",
          casinoTransferStatus === 'completed' ? 'bg-green-100 border border-green-500' : 
          casinoTransferStatus === 'pending' ? 'bg-yellow-100 border border-yellow-500' :
          casinoTransferStatus === 'failed' ? 'bg-red-100 border border-red-500' :
          'bg-gray-100 border border-gray-300'
        )}>
          {getStatusIcon(casinoTransferStatus)}
        </div>
        <div className="text-xs mt-1 font-medium">Casino</div>
        {casinoTransferCompletedAt && (
          <div className="text-[10px] text-blue-400">{formatTime(casinoTransferCompletedAt)}</div>
        )}
      </div>
    </div>
  );
}