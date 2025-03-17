import React from 'react';
import NewBalanceCard from '@/components/NewBalanceCard';
import QuickActionButtons from '@/components/QuickActionButtons';
import BottomNavBar from '@/components/navigation/BottomNavBar';
import { ChevronRight, Clock, Bell } from 'lucide-react';
import { Link } from 'wouter';

export default function MobileDashboard() {
  // Recent transactions (placeholder data for demonstration)
  const recentTransactions = [
    { id: 1, type: 'deposit', amount: 1000, date: new Date(), status: 'completed' },
    { id: 2, type: 'transfer', amount: 500, date: new Date(Date.now() - 3600000), status: 'completed' }
  ];
  
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* App Header */}
      <header className="bg-primary-dark p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">TeamMARC</h1>
            <p className="text-xs text-white/70">Premium Casino Wallet</p>
          </div>
          <div className="flex space-x-3">
            <button className="p-2 rounded-full bg-white/10 mobile-clickable">
              <Clock size={20} className="text-white" />
            </button>
            <button className="p-2 rounded-full bg-white/10 mobile-clickable">
              <Bell size={20} className="text-white" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="p-4 space-y-6">
        <NewBalanceCard />
        
        <section>
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <QuickActionButtons />
        </section>
        
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Link href="/history" className="text-sm text-primary-light flex items-center mobile-clickable">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentTransactions.map(tx => (
              <div key={tx.id} className="bg-card rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'deposit' ? 'bg-green-500/10' : 'bg-blue-500/10'
                  }`}>
                    <span className={`text-lg ${
                      tx.type === 'deposit' ? 'text-green-500' : 'text-blue-500'
                    }`}>
                      {tx.type === 'deposit' ? '↓' : '↔'}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium capitalize">{tx.type}</h3>
                    <p className="text-xs text-muted-foreground">
                      {tx.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {tx.type === 'deposit' ? '+' : ''}₱{tx.amount.toLocaleString()}
                  </p>
                  <span className={`text-xs ${
                    tx.status === 'completed' ? 'text-green-500' : 'text-amber-500'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
            
            {recentTransactions.length === 0 && (
              <div className="bg-card rounded-xl p-4 text-center text-muted-foreground">
                <p>No recent transactions</p>
              </div>
            )}
          </div>
        </section>
        
        <section className="bg-card rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-3">Casino Games</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Access your favorite games with a single tap.
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="aspect-video rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mobile-clickable">
              Slots
            </div>
            <div className="aspect-video rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold mobile-clickable">
              Poker
            </div>
          </div>
        </section>
      </main>
      
      {/* Bottom Navigation */}
      <BottomNavBar />
    </div>
  );
}