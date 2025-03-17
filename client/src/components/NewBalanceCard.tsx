import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, Eye, EyeOff, RefreshCw, ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { User } from '@/lib/types';
import { motion } from 'framer-motion';

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
  
  // Format casino ID as a card number
  const formatCasinoId = (id: string) => {
    if (!id) return '5282 3456 7890 1289';
    
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
  
  // Get current expiry date (09/25 format - always 2 years from now)
  const getExpiryDate = () => {
    const date = new Date();
    const month = date.getMonth() + 1;
    const year = (date.getFullYear() + 2) % 100;
    return `${month.toString().padStart(2, '0')}/${year.toString().padStart(2, '0')}`;
  };
  
  if (isLoading) {
    return (
      <div className={`rounded-[24px] p-5 h-56 mx-4 animate-pulse bg-gradient-to-br from-blue-500 to-cyan-400 w-auto shadow-xl ${className}`}>
        <div className="flex flex-col h-full justify-between">
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 bg-white/20 rounded-md"></div>
            <div className="h-6 w-10 bg-white/20 rounded-md"></div>
          </div>
          <div className="space-y-2">
            <div className="h-10 w-40 bg-white/20 rounded-md"></div>
            <div className="h-5 w-24 bg-white/20 rounded-md"></div>
          </div>
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 bg-white/20 rounded-md"></div>
            <div className="h-5 w-14 bg-white/20 rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !data?.user) {
    return (
      <motion.div 
        className={`rounded-[24px] mx-4 p-5 h-56 bg-gradient-to-br from-blue-600 to-cyan-500 w-auto text-white shadow-xl overflow-hidden ${className}`}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex flex-col h-full justify-between">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-white/90">Current Balance</div>
            <div className="mastercard-logo">
              <div className="flex">
                <div className="w-7 h-7 bg-yellow-500 rounded-full"></div>
                <div className="w-7 h-7 bg-red-500 rounded-full -ml-3"></div>
              </div>
              <div className="text-[8px] text-center text-white mt-1">mastercard</div>
            </div>
          </div>
          <div className="my-4">
            <h3 className="text-2xl font-bold">Sign in to view</h3>
            <p className="text-sm text-white/90">Please login to see your balance</p>
          </div>
          <div className="text-xs text-white pt-4 flex justify-between mt-4">
            <div>5282 3456 **** ****</div>
            <div>09/25</div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  const { balance, pendingBalance, casinoBalance, casinoId, username } = data.user;
  const totalBalance = parseFloat(balance as string) + parseFloat(pendingBalance as string);
  const formattedCardNumber = formatCasinoId(casinoId);
  const expiryDate = getExpiryDate();
  
  return (
    <motion.div 
      ref={cardRef}
      className={`rounded-[24px] mx-4 p-5 h-56 overflow-hidden w-auto shadow-2xl ${className}`}
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
          <div className="text-sm font-medium text-white/90">Current Balance</div>
          <div className="mastercard-logo">
            <div className="flex">
              <div className="w-7 h-7 bg-yellow-500 rounded-full"></div>
              <div className="w-7 h-7 bg-red-500 rounded-full -ml-3"></div>
            </div>
            <div className="text-[8px] text-center text-white mt-1">mastercard</div>
          </div>
        </div>
        
        {/* Amount */}
        <div className="my-3">
          <motion.h3 
            className="text-3xl font-bold text-white"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            ${showBalance ? (totalBalance).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }) : '••••••••'}
          </motion.h3>
        </div>
        
        {/* Card Number and Expiry */}
        <div className="text-sm text-white flex justify-between mt-auto">
          <div>{showBalance ? formattedCardNumber : '5282 3456 **** ****'}</div>
          <div>{expiryDate}</div>
        </div>
      </div>
    </motion.div>
  );
}