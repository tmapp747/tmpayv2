import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { User } from '@/lib/types';

interface NewBalanceCardProps {
  className?: string;
  showCardNumber?: boolean;
}

export default function NewBalanceCard({ className = '', showCardNumber = true }: NewBalanceCardProps) {
  const { data, isLoading, error } = useQuery<{ user: User }>({
    queryKey: ['/api/user/info'],
    retry: 1,
  });

  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Format casino ID as a card number
  const formatCasinoId = (id: string) => {
    if (!id) return '•••• •••• •••• ••••';
    
    // Pad with zeros to ensure it's at least 16 digits
    const paddedId = id.padStart(16, '0');
    
    // Format as credit card number
    return paddedId.match(/.{1,4}/g)?.join(' ') || id;
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    // After animation completes
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };
  
  if (isLoading) {
    return (
      <div className={`rounded-2xl p-4 h-48 animate-pulse bg-gradient-to-br from-primary-dark to-primary w-full shadow-lg ${className}`}>
        <div className="flex flex-col h-full justify-between">
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 bg-white/20 rounded-md"></div>
            <div className="h-6 w-6 bg-white/20 rounded-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-10 w-40 bg-white/20 rounded-md"></div>
            <div className="h-5 w-24 bg-white/20 rounded-md"></div>
          </div>
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 bg-white/20 rounded-md"></div>
            <div className="h-6 w-6 bg-white/20 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !data?.user) {
    return (
      <div className={`rounded-2xl p-5 bg-gradient-to-br from-gray-900 to-gray-800 w-full text-white shadow-lg ${className}`}>
        <div className="flex flex-col h-full justify-between">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium opacity-80">Your Balance</div>
            <Wallet size={20} className="opacity-80" />
          </div>
          <div className="my-4">
            <h3 className="text-2xl font-bold">Sign in to view</h3>
            <p className="text-sm opacity-70">Please login to see your balance</p>
          </div>
          <div className="text-xs opacity-70 pt-4">
            Casino ID: •••• •••• •••• ••••
          </div>
        </div>
      </div>
    );
  }
  
  const { balance, pendingBalance, casinoBalance, casinoId, username } = data.user;
  const totalBalance = parseFloat(balance as string) + parseFloat(pendingBalance as string);
  
  return (
    <div className={`relative rounded-2xl p-5 h-48 overflow-hidden w-full shadow-lg ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary-dark to-primary-light opacity-90 z-0"></div>
      <div className="absolute inset-0 z-0">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full"></div>
        <div className="absolute -right-10 -top-10 w-36 h-36 bg-white/10 rounded-full"></div>
        <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-white/10 rounded-full"></div>
      </div>
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white/90">
            {username}'s Balance
          </div>
          <button 
            onClick={() => setShowBalance(!showBalance)}
            className="p-1.5 bg-white/20 rounded-full mobile-clickable with-ripple"
          >
            {showBalance ? <EyeOff size={16} className="text-white" /> : <Eye size={16} className="text-white" />}
          </button>
        </div>
        
        <div className="my-2">
          <div className="flex items-center">
            <h3 className="text-2xl font-bold text-white">
              {showBalance ? formatCurrency(totalBalance) : '••••••••'}
            </h3>
            <button 
              onClick={handleRefresh}
              className="ml-2 p-1.5 rounded-full mobile-clickable with-ripple"
            >
              <RefreshCw size={16} className={`text-white ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {pendingBalance && parseFloat(pendingBalance as string) > 0 && (
            <p className="text-sm text-white/70">
              {showBalance ? `Pending: ${formatCurrency(pendingBalance)}` : 'Pending: ••••••'}
            </p>
          )}
          {casinoBalance && parseFloat(casinoBalance as string) > 0 && (
            <p className="text-sm text-white/70">
              {showBalance ? `Casino: ${formatCurrency(casinoBalance)}` : 'Casino: ••••••'}
            </p>
          )}
        </div>
        
        {showCardNumber && (
          <div className="text-xs text-white/70 font-medium">
            Casino ID: {showBalance ? formatCasinoId(casinoId) : '•••• •••• •••• ••••'}
          </div>
        )}
      </div>
    </div>
  );
}