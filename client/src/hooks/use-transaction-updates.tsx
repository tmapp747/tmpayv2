import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@/lib/types';
import { API_ENDPOINTS } from '@/lib/constants';

interface UseTransactionUpdatesOptions {
  pollingInterval?: number;
  enabled?: boolean;
  filterByStatus?: string[];
  onTransactionUpdate?: (transaction: Transaction) => void;
}

const defaultOptions: UseTransactionUpdatesOptions = {
  pollingInterval: 5000, // 5 seconds by default
  enabled: true,
  filterByStatus: undefined, // No filter by default
};

/**
 * Custom hook for fetching and polling transactions with real-time updates
 */
export function useTransactionUpdates(options: UseTransactionUpdatesOptions = {}) {
  const mergedOptions = { ...defaultOptions, ...options };
  const { pollingInterval, enabled, filterByStatus, onTransactionUpdate } = mergedOptions;
  
  const queryClient = useQueryClient();
  const [previousTransactions, setPreviousTransactions] = useState<Transaction[]>([]);
  const [updatedTransactionIds, setUpdatedTransactionIds] = useState<number[]>([]);
  
  // Query for transaction data
  const query = useQuery<{ success: boolean; transactions: Transaction[] }>({
    queryKey: [API_ENDPOINTS.TRANSACTIONS.LIST],
    refetchInterval: enabled ? pollingInterval : false,
    select: (data) => ({
      success: data.success,
      transactions: data.transactions.map((tx: Transaction) => ({
        ...tx,
        // Ensure createdAt is a string for consistency
        createdAt: typeof tx.createdAt === 'string' ? tx.createdAt : new Date(tx.createdAt).toISOString()
      }))
    })
  });
  
  // Get sorted transactions with optional filtering
  const getSortedTransactions = useCallback(() => {
    if (!query.data?.transactions) return [];
    
    let transactions = [...query.data.transactions];
    
    // Apply status filter if provided
    if (filterByStatus && filterByStatus.length > 0) {
      transactions = transactions.filter(tx => 
        filterByStatus.includes(tx.status)
      );
    }
    
    // Sort by createdAt (newest first)
    return transactions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [query.data, filterByStatus]);
  
  // Check for transaction updates
  useEffect(() => {
    if (!query.data?.transactions || query.isLoading) return;
    
    const currentTransactions = query.data.transactions;
    
    // Compare with previous state to find updates
    if (previousTransactions.length > 0) {
      const updatedIds: number[] = [];
      
      currentTransactions.forEach(currentTx => {
        const previousTx = previousTransactions.find(p => p.id === currentTx.id);
        
        // If transaction exists but has a different status, it's updated
        if (previousTx && previousTx.status !== currentTx.status) {
          updatedIds.push(currentTx.id);
          
          // Call onTransactionUpdate callback if provided
          if (onTransactionUpdate) {
            onTransactionUpdate(currentTx);
          }
        }
      });
      
      // Set updated transaction IDs
      if (updatedIds.length > 0) {
        setUpdatedTransactionIds(updatedIds);
        
        // Clear updated IDs after 3 seconds
        setTimeout(() => {
          setUpdatedTransactionIds([]);
        }, 3000);
      }
    }
    
    // Update previous transactions reference
    setPreviousTransactions(currentTransactions);
  }, [query.data, onTransactionUpdate, previousTransactions]);
  
  const invalidateTransactions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.TRANSACTIONS.LIST] });
  }, [queryClient]);
  
  // Extract properties from query
  const { data, isLoading, error, refetch } = query;
  
  return {
    transactions: getSortedTransactions(),
    isLoading,
    error,
    refetch,
    invalidateTransactions,
    updatedTransactionIds,
    rawData: data
  };
}