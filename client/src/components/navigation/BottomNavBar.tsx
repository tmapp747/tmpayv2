import React from 'react';
import { useLocation, Link } from 'wouter';
import { Home, Wallet, User, BarChart, Settings } from 'lucide-react';

export default function BottomNavBar() {
  const [location] = useLocation();
  
  const navItems = [
    {
      name: 'Home',
      path: '/',
      icon: Home
    },
    {
      name: 'Wallet',
      path: '/wallet',
      icon: Wallet
    },
    {
      name: 'Markets',
      path: '/markets',
      icon: BarChart
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: User
    }
  ];
  
  return (
    <div className="h-safe-bottom">
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card-dark border-t border-border-dark p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0))]">
        <div className="grid grid-cols-4 gap-1 w-full max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex flex-col items-center justify-center py-2 mobile-clickable ${
                  isActive 
                    ? 'text-primary-light' 
                    : 'text-muted-foreground'
                }`}
              >
                <Icon size={22} className={`mb-1 ${isActive ? 'text-primary-light' : 'text-muted-foreground'}`} />
                <span className="text-xs font-medium">{item.name}</span>
                {isActive && (
                  <div className="absolute -top-[2px] w-12 h-1 bg-primary-light rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="h-16"></div> {/* Spacer to account for the fixed navbar */}
    </div>
  );
}