import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction } from '@/lib/types';
import { useTransactionUpdates } from '@/hooks/use-transaction-updates';
import { EnhancedTransactionCard } from './EnhancedTransactionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';

interface EnhancedTransactionListProps {
  className?: string;
  pollingInterval?: number;
  showEmptyState?: boolean;
}

export const EnhancedTransactionList = ({
  className = '',
  pollingInterval = 8000, // 8 seconds
  showEmptyState = true
}: EnhancedTransactionListProps) => {
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  
  // Use custom hook for real-time transaction updates
  const { 
    transactions, 
    isLoading, 
    error, 
    refetch, 
    updatedTransactionIds 
  } = useTransactionUpdates({ 
    pollingInterval,
    onTransactionUpdate: (tx) => {
      // Show toast notification for important status changes
      if (tx.status === 'completed') {
        toast({
          title: 'Transaction Completed',
          description: `Your ${tx.type.replace('_', ' ')} for ${tx.amount} ${tx.currency || 'PHP'} was successful.`,
          variant: 'default',
        });
      } else if (tx.status === 'failed') {
        toast({
          title: 'Transaction Failed',
          description: `Your ${tx.type.replace('_', ' ')} for ${tx.amount} ${tx.currency || 'PHP'} failed.`,
          variant: 'destructive',
        });
      }
    }
  });
  
  // Manual refresh handler with animation
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  };
  
  // Graceful empty state
  if (!isLoading && transactions.length === 0 && showEmptyState) {
    return (
      <div className="py-10 px-4 text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-gray-800/50 mb-4 flex items-center justify-center">
          <RefreshCw className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No Transactions Yet</h3>
        <p className="text-sm text-gray-400 mb-6">
          Start your first transaction to see your history here
        </p>
        <Link href="/mobile/deposit">
          <a className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Make a Deposit
          </a>
        </Link>
      </div>
    );
  }

  // Error state
  if (error && !isLoading) {
    return (
      <div className="py-6 px-4 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-500/20 mb-3 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-base font-medium text-white mb-1">Failed to Load Transactions</h3>
        <p className="text-sm text-gray-400 mb-4">
          There was a problem loading your transaction history
        </p>
        <button
          onClick={handleManualRefresh}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-gray-600 focus:outline-none"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Refresh control */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100/10">
        <span className="text-xs text-gray-400">
          {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
        </span>
        <button
          onClick={handleManualRefresh}
          disabled={isLoading || refreshing}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <motion.div
            animate={{ rotate: refreshing ? 360 : 0 }}
            transition={{ duration: 1, ease: "linear", repeat: refreshing ? Infinity : 0 }}
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </motion.div>
        </button>
      </div>

      {/* Skeleton loader */}
      {isLoading && transactions.length === 0 ? (
        <div className="divide-y divide-gray-100/10">
          {[1, 2, 3].map((item) => (
            <div key={item} className="p-4 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24 bg-white/10" />
                <Skeleton className="h-4 w-16 bg-white/10" />
              </div>
              <Skeleton className="h-3 w-20 bg-white/10" />
              <div className="flex justify-between pt-1">
                <Skeleton className="h-5 w-20 rounded-full bg-white/10" />
                <Skeleton className="h-3 w-12 bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {transactions.map((transaction) => (
            <motion.div
              key={transaction.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <EnhancedTransactionCard
                transaction={transaction}
                isUpdated={updatedTransactionIds.includes(transaction.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
};

export default EnhancedTransactionList;