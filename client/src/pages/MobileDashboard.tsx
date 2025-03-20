import React, { useState, useRef, useEffect } from 'react';
import NewBalanceCard from '@/components/NewBalanceCard';
import MobileLayout from '@/components/MobileLayout';
import { ChevronRight, SquareStack, ChevronDown, ArrowDownToLine, ScanLine, CreditCard, CheckCircle2, BarChart3, LogOut } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/lib/types';
import MobileTransactionsList from '@/components/mobile/MobileTransactionsList';
import MobileCasinoStats from '@/components/mobile/MobileCasinoStats';
import { useAuth } from '@/hooks/use-auth';
import teamMarcLogo from "../assets/Logo teammarc.png";

export default function MobileDashboard() {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const startY = useRef(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [paginationDots, setPaginationDots] = useState([true, false, false]);
  const [, navigate] = useLocation();
  const { logout } = useAuth();
  
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

  // Custom header with user profile
  const headerContent = (
    <div className="flex flex-col w-full">
      {/* Top navigation bar with logo on left */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        {/* Enhanced 747 Logo with premium glowing effect - positioned on left */}
        <div className="relative flex items-center justify-center h-10 w-auto overflow-visible">
          {/* Multi-layered dynamic glow effects */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-300/40 to-amber-500/30 blur-xl transform scale-[1.4] animate-pulse-slow opacity-70"></div>
          <div className="absolute inset-0 rounded-full bg-white/30 blur-lg transform scale-[1.2]"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 via-purple-400/10 to-amber-500/20 blur-md transform scale-[1.1] animate-pulse-slower"></div>
          
          {/* Light rays shining effect */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -rotate-45 translate-x-full animate-shine"></div>
          </div>
          
          {/* Logo image with enhanced drop shadow and transparent background */}
          <img 
            src="/assets/logos/747-logo.png" 
            alt="747 Casino" 
            className="h-10 w-auto object-contain relative z-10 drop-shadow-xl"
            style={{filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.4))'}}
          />
        </div>
        
        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Menu button */}
          <button className="p-2 with-ripple rounded-full hover:bg-white/10 transition-all">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="6" height="6" rx="1" stroke="white" strokeWidth="2"/>
              <rect x="4" y="14" width="6" height="6" rx="1" stroke="white" strokeWidth="2"/>
              <rect x="14" y="4" width="6" height="6" rx="1" stroke="white" strokeWidth="2"/>
              <rect x="14" y="14" width="6" height="6" rx="1" stroke="white" strokeWidth="2"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* User profile section - separate row */}
      <div className="flex items-center px-4 py-3 bg-[#001d4d] rounded-b-xl shadow-md">
        <div className="flex items-center gap-3" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
          <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden shadow-md border-2 border-blue-400">
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
          <div className="flex flex-col">
            <span className="font-medium text-sm text-blue-100">Welcome</span>
            <div className="flex items-center">
              <span className="font-bold text-white">
                {data?.user?.username || 'User'}
              </span>
              <ChevronDown size={16} className="ml-1 text-blue-300" />
            </div>
          </div>
        </div>
        <div className="ml-auto">
          <div className="bg-blue-900/50 px-3 py-1 rounded-full text-xs text-blue-100 font-medium">
            Player
          </div>
        </div>
      </div>
      
      {/* User menu - conditionally rendered */}
      <AnimatePresence>
        {profileMenuOpen && (
          <motion.div 
            className="absolute top-[110px] left-4 right-4 bg-[#00174F] shadow-xl rounded-xl z-50 border border-blue-400/20"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="p-3 border-b border-blue-800">
              <Link href="/mobile/profile" className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-800/30">
                <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="8" r="5" stroke="white" strokeWidth="2"/>
                    <path d="M20 21C20 16.5817 16.4183 13 12 13C7.58172 13 4 16.5817 4 21" stroke="white" strokeWidth="2"/>
                  </svg>
                </div>
                <span>My Profile</span>
              </Link>
            </div>
            <div className="p-2">
              <button 
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-blue-800/30 text-left"
                onClick={async () => {
                  try {
                    await logout();
                    // Redirect to login after successful logout
                    navigate('/mobile/auth');
                  } catch (error) {
                    console.error('Logout failed:', error);
                  } finally {
                    setProfileMenuOpen(false);
                  }
                }}
              >
                <div className="w-8 h-8 rounded-full bg-red-600/30 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H15" stroke="white" strokeWidth="2"/>
                    <path d="M8 8L4 12M4 12L8 16M4 12H16" stroke="white" strokeWidth="2"/>
                  </svg>
                </div>
                <span>Log Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  
  return (
    <MobileLayout
      title="Dashboard"
      showNav={true}
      padding={false}
      transparentHeader={true}
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
      
      <div 
        ref={scrollAreaRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="min-h-screen overflow-x-hidden"
      >
        {/* Main Content */}
        <div className="space-y-6">
          {/* Balance Card Section with Horizontal Swipe */}
          <div className="relative px-4">
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
          <div className="px-4 pt-2 mb-8">
            <div className="grid grid-cols-3 gap-3">
              <Link href="/mobile/banking">
                <motion.div 
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 flex flex-col items-center justify-center shadow-lg"
                >
                  <div className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center mb-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6.5C3 4.01472 5.01472 2 7.5 2H16.5C18.9853 2 21 4.01472 21 6.5V17.5C21 19.9853 18.9853 22 16.5 22H7.5C5.01472 22 3 19.9853 3 17.5V6.5Z" stroke="white" strokeWidth="2"/>
                      <path d="M7 7H17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M7 12H17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M7 17H17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="text-sm text-white font-medium">Banking</span>
                </motion.div>
              </Link>
              
              <Link href="/mobile/profile">
                <motion.div 
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4 flex flex-col items-center justify-center shadow-lg"
                >
                  <div className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center mb-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="8" r="5" stroke="white" strokeWidth="2"/>
                      <path d="M20 21C20 16.5817 16.4183 13 12 13C7.58172 13 4 16.5817 4 21" stroke="white" strokeWidth="2"/>
                    </svg>
                  </div>
                  <span className="text-sm text-white font-medium">Profile</span>
                </motion.div>
              </Link>
              
              <Link href="/mobile/portals" target="_blank">
                <motion.div 
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-4 flex flex-col items-center justify-center shadow-lg"
                >
                  <div className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center mb-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 6H21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M3 12H21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M3 18H14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M3 6L7 10L3 6Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 18L17 14L21 18Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sm text-white font-medium">Portals</span>
                </motion.div>
              </Link>
            </div>
          </div>
          
          {/* Casino Statistics Section */}
          <div className="px-4 mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium">Casino Stats</h2>
              <div className="flex items-center gap-1 text-sm text-blue-300 with-ripple">
                <BarChart3 className="h-4 w-4" />
                <span>Real-time</span>
              </div>
            </div>
            
            {/* Casino Statistics */}
            <MobileCasinoStats />
          </div>
          
          {/* Transactions List */}
          <div className="px-4 mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium">Last Transaction</h2>
              <Link href="/mobile/wallet" className="text-sm text-blue-300 flex items-center with-ripple">
                View All
              </Link>
            </div>
            
            {/* Replace with MobileTransactionsList component */}
            <MobileTransactionsList />
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}