import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Transaction } from '@/lib/types';
import MobileTransactionHistory from '@/components/mobile/MobileTransactionHistory';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation, Link } from 'wouter';
import { ArrowLeftIcon } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';

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

  // Custom header with back button
  const headerContent = (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => setLocation('/mobile')}
        className="p-1 rounded-full hover:bg-white/10 transition-colors"
      >
        <ArrowLeftIcon className="h-5 w-5 text-white" />
      </button>
    </div>
  );

  return (
    <MobileLayout
      title="Transaction History"
      headerContent={headerContent}
      showNav={true}
      gradient={false}
    >
      {/* Content */}
      <div className="space-y-4">
        {isLoading ? (
          <TransactionHistorySkeleton />
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-red-500">Failed to load transaction history</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Retry
            </button>
          </div>
        ) : data?.transactions.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500 mb-4">No transactions yet</p>
            <Link href="/mobile/deposit">
              <a className="px-4 py-2 bg-blue-600 text-white rounded-md">
                Make a Deposit
              </a>
            </Link>
          </div>
        ) : (
          <>
            {/* Transaction stats summary */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 mb-4 border border-white/10">
              <h2 className="text-sm font-medium text-white/90 mb-2">
                Transaction Summary
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-500/20 p-3 rounded-lg border border-green-500/30">
                  <p className="text-xs text-white/70">Total Deposits</p>
                  <p className="font-medium text-white">
                    {data?.transactions.filter(tx => tx.type === 'casino_deposit').length || 0}
                  </p>
                </div>
                <div className="bg-blue-500/20 p-3 rounded-lg border border-blue-500/30">
                  <p className="text-xs text-white/70">Completed</p>
                  <p className="font-medium text-white">
                    {data?.transactions.filter(tx => tx.status === 'completed').length || 0}
                  </p>
                </div>
                <div className="bg-yellow-500/20 p-3 rounded-lg border border-yellow-500/30">
                  <p className="text-xs text-white/70">Pending</p>
                  <p className="font-medium text-white">
                    {data?.transactions.filter(tx => 
                      tx.status === 'pending' || tx.status === 'payment_completed'
                    ).length || 0}
                  </p>
                </div>
                <div className="bg-red-500/20 p-3 rounded-lg border border-red-500/30">
                  <p className="text-xs text-white/70">Failed</p>
                  <p className="font-medium text-white">
                    {data?.transactions.filter(tx => tx.status === 'failed').length || 0}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Transaction list with timeline */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg overflow-hidden border border-white/10">
              <MobileTransactionHistory transactions={data?.transactions || []} />
            </div>
          </>
        )}
      </div>
    </MobileLayout>
  );
}

const TransactionHistorySkeleton = () => (
  <div className="space-y-4">
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/10">
      <Skeleton className="h-4 w-1/3 mb-2 bg-white/20" />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-12 rounded-lg bg-white/20" />
        <Skeleton className="h-12 rounded-lg bg-white/20" />
        <Skeleton className="h-12 rounded-lg bg-white/20" />
        <Skeleton className="h-12 rounded-lg bg-white/20" />
      </div>
    </div>
    
    <div className="bg-white/10 backdrop-blur-md rounded-lg overflow-hidden border border-white/10">
      <div className="p-4 border-b border-white/10">
        <Skeleton className="h-5 w-1/2 mb-1 bg-white/20" />
        <Skeleton className="h-3 w-1/4 bg-white/20" />
        <div className="flex justify-between mt-2">
          <Skeleton className="h-4 w-20 bg-white/20" />
          <Skeleton className="h-4 w-16 bg-white/20" />
        </div>
      </div>
      
      <div className="p-4 border-b border-white/10">
        <Skeleton className="h-5 w-1/2 mb-1 bg-white/20" />
        <Skeleton className="h-3 w-1/4 bg-white/20" />
        <div className="flex justify-between mt-2">
          <Skeleton className="h-4 w-20 bg-white/20" />
          <Skeleton className="h-4 w-16 bg-white/20" />
        </div>
      </div>
      
      <div className="p-4">
        <Skeleton className="h-5 w-1/2 mb-1 bg-white/20" />
        <Skeleton className="h-3 w-1/4 bg-white/20" />
        <div className="flex justify-between mt-2">
          <Skeleton className="h-4 w-20 bg-white/20" />
          <Skeleton className="h-4 w-16 bg-white/20" />
        </div>
      </div>
    </div>
  </div>
);