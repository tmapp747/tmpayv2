import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  ArrowDownToLine, ArrowUpRight, CreditCard, 
  ChevronRight, Plus, Search, Filter, History
} from 'lucide-react';
import NewBalanceCard from '@/components/NewBalanceCard';
import BottomNavBar from '@/components/navigation/BottomNavBar';
import MobileTransactionHistory from '@/components/mobile/MobileTransactionHistory';
import { formatCurrency } from '@/lib/utils';

export default function MobileWallet() {
  const [activeTab, setActiveTab] = useState<'history' | 'cards'>('history');
  const [refreshing, setRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const startY = useRef(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  // Enhanced with real-time transaction history
  
  // Handle pull-to-refresh interaction
  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    if (!scrollAreaRef.current) return;
    
    // Only enable pull-to-refresh when at the top of the scroll container
    if (scrollAreaRef.current.scrollTop > 0) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    // Only activate when pulling down
    if (diff > 0) {
      // Calculate pull progress as a percentage (max 100%)
      const progress = Math.min(diff / 150, 1) * 100;
      setPullProgress(progress);
      
      // Trigger refresh when pulled far enough
      if (progress >= 100 && !refreshing) {
        setRefreshing(true);
        
        // Simulate refresh by waiting and then resetting
        setTimeout(() => {
          setPullProgress(0);
          setTimeout(() => {
            setRefreshing(false);
          }, 300);
        }, 1000);
      }
    }
  };
  
  const onTouchEnd = () => {
    if (!refreshing) {
      setPullProgress(0);
    }
  };
  
  return (
    <div 
      className="banking-app min-h-screen pb-20 overflow-hidden bg-gradient-to-b from-[#001138] to-[#002D87]"
      ref={scrollAreaRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div 
        className="absolute top-0 left-0 w-full flex justify-center items-center pointer-events-none z-50 transition-transform duration-300"
        style={{ 
          transform: `translateY(${pullProgress < 100 ? -50 + pullProgress/2 : 0}px)`,
          opacity: pullProgress > 10 ? 1 : 0
        }}
      >
        <div className="bg-blue-600 rounded-full p-2 shadow-lg">
          {refreshing ? (
            <div className="animate-spin w-6 h-6 rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <ArrowDownToLine className="h-6 w-6 text-white" style={{ 
              transform: `rotate(${Math.min(pullProgress * 1.8, 180)}deg)` 
            }} />
          )}
        </div>
      </div>
      
      {/* App Header */}
      <header className="p-4 sticky top-0 z-40 backdrop-blur-md bg-[#00174F]/70">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Wallet</h1>
            <p className="text-sm text-blue-300">Manage your funds</p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
              <Search className="h-5 w-5 text-white" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
              <Filter className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="space-y-6">
        {/* Balance Card */}
        <div className="px-4">
          <NewBalanceCard />
        </div>
        
        {/* Quick Actions */}
        <div className="px-4 pt-2">
          <div className="grid grid-cols-3 gap-3">
            <Link href="/mobile/deposit">
              <motion.div 
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 flex flex-col items-center justify-center shadow-lg"
              >
                <div className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center mb-2">
                  <ArrowDownToLine className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm text-white font-medium">Deposit</span>
              </motion.div>
            </Link>
            
            <motion.div 
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4 flex flex-col items-center justify-center shadow-lg"
            >
              <div className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center mb-2">
                <ArrowUpRight className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm text-white font-medium">Transfer</span>
            </motion.div>
            
            <motion.div 
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-4 flex flex-col items-center justify-center shadow-lg"
            >
              <div className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center mb-2">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm text-white font-medium">Top Up</span>
            </motion.div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="px-4 pt-2">
          <div className="flex border-b border-white/10">
            <button 
              className={`flex-1 py-3 font-medium text-center relative ${activeTab === 'history' ? 'text-white' : 'text-white/50'}`}
              onClick={() => setActiveTab('history')}
            >
              History
              {activeTab === 'history' && (
                <motion.div 
                  layoutId="activeTab" 
                  className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )}
            </button>
            <button 
              className={`flex-1 py-3 font-medium text-center relative ${activeTab === 'cards' ? 'text-white' : 'text-white/50'}`}
              onClick={() => setActiveTab('cards')}
            >
              Cards
              {activeTab === 'cards' && (
                <motion.div 
                  layoutId="activeTab" 
                  className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )}
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'history' ? (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="px-4 space-y-1"
            >
              {/* Use the enhanced MobileTransactionHistory component */}
              <MobileTransactionHistory />
            </motion.div>
          ) : (
            <motion.div 
              key="cards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="px-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-white">Payment Methods</h2>
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600">
                  <Plus className="h-5 w-5 text-white" />
                </button>
              </div>
              
              <div className="space-y-4">
                <motion.div 
                  className="bg-white/5 backdrop-blur-md rounded-xl p-3"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                        <svg width="20" height="12" viewBox="0 0 21 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13.643 14.1711C16.9963 14.1711 19.7168 11.4506 19.7168 8.09728C19.7168 4.74398 16.9963 2.02344 13.643 2.02344C10.2897 2.02344 7.56918 4.74398 7.56918 8.09728C7.56918 11.4506 10.2897 14.1711 13.643 14.1711Z" fill="#EB001B"/>
                          <path d="M7.56918 8.09747C7.56918 11.4508 10.2897 14.1713 13.643 14.1713C17.4929 14.1713 19.7168 11.4508 19.7168 8.09747C19.7168 4.74417 16.9963 2.02363 13.643 2.02363C10.2897 2.02363 7.56918 4.74417 7.56918 8.09747Z" fill="#F79E1B"/>
                          <path d="M7.56916 8.09736C7.56916 11.4507 10.2897 14.1712 13.643 14.1712C15.8669 14.1712 18.0908 12.3367 19.7167 8.09736C18.0908 3.858 15.8669 2.02351 13.643 2.02351C10.2897 2.02351 7.56916 4.74406 7.56916 8.09736Z" fill="#FF5F00"/>
                          <path d="M1.49536 2.02344C1.8848 2.02344 2.17535 2.31399 2.17535 2.70343V13.4912C2.17535 13.8806 1.8848 14.1711 1.49536 14.1711C1.10592 14.1711 0.815369 13.8806 0.815369 13.4912V2.70343C0.815369 2.31399 1.10592 2.02344 1.49536 2.02344Z" fill="white"/>
                          <path d="M3.53534 2.02344C3.92479 2.02344 4.21533 2.31399 4.21533 2.70343V13.4912C4.21533 13.8806 3.92479 14.1711 3.53534 14.1711C3.1459 14.1711 2.85535 13.8806 2.85535 13.4912V2.70343C2.85535 2.31399 3.1459 2.02344 3.53534 2.02344Z" fill="white"/>
                          <path d="M5.57533 2.02344C5.96477 2.02344 6.25532 2.31399 6.25532 2.70343V13.4912C6.25532 13.8806 5.96477 14.1711 5.57533 14.1711C5.18588 14.1711 4.89534 13.8806 4.89534 13.4912V2.70343C4.89534 2.31399 5.18588 2.02344 5.57533 2.02344Z" fill="white"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-white">Mastercard</h3>
                        <p className="text-xs text-gray-400">**** **** **** 4523</p>
                      </div>
                    </div>
                    <span className="text-xs text-blue-300">Default</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="bg-white/5 backdrop-blur-md rounded-xl p-3"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18.5 4H5.5C4.94772 4 4.5 4.44772 4.5 5V19C4.5 19.5523 4.94772 20 5.5 20H18.5C19.0523 20 19.5 19.5523 19.5 19V5C19.5 4.44772 19.0523 4 18.5 4Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9 10H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 7V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-white">GCash</h3>
                        <p className="text-xs text-gray-400">Linked on Mar 10, 2025</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="border border-dashed border-white/20 rounded-xl p-4 flex items-center justify-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="h-5 w-5 text-white/50 mr-2" />
                  <span className="text-white/50 font-medium">Add New Payment Method</span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {/* Bottom Navigation */}
      <BottomNavBar />
    </div>
  );
}