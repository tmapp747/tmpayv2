import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, Eye, EyeOff, RefreshCw, ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { User, CasinoBalanceRequest } from '@/lib/types';
import { motion, useAnimation } from 'framer-motion';
import { casinoApi } from '@/lib/api';

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
  const [cardRotation, setCardRotation] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  
  // State for casino balance
  const [casinoBalance, setCasinoBalance] = useState<number | null>(null);
  const [previousCasinoBalance, setPreviousCasinoBalance] = useState<number | null>(null);
  const [isCasinoBalanceLoading, setIsCasinoBalanceLoading] = useState(false);
  const [isCasinoBalanceUpdated, setIsCasinoBalanceUpdated] = useState(false);
  const balanceControls = useAnimation();
  
  // Handle card tilt effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    
    setCardRotation({ x: rotateX, y: rotateY });
  };
  
  const resetCardRotation = () => {
    setCardRotation({ x: 0, y: 0 });
  };
  
  // Format casino client ID as a card number
  const formatCardNumber = (id: string | number | undefined) => {
    if (!id) return '5282 3456 7890 1289';
    
    // Convert to string if it's a number
    const idStr = id.toString();
    
    // Pad with zeros to ensure it's at least 16 digits
    // Use the actual client ID from database
    const paddedId = idStr.padStart(16, '0');
    
    // Format as credit card number
    return paddedId.match(/.{1,4}/g)?.join(' ') || idStr;
  };
  
  // Fetch real-time casino balance
  const fetchCasinoBalance = async () => {
    if (!data?.user?.casinoClientId || !data?.user?.casinoUsername) return;
    
    try {
      setIsCasinoBalanceLoading(true);
      
      const request: CasinoBalanceRequest = {
        casinoClientId: data.user.casinoClientId,
        casinoUsername: data.user.casinoUsername
      };
      
      // Use the real-time balance endpoint
      const balanceResponse = await casinoApi.getRealTimeBalance(request);
      
      if (balanceResponse.success && balanceResponse.balance) {
        // Store previous balance for animation
        if (casinoBalance !== null) {
          setPreviousCasinoBalance(casinoBalance);
        }
        
        // Convert balance to number if it's a string
        const newBalance = typeof balanceResponse.balance === 'string' 
          ? parseFloat(balanceResponse.balance) 
          : balanceResponse.balance;
        
        // Update balance
        setCasinoBalance(newBalance);
        
        // Show animation if this is an update (not first load)
        if (casinoBalance !== null && casinoBalance !== newBalance) {
          setIsCasinoBalanceUpdated(true);
          // Animate balance change
          balanceControls.start({
            scale: [1, 1.1, 1],
            color: ["#ffffff", "#38bdf8", "#ffffff"],
            transition: { duration: 0.5 }
          });
          
          // Reset flag after animation
          setTimeout(() => setIsCasinoBalanceUpdated(false), 3000);
        }
      }
    } catch (error) {
      console.error('Error fetching casino balance:', error);
    } finally {
      setIsCasinoBalanceLoading(false);
      setRefreshing(false);
    }
  };
  
  // Fetch casino balance on initial load and after every refresh
  useEffect(() => {
    if (data?.user?.casinoClientId && data?.user?.casinoUsername) {
      fetchCasinoBalance();
      
      // Set up interval for real-time updates every 30 seconds
      const intervalId = setInterval(fetchCasinoBalance, 30000);
      return () => clearInterval(intervalId);
    }
  }, [data?.user?.casinoClientId, data?.user?.casinoUsername]);
  
  // Debug log to see available user data
  console.log("User data:", data?.user);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCasinoBalance();
  };
  
  if (isLoading) {
    return (
      <div className={`rounded-[24px] p-5 h-64 mx-4 animate-pulse bg-gradient-to-br from-blue-500 to-cyan-400 w-auto shadow-xl ${className}`}>
        <div className="flex flex-col h-full justify-between">
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 bg-white/20 rounded-md"></div>
            <div className="h-10 w-16 bg-white/20 rounded-md"></div> {/* 747 logo space */}
          </div>
          <div className="space-y-2">
            <div className="h-10 w-40 bg-white/20 rounded-md"></div>
            <div className="h-5 w-24 bg-white/20 rounded-md"></div>
          </div>
          {/* Manager badge placeholders */}
          <div className="space-y-1 mt-2">
            <div className="h-5 w-32 bg-green-500/50 rounded-md"></div>
            <div className="h-5 w-32 bg-purple-800/50 rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !data?.user) {
    return (
      <motion.div 
        className={`rounded-[24px] mx-4 p-5 h-64 bg-gradient-to-br from-blue-600 to-cyan-500 w-auto text-white shadow-xl overflow-hidden ${className}`}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex flex-col h-full justify-between">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-white/90">Current Balance</div>
            <div className="casino-747-logo">
              <img 
                src="/assets/logos/747logo.png" 
                alt="747 Casino"
                className="h-10 w-auto"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = `
                    <div class="text-xs font-bold text-white">
                      <span class="text-blue-900">7</span><span class="text-green-500">4</span><span class="text-blue-900">7</span>
                    </div>
                  `;
                }}
              />
            </div>
          </div>
          <div className="my-4">
            <h3 className="text-2xl font-bold">Sign in to view</h3>
            <p className="text-sm text-white/90">Please login to see your balance</p>
          </div>
          <div className="text-xs text-white pt-4 flex justify-between mt-4">
            <div>5282 3456 **** ****</div>
            <div>MGRS/USER</div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  const { 
    balance, 
    pendingBalance, 
    casinoId, 
    casinoClientId, 
    id, 
    username, 
    topManager, 
    immediateManager 
  } = data.user;
  
  // Determine which balance to show:
  // Use casino balance if available, otherwise fallback to app balance
  const displayBalance = casinoBalance !== null 
    ? casinoBalance 
    : parseFloat(balance as string) + parseFloat(pendingBalance as string);
  
  // Use casinoClientId or casinoId from the user record (whichever is available)
  const formattedCardNumber = formatCardNumber(casinoClientId || casinoId);
  
  return (
    <motion.div 
      ref={cardRef}
      className={`rounded-[24px] mx-4 p-5 h-64 overflow-hidden w-auto shadow-2xl ${className}`}
      style={{ 
        perspective: "1000px",
        transform: `rotateX(${cardRotation.x}deg) rotateY(${cardRotation.y}deg)` 
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetCardRotation}
      onTouchMove={(e) => {
        // Mobile touch handling if needed
        resetCardRotation();
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      {/* Card background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-400 z-0">
        {/* Subtle card patterns */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute -right-12 -bottom-12 w-40 h-40 rounded-full bg-white/20"></div>
          <div className="absolute -left-12 top-10 w-32 h-32 rounded-full bg-white/10"></div>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-white/90">
            Current Balance
            {refreshing && (
              <span className="ml-2 inline-block">
                <RefreshCw className="h-3 w-3 animate-spin text-white/70" />
              </span>
            )}
            {!refreshing && (
              <span 
                className="ml-2 inline-block cursor-pointer" 
                onClick={handleRefresh}
              >
                <RefreshCw className="h-3 w-3 text-white/70 hover:text-white" />
              </span>
            )}
          </div>
          <div className="casino-747-logo">
            <img 
              src="/assets/logos/747logo.png" 
              alt="747 Casino"
              className="h-10 w-auto"
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = `
                  <div class="text-xs font-bold text-white">
                    <span class="text-blue-900">7</span><span class="text-green-500">4</span><span class="text-blue-900">7</span>
                  </div>
                `;
              }}
            />
          </div>
        </div>
        
        {/* Amount */}
        <div className="my-3">
          <motion.h3 
            className="text-3xl font-bold text-white"
            initial={{ opacity: 0, y: 5 }}
            animate={isCasinoBalanceUpdated ? balanceControls : { opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {isCasinoBalanceLoading && !casinoBalance ? (
              <div className="h-8 w-32 bg-white/20 rounded-md animate-pulse"></div>
            ) : (
              showBalance ? `₱${displayBalance.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}` : '₱••••••••'
            )}
          </motion.h3>
        </div>
        
        {/* Card Number */}
        <div>
          <div className="text-sm text-white">
            {showBalance ? formattedCardNumber : '5282 3456 **** ****'}
          </div>
        </div>
        
        {/* Manager Info - styled as requested with colored badges */}
        <div className="flex flex-col gap-1 text-xs mt-2">
          <div className="bg-green-500 text-white px-2 py-0.5 rounded-md text-[10px] whitespace-nowrap w-fit">
            TOPMANAGER: {topManager || 'None'}
          </div>
          <div className="bg-purple-800 text-white px-2 py-0.5 rounded-md text-[10px] whitespace-nowrap w-fit">
            IMMEDIATE: {immediateManager || 'None'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}