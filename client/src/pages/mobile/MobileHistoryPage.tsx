import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Transaction } from '@/lib/types';
import MobileTransactionHistory from '@/components/mobile/MobileTransactionHistory';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation, Link } from 'wouter';
import { ArrowLeftIcon } from 'lucide-react';

export default function MobileHistoryPage() {
  const [location, setLocation] = useLocation();

  // Fetch transactions
  const { data, isLoading, error } = useQuery<{ 
    success: boolean; 
    transactions: Transaction[] 
  }>({
    queryKey: ['/api/transactions'],
    select: (data) => ({
      success: data.success,
      transactions: data.transactions.map((tx: Transaction) => ({
        ...tx,
        // Ensure createdAt is a string for consistency
        createdAt: typeof tx.createdAt === 'string' ? tx.createdAt : new Date(tx.createdAt).toISOString()
      }))
    })
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-28"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 80px)', // Added safe bottom padding for mobile
      }}>
      {/* Header */}
      <div className="bg-white p-4 flex items-center gap-2 shadow-sm">
        <button 
          onClick={() => setLocation('/mobile')}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">Transaction History</h1>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <TransactionHistorySkeleton />
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-red-500">Failed to load transaction history</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              Retry
            </button>
          </div>
        ) : data?.transactions.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500 mb-4">No transactions yet</p>
            <Link href="/mobile/deposit">
              <a className="px-4 py-2 bg-blue-500 text-white rounded-md">
                Make a Deposit
              </a>
            </Link>
          </div>
        ) : (
          <>
            {/* Transaction stats summary */}
            <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
              <h2 className="text-sm font-medium text-gray-700 mb-2">
                Transaction Summary
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 p-2 rounded">
                  <p className="text-xs text-gray-500">Total Deposits</p>
                  <p className="font-medium">
                    {data?.transactions.filter(tx => tx.type === 'casino_deposit').length || 0}
                  </p>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-xs text-gray-500">Completed</p>
                  <p className="font-medium">
                    {data?.transactions.filter(tx => tx.status === 'completed').length || 0}
                  </p>
                </div>
                <div className="bg-yellow-50 p-2 rounded">
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="font-medium">
                    {data?.transactions.filter(tx => 
                      tx.status === 'pending' || tx.status === 'payment_completed'
                    ).length || 0}
                  </p>
                </div>
                <div className="bg-red-50 p-2 rounded">
                  <p className="text-xs text-gray-500">Failed</p>
                  <p className="font-medium">
                    {data?.transactions.filter(tx => tx.status === 'failed').length || 0}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Transaction list with timeline */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <MobileTransactionHistory transactions={data?.transactions || []} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const TransactionHistorySkeleton = () => (
  <div className="space-y-4">
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <Skeleton className="h-4 w-1/3 mb-2" />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-12 rounded" />
        <Skeleton className="h-12 rounded" />
        <Skeleton className="h-12 rounded" />
        <Skeleton className="h-12 rounded" />
      </div>
    </div>
    
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <Skeleton className="h-5 w-1/2 mb-1" />
        <Skeleton className="h-3 w-1/4" />
        <div className="flex justify-between mt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      
      <div className="p-4 border-b border-gray-100">
        <Skeleton className="h-5 w-1/2 mb-1" />
        <Skeleton className="h-3 w-1/4" />
        <div className="flex justify-between mt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      
      <div className="p-4">
        <Skeleton className="h-5 w-1/2 mb-1" />
        <Skeleton className="h-3 w-1/4" />
        <div className="flex justify-between mt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  </div>
);