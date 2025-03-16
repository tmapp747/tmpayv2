import { ReactNode, useEffect } from "react";
import MobileNavigation from "./MobileNavigation";
import DesktopSidebar from "./DesktopSidebar";
import { BellIcon, UserIcon } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "@/hooks/use-theme";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [location] = useLocation();
  const { theme } = useTheme();
  
  // Get the current page title based on location
  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Home";
      case "/wallet":
        return "Wallet";
      case "/history":
        return "Transaction History";
      case "/profile":
        return "Profile";
      default:
        return "747 E-Wallet";
    }
  };

  // Mobile viewport optimization
  useEffect(() => {
    const fixViewport = () => {
      // Force redraw to fix any potential scaling issues
      document.body.style.display = 'none';
      document.body.offsetHeight; // Trigger reflow
      document.body.style.display = '';
      
      // Set correct height
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    
    // Run on initial load and when device orientation changes
    fixViewport();
    window.addEventListener('orientationchange', () => {
      setTimeout(fixViewport, 300); // Wait for orientation change to complete
    });
    window.addEventListener('resize', fixViewport);
    
    return () => {
      window.removeEventListener('orientationchange', fixViewport);
      window.removeEventListener('resize', fixViewport);
    };
  }, []);

  return (
    <div className={cn(
      "mobile-container flex min-h-screen pb-16 lg:pb-0 font-inter mobile-safe-area",
      "text-foreground bg-background transition-colors duration-300",
      "max-w-[100vw] overflow-x-hidden", // Prevent horizontal overflow
      theme === "dark" ? "dark" : "light"
    )} 
    style={{ 
      height: 'var(--app-height, 100vh)',
      width: '100%', 
      maxWidth: '100vw',
      overflowX: 'hidden' 
    }}
    data-theme={theme}>
      {/* Desktop Sidebar */}
      <DesktopSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-x-hidden max-w-full relative">
        {/* Header with background blur and gradient */}
        <header className={cn(
          "backdrop-blur-md bg-primary/90 p-4 lg:py-4 lg:px-6 border-b border-secondary/30",
          "flex items-center justify-between shadow-lg sticky top-0 z-20",
          "w-full max-w-[100vw]" // Ensure header doesn't overflow
        )}>
          {/* Background gradient effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary to-primary/90 z-0 opacity-90"></div>
          
          <div className="flex items-center lg:hidden mobile-clickable relative z-10">
            <div className="w-10 h-10 overflow-hidden relative">
              <div className="absolute inset-0 bg-yellow-500/10 rounded-full animate-pulse"></div>
              <svg viewBox="0 0 200 200" className="h-full w-full relative">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#b78628" />
                    <stop offset="100%" stopColor="#f8d568" />
                  </linearGradient>
                </defs>
                <circle cx="100" cy="100" r="90" fill="#1a2b47" />
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="url(#logoGradient)" fontSize="60" fontWeight="bold">747</text>
              </svg>
            </div>
            <h1 className="text-xl font-bold ml-2 text-white font-montserrat truncate">
              747 <span className="bg-clip-text text-transparent bg-gradient-to-r from-secondary to-secondary/80">E-Wallet</span>
            </h1>
          </div>
          
          <div className="hidden lg:block relative z-10">
            <h1 className="text-xl font-bold text-white">{getPageTitle()}</h1>
          </div>
          
          <div className="flex items-center space-x-3 relative z-10">
            <ThemeToggle />
            <div className="relative">
              <button className="p-2 rounded-full text-gray-200 hover:text-white hover:bg-white/10 transition-all duration-200 mobile-clickable shadow-sm">
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full shadow-md">3</span>
              </button>
            </div>
            <div className="lg:hidden">
              <button className="p-2 rounded-full text-gray-200 hover:text-white hover:bg-white/10 transition-all duration-200 mobile-clickable shadow-sm">
                <UserIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>
        
        {/* Background pattern/texture */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"></div>
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, gray 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
        </div>
        
        {/* Content Container - Using mobile-container for smooth scrolling */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden -webkit-overflow-scrolling-touch scrollbar-none max-w-full relative z-10">
          <div className="mx-auto p-4 max-w-full overflow-x-hidden">
            {children}
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation - Fixed at bottom with blur effect */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 backdrop-blur-md bg-background/80 shadow-lg border-t border-gray-200 dark:border-gray-800">
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-background/70 z-0"></div>
        <MobileNavigation />
      </div>
    </div>
  );
};

export default Layout;
