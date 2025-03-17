import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownToLine, ArrowUpRight, SquareStack } from "lucide-react";
import { Transaction } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function MobileTransactionsList() {
  const { data, isLoading, error } = useQuery<{ success: boolean; transactions: Transaction[] }>({
    queryKey: ['/api/transactions'],
    enabled: true,
    refetchInterval: 5000, // Poll every 5 seconds for fresh data
    staleTime: 0, // Consider data always stale to ensure fresh updates
  });

  // Get transaction icon based on type and method
  const getTransactionIcon = (transaction: Transaction) => {
    const type = transaction.type;
    const method = transaction.method || '';
    
    if (method.toLowerCase().includes('gcash')) {
      return (
        <div className="w-10 h-10 bg-blue-600/90 rounded-full flex items-center justify-center">
          <img src="/images/gcash.png" alt="GCash" className="w-6 h-6" 
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerHTML = 
                `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12H15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 9V15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <rect x="4" y="4" width="16" height="16" rx="2" stroke="white" strokeWidth="2"/>
                </svg>`;
            }}
          />
        </div>
      );
    }
    
    if (type === 'deposit' || type === 'casino_deposit') {
      return (
        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
          <ArrowDownToLine className="h-6 w-6 text-white" />
        </div>
      );
    }
    
    if (type === 'withdraw' || type === 'casino_withdraw') {
      return (
        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
          <ArrowUpRight className="h-6 w-6 text-white" />
        </div>
      );
    }
    
    return (
      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
        <SquareStack className="h-6 w-6 text-white" />
      </div>
    );
  };

  // Get transaction title based on type and method
  const getTransactionTitle = (transaction: Transaction) => {
    const type = transaction.type;
    const method = transaction.method || '';
    
    if (method.toLowerCase().includes('gcash')) {
      return "GCash Transaction";
    }
    
    switch (type) {
      case "deposit":
        return "Wallet Deposit";
      case "withdraw":
        return "Wallet Withdrawal";
      case "casino_deposit":
        return "Casino Deposit";
      case "casino_withdraw":
        return "Casino Withdrawal";
      case "transfer":
        return "Transfer";
      default:
        // Safely handle type formatting
        const transactionType = type as string; // Force type assertion since we've already checked it's a string
        return transactionType
          ? transactionType.charAt(0).toUpperCase() + transactionType.slice(1)
          : 'Transaction';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-400">Failed to load transactions</p>
      </div>
    );
  }

  const transactions = data?.transactions || [];
  
  // Show the 3 most recent transactions
  const recentTransactions = transactions.slice(0, 3);
  
  if (recentTransactions.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-400">No recent transactions</p>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div className="space-y-5 pt-2">
        {recentTransactions.map((transaction, index) => (
          <motion.div 
            key={transaction.id} 
            className="transaction-item"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <motion.div 
                className="transaction-icon shadow-md"
                whileHover={{ scale: 1.05 }}
              >
                {getTransactionIcon(transaction)}
              </motion.div>
              <div>
                <h3 className="font-medium">{getTransactionTitle(transaction)}</h3>
                <p className="text-xs text-gray-400">
                  {new Date(transaction.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {formatDate(transaction.createdAt)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={typeof transaction.type === 'string' && transaction.type.includes('deposit') 
                ? 'transaction-amount-positive font-semibold' 
                : 'transaction-amount-negative font-semibold'
              }>
                {typeof transaction.type === 'string' && transaction.type.includes('deposit') ? '+₱' : '-₱'}
                {formatCurrency(Number(transaction.amount), '')}
              </p>
              <span className={`text-xs ${
                transaction.status === 'completed'
                  ? 'text-green-400'
                  : transaction.status === 'failed'
                  ? 'text-red-400'
                  : transaction.status === 'expired'
                  ? 'text-gray-400'
                  : 'text-yellow-400'
              }`}>
                {(() => {
                  // Safely handle status formatting
                  const status = transaction.status as string; // Force type assertion
                  return status
                    ? status.charAt(0).toUpperCase() + status.slice(1)
                    : 'Unknown';
                })()}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}