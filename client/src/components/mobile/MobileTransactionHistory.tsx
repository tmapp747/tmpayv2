import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, X, Clock, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Transaction } from "@/lib/types";

export default function MobileTransactionHistory() {
  const [filter, setFilter] = useState<string | null>(null);
  
  const { data, isLoading, error } = useQuery<{ success: boolean; transactions: Transaction[] }>({
    queryKey: ['/api/transactions'],
    enabled: true,
    refetchInterval: 5000, // Poll every 5 seconds to show real-time updates
  });
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Check size={16} className="text-green-500" />;
      case "failed":
        return <X size={16} className="text-red-500" />;
      case "pending":
      case "processing":
        return <Clock size={16} className="text-yellow-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getMethodIcon = (method: string) => {
    if (method.toLowerCase().includes('gcash')) {
      return (
        <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center mr-3">
          <img src="/images/gcash.png" alt="GCash" className="w-6 h-6 rounded-full" />
        </div>
      );
    }
    
    return (
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-3">
        {method.toLowerCase().includes('deposit') ? (
          <ArrowDown size={16} className="text-white" />
        ) : (
          <ArrowUp size={16} className="text-white" />
        )}
      </div>
    );
  };

  const getTransactionTypeLabel = (type: string, method: string) => {
    if (method.toLowerCase().includes('gcash')) {
      return "GCash Deposit";
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
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
        <p className="text-blue-300 text-sm">Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
        <p className="text-red-500 text-sm">Failed to load transactions</p>
      </div>
    );
  }

  const transactions = data?.transactions || [];
  const hasTransactions = transactions.length > 0;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
        <div className="flex space-x-1">
          <button 
            className={`px-2 py-1 text-xs rounded-full ${filter === 'gcash' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white/10 text-blue-300'}`}
            onClick={() => setFilter(filter === 'gcash' ? null : 'gcash')}
          >
            GCash
          </button>
          <button 
            className={`px-2 py-1 text-xs rounded-full ${filter === 'casino' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white/10 text-blue-300'}`}
            onClick={() => setFilter(filter === 'casino' ? null : 'casino')}
          >
            Casino
          </button>
        </div>
      </div>

      {!hasTransactions ? (
        <div className="bg-white/5 rounded-xl p-6 text-center">
          <p className="text-blue-300 text-sm">No transactions found</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {transactions
              .filter(tx => {
                if (!filter) return true;
                if (filter === 'gcash') return tx.method?.toLowerCase().includes('gcash');
                if (filter === 'casino') return tx.type?.includes('casino');
                return true;
              })
              .slice(0, 10)
              .map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={`bg-white/5 backdrop-blur-sm rounded-xl p-3 border-l-4 ${getStatusColor(
                    transaction.status
                  )}`}
                >
                  <div className="flex items-start">
                    {getMethodIcon(transaction.method || '')}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-white text-sm font-medium">
                            {getTransactionTypeLabel(transaction.type, transaction.method || '')}
                          </h4>
                          <p className="text-blue-300 text-xs">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${
                            transaction.type.includes('deposit')
                              ? 'text-green-400'
                              : 'text-white'
                          }`}>
                            {transaction.type.includes('deposit') ? '+' : '-'}
                            ₱{formatCurrency(Number(transaction.amount), '')}
                          </p>
                          <div className="flex items-center justify-end mt-1">
                            {getStatusIcon(transaction.status)}
                            <span className={`text-xs ml-1 ${
                              transaction.status === 'completed'
                                ? 'text-green-400'
                                : transaction.status === 'failed'
                                ? 'text-red-400'
                                : 'text-yellow-400'
                            }`}>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}