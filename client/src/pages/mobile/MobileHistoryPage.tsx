import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link } from 'wouter';
import { ArrowLeftIcon, Filter, RefreshCw } from 'lucide-react';
import { useTransactionUpdates } from '@/hooks/use-transaction-updates';
import { Transaction } from '@/lib/types';
import EnhancedTransactionList from '@/components/mobile/EnhancedTransactionList';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MobileLayout from '@/components/MobileLayout';

export default function MobileHistoryPage() {
  const [location, setLocation] = useLocation();
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Use our custom hook for real-time transaction updates
  const { 
    transactions, 
    isLoading, 
    error, 
    refetch, 
    updatedTransactionIds,
    rawData
  } = useTransactionUpdates({
    pollingInterval: 6000, // Poll every 6 seconds
  });

  // Apply filters to transactions
  const filteredTransactions = () => {
    if (!transactions.length) return [];
    
    if (activeFilter === 'all') return transactions;
    
    if (activeFilter === 'pending') {
      return transactions.filter(tx => 
        tx.status === 'pending' || tx.status === 'payment_completed'
      );
    }
    
    return transactions.filter(tx => tx.status === activeFilter);
  };

  // Calculate stats for the summary cards
  const stats = {
    deposits: transactions.filter(tx => tx.type.includes('deposit')).length,
    completed: transactions.filter(tx => tx.status === 'completed').length,
    pending: transactions.filter(tx => 
      tx.status === 'pending' || tx.status === 'payment_completed'
    ).length,
    failed: transactions.filter(tx => tx.status === 'failed').length,
  };

  // Handle manual refresh with animation
  const handleRefresh = async () => {
    await refetch();
    setRefreshTrigger(prev => prev + 1);
  };

  // Custom header with back button and filter
  const headerContent = (
    <div className="flex items-center justify-between w-full">
      <button 
        onClick={() => setLocation('/mobile')}
        className="p-1 rounded-full hover:bg-white/10 transition-colors"
      >
        <ArrowLeftIcon className="h-5 w-5 text-white" />
      </button>
      
      <div className="flex items-center gap-2">
        <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
          <DialogTrigger asChild>
            <button 
              className="p-2 rounded-full hover:bg-white/10 transition-colors relative"
              aria-label="Filter transactions"
            >
              <Filter className="h-5 w-5 text-white" />
              {activeFilter !== 'all' && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-gray-800">
            <DialogHeader>
              <DialogTitle>Filter Transactions</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Tabs 
                value={activeFilter} 
                onValueChange={(value) => {
                  setActiveFilter(value);
                  setFilterDialogOpen(false);
                }}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 gap-2 bg-gray-800 p-1">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="failed">Failed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
        
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
          aria-label="Refresh transactions"
        >
          <motion.div
            animate={{ rotate: refreshTrigger * 360 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <RefreshCw className="h-5 w-5 text-white" />
          </motion.div>
        </motion.button>
      </div>
    </div>
  );

  return (
    <MobileLayout
      title="Transaction History"
      headerContent={headerContent}
      showNav={true}
      gradient={false}
    >
      {/* Transaction stats summary - only show if we have transactions */}
      {!isLoading && transactions.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 mb-4 border border-white/10">
          <h2 className="text-sm font-medium text-white/90 mb-2">
            Transaction Summary
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-500/20 p-3 rounded-lg border border-green-500/30">
              <p className="text-xs text-white/70">Total Deposits</p>
              <p className="font-medium text-white">{stats.deposits}</p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg border border-blue-500/30">
              <p className="text-xs text-white/70">Completed</p>
              <p className="font-medium text-white">{stats.completed}</p>
            </div>
            <div className="bg-yellow-500/20 p-3 rounded-lg border border-yellow-500/30">
              <p className="text-xs text-white/70">Pending</p>
              <p className="font-medium text-white">{stats.pending}</p>
            </div>
            <div className="bg-red-500/20 p-3 rounded-lg border border-red-500/30">
              <p className="text-xs text-white/70">Failed</p>
              <p className="font-medium text-white">{stats.failed}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced transaction list with real-time updates */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg overflow-hidden border border-white/10">
        <EnhancedTransactionList />
      </div>
    </MobileLayout>
  );
}