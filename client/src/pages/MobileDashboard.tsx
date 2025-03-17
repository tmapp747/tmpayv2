import React, { useState, useRef, useEffect } from 'react';
import NewBalanceCard from '@/components/NewBalanceCard';
import BottomNavBar from '@/components/navigation/BottomNavBar';
import { ChevronRight, SquareStack, ChevronDown, ArrowDownToLine, ScanLine, CreditCard, CheckCircle2 } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/lib/types';
import MobileTransactionsList from '@/components/mobile/MobileTransactionsList';

export default function MobileDashboard() {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const startY = useRef(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [paginationDots, setPaginationDots] = useState([true, false, false]);
  
  // Fetch user data
  const { data, isLoading, error } = useQuery<{ user: User }>({
    queryKey: ['/api/user/info'],
    retry: 1,
  });
  
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
  
  // Handle horizontal swipe on card
  const handleCardSwipe = (direction: 'left' | 'right') => {
    const newIndex = direction === 'right' 
      ? Math.max(0, swipeIndex - 1) 
      : Math.min(2, swipeIndex + 1);
    
    setSwipeIndex(newIndex);
    
    // Update pagination dots
    const newDots = [false, false, false];
    newDots[newIndex] = true;
    setPaginationDots(newDots);
  };
  
  return (
    <div 
      className="banking-app min-h-screen pb-20 overflow-hidden"
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
              <img 
                src="/assets/logos/user-avatar.png" 
                alt="Profile" 
                onError={(e) => {
                  // Default to initials if avatar fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center', 'bg-blue-600');
                  (e.target as HTMLImageElement).parentElement!.innerHTML = 
                    `<span class="text-white text-lg font-bold">${data?.user?.username?.substring(0, 2).toUpperCase() || 'U'}</span>`;
                }}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
              <span className="font-medium">
                {data?.user?.username || 'User'}
              </span>
              <ChevronDown size={16} className="ml-1" />
            </div>
          </div>
          <div>
            <button className="p-2 with-ripple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="6" height="6" rx="1" stroke="white" strokeWidth="2"/>
                <rect x="4" y="14" width="6" height="6" rx="1" stroke="white" strokeWidth="2"/>
                <rect x="14" y="4" width="6" height="6" rx="1" stroke="white" strokeWidth="2"/>
                <rect x="14" y="14" width="6" height="6" rx="1" stroke="white" strokeWidth="2"/>
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="space-y-6">
        {/* Balance Card Section with Horizontal Swipe */}
        <div className="relative">
          <motion.div 
            className="flex"
            animate={{ x: -swipeIndex * 100 + '%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = offset.x;
              
              if (swipe < -70) {
                handleCardSwipe('left');
              } else if (swipe > 70) {
                handleCardSwipe('right');
              }
            }}
          >
            <div className="min-w-full">
              <NewBalanceCard />
            </div>
            <div className="min-w-full">
              <NewBalanceCard />
            </div>
            <div className="min-w-full">
              <NewBalanceCard />
            </div>
          </motion.div>
          
          {/* Card pagination dots */}
          <div className="flex justify-center items-center space-x-2 mt-4">
            {paginationDots.map((active, i) => (
              <div 
                key={i} 
                className={`rounded-full transition-all duration-300 ${
                  active ? 'w-2.5 h-2.5 bg-white' : 'w-2 h-2 bg-white/40'
                }`}
                onClick={() => {
                  setSwipeIndex(i);
                  const newDots = paginationDots.map((_, idx) => idx === i);
                  setPaginationDots(newDots);
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Quick Action Buttons */}
        <div className="flex justify-center gap-2 text-center text-xs px-2">
          <Link href="/mobile/banking">
            <motion.div 
              className="flex flex-col items-center space-y-2"
              whileTap={{ scale: 0.95 }}
            >
              <div className="banking-btn with-ripple shadow-lg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6.5C3 4.01472 5.01472 2 7.5 2H16.5C18.9853 2 21 4.01472 21 6.5V17.5C21 19.9853 18.9853 22 16.5 22H7.5C5.01472 22 3 19.9853 3 17.5V6.5Z" stroke="white" strokeWidth="2"/>
                  <path d="M7 7H17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M7 12H17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M7 17H17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span>Banking Management</span>
            </motion.div>
          </Link>
          
          <Link href="/mobile/profile">
            <motion.div 
              className="flex flex-col items-center space-y-2"
              whileTap={{ scale: 0.95 }}
            >
              <div className="banking-btn with-ripple shadow-lg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="5" stroke="white" strokeWidth="2"/>
                  <path d="M20 21C20 16.5817 16.4183 13 12 13C7.58172 13 4 16.5817 4 21" stroke="white" strokeWidth="2"/>
                </svg>
              </div>
              <span>User Management</span>
            </motion.div>
          </Link>
          
          <Link href="/mobile/portals" target="_blank">
            <motion.div 
              className="flex flex-col items-center space-y-2"
              whileTap={{ scale: 0.95 }}
            >
              <div className="banking-btn with-ripple shadow-lg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 6H21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M3 12H21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M3 18H14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M3 6L7 10L3 6Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 18L17 14L21 18Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span>Portals</span>
            </motion.div>
          </Link>
        </div>
        
        {/* Transactions List */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">Last Transaction</h2>
            <Link href="/mobile/wallet" className="text-sm text-blue-300 flex items-center with-ripple">
              View All
            </Link>
          </div>
          
          {/* Replace with MobileTransactionsList component */}
          <MobileTransactionsList />
        </div>
      </main>
      
      {/* Bottom Navigation */}
      <BottomNavBar />
    </div>
  );
}