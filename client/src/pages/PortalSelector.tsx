import { useEffect } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { LogOut } from 'lucide-react';

/**
 * Portal selector page that allows users to choose between player or agent portal
 */
export default function PortalSelector() {
  const { user, logout } = useAuth();

  useEffect(() => {
    // Set page title
    document.title = '747 Portal Selection';
    
    // Apply mobile-specific enhancements
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    // Set initial viewport height and update on resize
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    
    return () => {
      window.removeEventListener('resize', setViewportHeight);
    };
  }, []);
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001138] to-[#002D87] flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#00174F]/95 backdrop-blur-md py-3">
        <div className="container flex items-center justify-between mx-4">
          {/* Logo */}
          <div className="relative flex items-center justify-center h-10 w-auto">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-300/40 to-amber-500/30 blur-xl transform scale-[1.4] animate-pulse-slow opacity-70"></div>
            <div className="absolute inset-0 rounded-full bg-white/30 blur-lg transform scale-[1.2]"></div>
            <img 
              src="/assets/logos/747-logo.png" 
              alt="747 Casino" 
              className="h-10 w-auto object-contain relative z-10 drop-shadow-xl"
              style={{filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.4))'}}
            />
          </div>
          
          {/* Title */}
          <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
            <h1 className="text-xl font-semibold text-white">747 Portals</h1>
          </div>
          
          {/* Logout Button */}
          {user && (
            <button 
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200 flex items-center"
            >
              <LogOut size={20} className="text-white/90" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-20 px-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Select Portal</h2>
            <p className="text-blue-100/80">Choose which portal you would like to access</p>
          </div>
          
          {/* Portal Options */}
          <div className="grid gap-4">
            {/* Player Portal Card */}
            <Link href="/player">
              <motion.div 
                whileTap={{ scale: 0.98 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 cursor-pointer hover:bg-white/15 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4.5C10.6193 4.5 9.5 5.61929 9.5 7C9.5 8.38071 10.6193 9.5 12 9.5C13.3807 9.5 14.5 8.38071 14.5 7C14.5 5.61929 13.3807 4.5 12 4.5Z" fill="white"/>
                      <path d="M12 11.5C9.49997 11.5 7.5 13.5 7.5 16V20.5H16.5V16C16.5 13.5 14.5 11.5 12 11.5Z" fill="white"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Player Portal</h3>
                    <p className="text-sm text-blue-100/70">Access your player account</p>
                    <div className="mt-1 text-xs text-emerald-300">747ph.live</div>
                  </div>
                </div>
              </motion.div>
            </Link>
            
            {/* Agent Portal Card */}
            <Link href="/agent">
              <motion.div 
                whileTap={{ scale: 0.98 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 cursor-pointer hover:bg-white/15 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center mr-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12L11 14L15 10M20.6179 5.98434C20.4132 5.99472 20.2072 5.99997 20 5.99997C16.9265 5.99997 14.123 4.84453 11.9999 2.94434C9.87691 4.84446 7.07339 5.99985 4 5.99985C3.79277 5.99985 3.58678 5.9946 3.38213 5.98422C3.1327 6.94783 3 7.95842 3 9.00001C3 14.5915 6.82432 19.2898 12 20.622C17.1757 19.2898 21 14.5915 21 9.00001C21 7.95847 20.8673 6.94791 20.6179 5.98434Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Agent Portal</h3>
                    <p className="text-sm text-blue-100/70">Manage your agent operations</p>
                    <div className="mt-1 text-xs text-amber-300">agents.747ph.live</div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-white/50 text-xs">
        <p>© {new Date().getFullYear()} 747 Casino. All rights reserved.</p>
      </footer>
    </div>
  );
}