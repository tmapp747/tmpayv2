import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, ArrowDownUp, ArrowDown, ArrowUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { User } from '@/lib/types';

export default function MobileBalanceCard() {
  // Fetch user data
  const { data, isLoading, error } = useQuery<{ user: User }>({
    queryKey: ['/api/user/info'],
    retry: 1,
  });

  const formatBalance = (balance: number | undefined) => {
    if (balance === undefined) return '₱0.00';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(balance);
  };

  // Format wallet balance and ensure it's a number
  const walletBalanceValue = typeof data?.user?.balance === 'number' ? data.user.balance : 0;
  const walletBalance = formatBalance(walletBalanceValue);
  
  // Format casino balance and ensure it's a number
  const casinoBalanceValue = typeof data?.user?.casinoBalance === 'number' ? data.user.casinoBalance : 0;
  const casinoBalance = formatBalance(casinoBalanceValue);

  // Calculate total balance
  const totalBalance = walletBalanceValue + casinoBalanceValue;
  const formattedTotalBalance = formatBalance(totalBalance);

  return (
    <motion.div 
      className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl p-4 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col">
        {/* Card Header with Total Balance */}
        <div className="mb-4">
          <span className="text-white/70 text-sm">Total Balance</span>
          <div className="flex items-center">
            <span className="text-white text-2xl font-bold">{formattedTotalBalance}</span>
            <div className="ml-2 px-2 py-1 bg-white/10 rounded text-xs text-white/90 flex items-center">
              <ArrowUp className="w-3 h-3 mr-1 text-green-300" />
              <span>2.5%</span>
            </div>
          </div>
        </div>
        
        {/* Wallet and Casino Balance */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mr-2">
                <Wallet className="w-3 h-3 text-white" />
              </div>
              <span className="text-white/70 text-xs">Wallet</span>
            </div>
            <span className="text-white text-lg font-semibold">{walletBalance}</span>
          </div>
          
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mr-2">
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 9L12 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-white/70 text-xs">Casino</span>
            </div>
            <span className="text-white text-lg font-semibold">{casinoBalance}</span>
          </div>
        </div>
        
        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Link href="/mobile/deposit">
            <motion.button 
              className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg flex items-center justify-center transition duration-200"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowDown className="w-4 h-4 mr-2" />
              <span>Deposit</span>
            </motion.button>
          </Link>
          
          <Link href="/mobile/withdraw">
            <motion.button 
              className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg flex items-center justify-center transition duration-200"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowUp className="w-4 h-4 mr-2" />
              <span>Withdraw</span>
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}