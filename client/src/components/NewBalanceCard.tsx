import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import { User } from '@/lib/types';
import { LucideIcon, CreditCard, MoreHorizontal } from 'lucide-react';
import mastercard from '@/assets/mastercard.svg';

interface NewBalanceCardProps {
  className?: string;
  showCardNumber?: boolean;
}

// Mock card number display format: XXXX XXXX XXXX 1234
const formatCardNumber = (cardNumber: string = "5282345678901289") => {
  // Show only last 4 digits
  return cardNumber.replace(/\s/g, '').replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
};

export default function NewBalanceCard({ className = '', showCardNumber = true }: NewBalanceCardProps) {
  const { data, isLoading, error } = useQuery<{ user: User }>({
    queryKey: ['/api/user/info'],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [balance, setBalance] = useState('0');
  const [expiryDate, setExpiryDate] = useState('09/25');
  const [cardNum, setCardNum] = useState('5282 3456 7890 1289');

  useEffect(() => {
    if (data?.user) {
      setBalance(String(data.user.balance || '0'));
    }
  }, [data]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  return (
    <div 
      className={`bg-card-gradient relative rounded-3xl p-5 overflow-hidden shadow-lg ${className}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-white/80 text-sm font-medium">Current Balance</p>
          <h2 className="text-white text-3xl font-bold mt-1">
            {isLoading ? (
              <div className="h-9 w-32 bg-white/20 animate-pulse rounded-md"></div>
            ) : (
              formatCurrency(balance)
            )}
          </h2>
        </div>
        <div className="relative">
          <img src={mastercard} alt="Mastercard" className="h-9 w-auto" />
        </div>
      </div>

      {showCardNumber && (
        <div className="mt-6">
          <p className="text-white/90 text-base tracking-widest font-medium">{cardNum}</p>
          <div className="flex justify-between items-center mt-2">
            <p className="text-white/70 text-xs">
              VALID THRU: {expiryDate}
            </p>
          </div>
        </div>
      )}

      {/* Decorative circles in the background */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10"></div>
      <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-white/5"></div>
    </div>
  );
}