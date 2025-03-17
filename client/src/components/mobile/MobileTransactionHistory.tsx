import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Check, X, Clock, ArrowUp, ArrowDown, Loader2, RefreshCcw, Ban, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, formatDate, getStatusColor, getTimeAgo } from "@/lib/utils";
import { Transaction } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MobileTransactionHistory() {
  const [filter, setFilter] = useState<string | null>(null);
  const [cancelingTransactionId, setCancelingTransactionId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  const { data, isLoading, error, isFetching } = useQuery<{ success: boolean; transactions: Transaction[] }>({
    queryKey: ['/api/transactions'],
    enabled: true,
    refetchInterval: 3000, // Poll every 3 seconds for faster real-time updates
    staleTime: 0, // Consider data always stale to ensure fresh updates
    refetchOnWindowFocus: true, // Refetch when tab gets focus
  });
  
  // Cancel payment mutation
  const cancelPaymentMutation = useMutation({
    mutationFn: async (referenceId: string) => {
      const url = `/api/payments/cancel/${referenceId}`;
      const response = await apiRequest(url, 'POST');
      return response;
    },
    onSuccess: () => {
      // Invalidate transactions query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    },
  });
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "success":
        return (
          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-green-500/20">
            <Check size={10} className="text-green-500" />
          </div>
        );
      case "failed":
      case "rejected":
      case "error":
        return (
          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-red-500/20">
            <X size={10} className="text-red-500" />
          </div>
        );
      case "pending":
      case "processing":
      case "waiting":
        return (
          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-yellow-500/20">
            <Clock size={10} className="text-yellow-500" />
          </div>
        );
      case "expired":
      case "timeout":
        return (
          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-500/20">
            <Clock size={10} className="text-gray-500" />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-500/20">
            <Clock size={10} className="text-gray-500" />
          </div>
        );
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
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-white mr-2">Recent Transactions</h3>
          {isFetching && (
            <div className="animate-pulse flex items-center">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"></span>
            </div>
          )}
        </div>
        <div className="flex space-x-1 items-center">
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
          
          <button 
            className="ml-1 w-6 h-6 flex items-center justify-center rounded-full bg-white/5 text-blue-300"
            onClick={() => {
              // Trigger a manual refresh
              queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
            }}
            aria-label="Refresh transactions"
          >
            <RefreshCcw size={12} />
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
                          <div className="flex flex-col space-y-1">
                            <p className="text-blue-300 text-xs flex items-center">
                              <span className="mr-1">
                                {formatDate(transaction.createdAt)}
                              </span>
                            </p>
                            {transaction.status === 'completed' && (
                              <div className="flex items-center">
                                {transaction.completedAt && (
                                  <Badge variant="outline" className="text-[10px] bg-green-500/10 border-green-500/20 text-green-400 px-1.5 py-0 h-4 rounded-sm">
                                    Completed {new Date(transaction.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </Badge>
                                )}
                              </div>
                            )}
                            {transaction.statusUpdatedAt && transaction.status === 'pending' && (
                              <div className="flex items-center">
                                <Badge variant="outline" className="text-[10px] bg-yellow-500/10 border-yellow-500/20 text-yellow-400 px-1.5 py-0 h-4 rounded-sm flex items-center">
                                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1 animate-pulse"></div>
                                  Processing
                                </Badge>
                              </div>
                            )}
                            {transaction.status === 'failed' && (
                              <div className="flex items-center">
                                <Badge variant="outline" className="text-[10px] bg-red-500/10 border-red-500/20 text-red-400 px-1.5 py-0 h-4 rounded-sm flex items-center">
                                  <X size={10} className="mr-1" />
                                  Failed
                                </Badge>
                              </div>
                            )}
                            {transaction.status === 'expired' && (
                              <div className="flex items-center">
                                <Badge variant="outline" className="text-[10px] bg-gray-500/10 border-gray-500/20 text-gray-400 px-1.5 py-0 h-4 rounded-sm flex items-center">
                                  <Clock size={10} className="mr-1" />
                                  Expired
                                </Badge>
                              </div>
                            )}
                          </div>
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
                                : transaction.status === 'expired'
                                ? 'text-gray-400'
                                : 'text-yellow-400'
                            }`}>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Add cancel option for pending transactions with GCash QR payments */}
                  {transaction.status === 'pending' && 
                   transaction.method?.toLowerCase().includes('gcash') && 
                   transaction.paymentReference && (
                    <div className="mt-2 border-t border-white/10 pt-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button 
                            className="w-full py-1.5 px-3 bg-red-500/10 text-red-400 rounded-md text-xs flex items-center justify-center"
                            aria-label="Cancel payment"
                          >
                            <Ban size={12} className="mr-1" />
                            Cancel Payment
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-[#001138] border border-blue-900/50 text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel GCash Payment?</AlertDialogTitle>
                            <AlertDialogDescription className="text-blue-200">
                              Are you sure you want to cancel this pending GCash payment of ₱{formatCurrency(Number(transaction.amount), '')}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-4">
                            <AlertDialogCancel className="bg-blue-950/50 text-white border-blue-900/50 hover:bg-blue-900/30">
                              Keep Payment
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                if (transaction.paymentReference) {
                                  cancelPaymentMutation.mutate(transaction.paymentReference);
                                }
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white"
                              disabled={cancelPaymentMutation.isPending}
                            >
                              {cancelPaymentMutation.isPending ? (
                                <div className="flex items-center">
                                  <Loader2 size={14} className="animate-spin mr-1" />
                                  Canceling...
                                </div>
                              ) : (
                                "Yes, Cancel"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </motion.div>
              ))}
          </div>
        </AnimatePresence>
      )}
      
      {/* Show status message when canceling payments */}
      {cancelPaymentMutation.isSuccess && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center px-4 z-50">
          <div className="bg-green-500/90 text-white py-2 px-4 rounded-full shadow-lg flex items-center">
            <Check size={16} className="mr-2" />
            Payment successfully canceled
          </div>
        </div>
      )}
      
      {cancelPaymentMutation.isError && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center px-4 z-50">
          <div className="bg-red-500/90 text-white py-2 px-4 rounded-full shadow-lg flex items-center">
            <AlertCircle size={16} className="mr-2" />
            {cancelPaymentMutation.error instanceof Error 
              ? cancelPaymentMutation.error.message 
              : "Failed to cancel payment"}
          </div>
        </div>
      )}
    </div>
  );
}