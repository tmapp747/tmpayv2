import React, { useState } from 'react';
import { Transaction } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { TRANSACTION_TYPES, PAYMENT_STATUS } from '@/lib/constants';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import TransactionStatusTimeline from '../TransactionStatusTimeline';
import { TransactionDetailsModal } from '../TransactionDetailsModal';

interface MobileTransactionHistoryProps {
  transactions: Transaction[];
  className?: string;
}

export const MobileTransactionHistory = ({ 
  transactions, 
  className = '' 
}: MobileTransactionHistoryProps) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className={cn("flex flex-col p-4 text-center", className)}>
        <p className="text-gray-500">No transaction history yet</p>
      </div>
    );
  }
  
  // Sort transactions by createdAt (newest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className={cn("flex flex-col divide-y divide-gray-100", className)}>
      {sortedTransactions.map((transaction) => (
        <TransactionItem key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
};

const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const {
    id,
    type,
    method,
    amount,
    status,
    currency,
    createdAt
  } = transaction;
  
  // Format the creation date as a relative time (e.g., "3 hours ago")
  const relativeTime = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  
  // Determine status badge color
  const statusColor = 
    status === 'completed' ? 'bg-green-100 text-green-800' :
    status === 'payment_completed' ? 'bg-blue-100 text-blue-800' :
    status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
    status === 'failed' ? 'bg-red-100 text-red-800' : 
    'bg-gray-100 text-gray-800';
  
  // Format amount with plus/minus sign and currency symbol
  const formattedAmount = `${type.includes('deposit') ? '+' : '-'} ${amount} ${currency}`;
  
  // Get readable type label
  const typeLabel = TRANSACTION_TYPES[type as keyof typeof TRANSACTION_TYPES] || type;
  
  // Get readable status label
  const statusLabel = PAYMENT_STATUS[status as keyof typeof PAYMENT_STATUS] || status;
  
  return (
    <>
      <div 
        className="p-4 flex flex-col space-y-2 active:bg-blue-50 transition-colors cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium text-sm">{typeLabel}</h4>
            <p className="text-xs text-gray-500">{relativeTime}</p>
          </div>
          <span className={`font-semibold ${type.includes('deposit') ? 'text-green-600' : 'text-red-600'}`}>
            {formattedAmount}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <Badge className={`text-xs ${statusColor}`}>
            {statusLabel}
          </Badge>
          <span className="text-xs text-gray-500">
            via {method.toUpperCase()}
          </span>
        </div>
        
        {/* Show the timeline for payment_completed and completed statuses */}
        {(status === 'payment_completed' || (status === 'completed' && transaction.metadata?.casinoTransferStatus)) && (
          <TransactionStatusTimeline transaction={transaction} />
        )}
      </div>
      
      {/* Transaction Details Modal */}
      <TransactionDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        transactionId={id} 
      />
    </>
  );
};

export default MobileTransactionHistory;