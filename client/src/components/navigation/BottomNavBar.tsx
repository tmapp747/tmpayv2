import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Home, Wallet, BarChart3, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BottomNavBar() {
  const [location] = useLocation();
  const [touchedItem, setTouchedItem] = useState<string | null>(null);
  
  const navItems = [
    {
      name: 'Home',
      path: '/mobile',
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9.5L12 4L21 9.5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V9.5Z" 
            stroke={active ? "white" : "#667085"} 
            fill={active ? "#1D4ED8" : "transparent"}
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      name: 'Wallet',
      path: '/mobile-wallet',
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 5H6C4.34315 5 3 6.34315 3 8V16C3 17.6569 4.34315 19 6 19H18C19.6569 19 21 17.6569 21 16V8C21 6.34315 19.6569 5 18 5Z" 
            stroke={active ? "white" : "#667085"} 
            fill={active ? "#1D4ED8" : "transparent"}
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"/>
          <path d="M21 12H17C16.4696 12 15.9609 12.2107 15.5858 12.5858C15.2107 12.9609 15 13.4696 15 14C15 14.5304 15.2107 15.0391 15.5858 15.4142C15.9609 15.7893 16.4696 16 17 16H21" 
            stroke={active ? "white" : "#667085"} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      name: 'History',
      path: '/history',
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 13V17M12 9V17M16 5V17M5 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V5C21 4.46957 20.7893 3.96086 20.4142 3.58579C20.0391 3.21071 19.5304 3 19 3H5C4.46957 3 3.96086 3.21071 3.58579 3.58579C3.21071 3.96086 3 4.46957 3 5V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21Z" 
            stroke={active ? "white" : "#667085"} 
            fill={active ? "#1D4ED8" : "transparent"}
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      name: 'Profile',
      path: '/mobile-profile',
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" 
            stroke={active ? "white" : "#667085"} 
            fill={active ? "#1D4ED8" : "transparent"}
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"/>
          <path d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21" 
            stroke={active ? "white" : "#667085"} 
            fill={active ? "#1D4ED8" : "transparent"}
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"/>
        </svg>
      )
    }
  ];
  
  return (
    <div className="h-safe-bottom">
      <motion.nav 
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#002D87] rounded-t-[20px] shadow-2xl p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0))]"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          delay: 0.2
        }}
      >
        <div className="flex justify-around w-full relative">
          {/* Animated active background indicator */}
          <AnimatePresence>
            {navItems.map((item, index) => {
              const isActive = location === item.path;
              if (!isActive) return null;
              
              return (
                <motion.div
                  key={`bg-${item.name}`}
                  className="absolute bottom-0 w-1/4 h-full"
                  initial={{ x: `${index * 100}%`, opacity: 0 }}
                  animate={{ 
                    x: `${index * 100}%`, 
                    opacity: 1,
                    scale: [1, 1.05, 1]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 500, 
                    damping: 30 
                  }}
                >
                  <div className="mx-auto w-12 h-1 bg-blue-400 rounded-full mt-1 absolute bottom-0 left-0 right-0" />
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {/* Nav Items */}
          {navItems.map((item, index) => {
            const isActive = location === item.path;
            const isTouched = touchedItem === item.name;
            
            return (
              <Link
                key={item.name}
                href={item.path}
                className="flex flex-col items-center justify-center relative"
              >
                <motion.div
                  onTouchStart={() => setTouchedItem(item.name)}
                  onTouchEnd={() => setTouchedItem(null)}
                  whileTap={{ scale: 0.92 }}
                  animate={{ 
                    y: isActive ? -3 : 0,
                    scale: isActive ? 1.05 : 1
                  }}
                  transition={{ type: "spring", stiffness: 500 }}
                  className="relative"
                >
                  {/* Add subtle glow effect for active item */}
                  {isActive && (
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md -z-10" />
                  )}
                  
                  {item.icon(isActive)}
                  
                  {/* Subtle ripple effect on touch */}
                  <AnimatePresence>
                    {isTouched && (
                      <motion.div
                        className="absolute inset-0 bg-white/20 rounded-full -z-10"
                        initial={{ scale: 0, opacity: 0.5 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
                
                <motion.span 
                  className={`text-xs mt-1 ${isActive ? 'text-white font-medium' : 'text-gray-400'}`}
                  animate={{ 
                    y: isActive ? -2 : 0,
                    opacity: isActive ? 1 : 0.8
                  }}
                >
                  {item.name}
                </motion.span>
              </Link>
            );
          })}
        </div>
      </motion.nav>
      <div className="h-16"></div> {/* Spacer to account for the fixed navbar */}
    </div>
  );
}