import React, { useState, useRef, useEffect } from 'react';
import { Transaction } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { TRANSACTION_TYPES, PAYMENT_STATUS } from '@/lib/constants';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle2, RefreshCw, Clock, XCircle } from 'lucide-react';
import TransactionStatusTimeline from '../TransactionStatusTimeline';
import { TransactionDetailsModal } from '../TransactionDetailsModal';

interface EnhancedTransactionCardProps {
  transaction: Transaction;
  isUpdated?: boolean;
  className?: string;
}

export const EnhancedTransactionCard = ({ 
  transaction, 
  isUpdated = false,
  className = '' 
}: EnhancedTransactionCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const {
    id,
    type,
    method,
    amount,
    status,
    currency = 'PHP',
    createdAt,
    metadata
  } = transaction;
  
  // Format the creation date as a relative time (e.g., "3 hours ago")
  const relativeTime = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  
  // Get readable type label
  const typeLabel = TRANSACTION_TYPES[type as keyof typeof TRANSACTION_TYPES] || type;
  
  // Get readable status label
  const statusLabel = PAYMENT_STATUS[status as keyof typeof PAYMENT_STATUS] || status;
  
  // Format amount with plus/minus sign and currency symbol
  const formattedAmount = `${type.includes('deposit') ? '+' : '-'} ${amount} ${currency}`;
  
  // Determine status icon and color
  const getStatusIconAndColor = () => {
    switch(status) {
      case 'completed':
        return { 
          icon: <CheckCircle2 className="w-4 h-4" />, 
          color: 'bg-green-100 text-green-800 border-green-200' 
        };
      case 'payment_completed':
        return { 
          icon: <RefreshCw className="w-4 h-4 animate-spin" />, 
          color: 'bg-blue-100 text-blue-800 border-blue-200' 
        };
      case 'pending':
        return { 
          icon: <Clock className="w-4 h-4" />, 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
        };
      case 'failed':
        return { 
          icon: <XCircle className="w-4 h-4" />, 
          color: 'bg-red-100 text-red-800 border-red-200' 
        };
      default:
        return { 
          icon: <Clock className="w-4 h-4" />, 
          color: 'bg-gray-100 text-gray-800 border-gray-200' 
        };
    }
  };
  
  const { icon, color } = getStatusIconAndColor();
  
  // Handle animation when transaction is updated
  useEffect(() => {
    if (isUpdated && cardRef.current) {
      // Scroll the card into view when it's updated
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isUpdated]);
  
  return (
    <motion.div
      ref={cardRef}
      initial={isUpdated ? { scale: 0.95, opacity: 0.8 } : false}
      animate={isUpdated 
        ? { 
            scale: [0.95, 1.05, 1],
            opacity: [0.8, 1],
            backgroundColor: ['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0)', 'rgba(0, 0, 0, 0)']
          } 
        : { scale: 1, opacity: 1 }
      }
      transition={{ duration: 0.5 }}
      className={cn(
        "border-b last:border-b-0 border-gray-100/10 overflow-hidden",
        className
      )}
    >
      <div 
        className="p-4 space-y-3 active:bg-white/5 transition-colors cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Top section with type, amount and time */}
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium text-sm text-white">{typeLabel}</h4>
            <p className="text-xs text-gray-400">{relativeTime}</p>
          </div>
          <span className={`font-semibold ${type.includes('deposit') ? 'text-green-400' : 'text-red-400'}`}>
            {formattedAmount}
          </span>
        </div>
        
        {/* Status and method section */}
        <div className="flex justify-between items-center">
          <Badge className={`flex items-center gap-1 text-xs border ${color}`}>
            {icon}
            {statusLabel}
          </Badge>
          <span className="text-xs text-gray-400">
            via {method.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        
        {/* Expand button for timeline */}
        {(status === 'payment_completed' || (status === 'completed' && metadata?.casinoTransferStatus)) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {isExpanded ? 'Hide details' : 'View progress'}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </button>
        )}
        
        {/* Expandable timeline section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-2 bg-white/5 rounded-md mt-2">
                <TransactionStatusTimeline transaction={transaction} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Transaction Details Modal */}
      <TransactionDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        transactionId={id} 
      />
    </motion.div>
  );
};

export default EnhancedTransactionCard;