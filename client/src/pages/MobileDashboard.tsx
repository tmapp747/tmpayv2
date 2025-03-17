import React, { useState } from 'react';
import NewBalanceCard from '@/components/NewBalanceCard';
import BottomNavBar from '@/components/navigation/BottomNavBar';
import { ChevronRight, SquareStack, ChevronDown, ArrowDownToLine, ScanLine, CreditCard } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';

export default function MobileDashboard() {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  // Demo transactions that match reference design
  const transactions = [
    { 
      id: 1, 
      title: 'Restaurant Da Paolo', 
      amount: -96.50, 
      time: '02:45 PM', 
      date: '28.01.2022',
      type: 'payment',
      icon: <SquareStack className="h-6 w-6 text-white" />
    },
    { 
      id: 2, 
      title: 'Cash Inflow', 
      amount: 22.50, 
      time: '02:45 PM', 
      date: '28.01.2022',
      type: 'deposit',
      icon: <ArrowDownToLine className="h-6 w-6 text-white" />
    },
    { 
      id: 3, 
      title: 'Restaurant Da Paolo', 
      amount: -96.50, 
      time: '02:45 PM', 
      date: '28.01.2022',
      type: 'payment',
      icon: <SquareStack className="h-6 w-6 text-white" />
    }
  ];
  
  return (
    <div className="banking-app min-h-screen pb-20">
      {/* App Header */}
      <header className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
              <img 
                src="https://i.pravatar.cc/40?img=8" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
              <span className="font-medium">David</span>
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
        {/* Balance Card */}
        <NewBalanceCard />
        
        {/* Quick Action Buttons */}
        <div className="flex justify-center gap-4 text-center text-xs px-4">
          <div className="flex flex-col items-center space-y-2">
            <div className="banking-btn with-ripple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4V20M20 12H4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span>Transfer</span>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <div className="banking-btn with-ripple">
              <ArrowDownToLine className="h-6 w-6 text-white" />
            </div>
            <span>Receive</span>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <div className="banking-btn with-ripple">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <span>Payment</span>
          </div>
        </div>
        
        {/* Transactions List */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">Last Transaction</h2>
            <Link href="/history" className="text-sm text-blue-300 flex items-center with-ripple">
              View All
            </Link>
          </div>
          
          <div className="space-y-5">
            {transactions.map(tx => (
              <div key={tx.id} className="transaction-item">
                <div className="flex items-center gap-3">
                  <div className="transaction-icon">
                    {tx.icon}
                  </div>
                  <div>
                    <h3 className="font-medium">{tx.title}</h3>
                    <p className="text-xs text-gray-400">{tx.time} • {tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={tx.amount > 0 ? 'transaction-amount-positive font-semibold' : 'transaction-amount-negative font-semibold'}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      {/* Bottom Navigation */}
      <BottomNavBar />
    </div>
  );
}