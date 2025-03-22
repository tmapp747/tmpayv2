import { ReactNode, useEffect } from "react";
import MobileNavigation from "./MobileNavigation";
import { BellIcon, UserIcon } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "@/hooks/use-theme";
import teamMarcLogo from "../assets/Logo teammarc.png";

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
      case "/mobile/dashboard":
        return "Home";
      case "/wallet":
      case "/mobile/wallet":
        return "Wallet";
      case "/history":
      case "/mobile/history":
        return "Transaction History";
      case "/profile":
      case "/mobile/profile":
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
      "mobile-container flex min-h-screen pb-16 font-inter mobile-safe-area",
      "text-foreground bg-background transition-colors duration-300",
      "max-w-[100vw] overflow-x-hidden", // Prevent horizontal overflow
      theme === "dark" ? "dark" : "light"
    )} 
    style={{ 
      height: 'var(--app-height, 100vh)',
      width: '100%', 
      maxWidth: '100vw',
      overflowX: 'hidden',
      paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 64px)', // Safe bottom padding for mobile
    }}
    data-theme={theme}>
      {/* Desktop sidebar removed - using mobile layout for all devices */}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-x-hidden max-w-full relative">
        {/* Header with enhanced 3D styling */}
        <header className={cn(
          "bg-[#1a2b47] p-4 border-b-2 border-[#3a4c67]/60",
          "flex items-center justify-between sticky top-0 z-20",
          "w-full max-w-[100vw] relative" // Ensure header doesn't overflow
        )} style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          background: 'linear-gradient(to bottom, #1f3459 0%, #1a2b47 100%)'
        }}>
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-60"></div>
          
          <div className="flex items-center mobile-clickable relative z-10">
            <div className="w-10 h-10 overflow-hidden" style={{
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
              transform: 'translateZ(0)'
            }}>
              <svg viewBox="0 0 200 200" className="h-full w-full">
                <defs>
                  <linearGradient id="headerGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d4af37" />
                    <stop offset="50%" stopColor="#f2d87f" />
                    <stop offset="100%" stopColor="#b78628" />
                  </linearGradient>
                </defs>
                <circle cx="100" cy="100" r="90" fill="#1a2b47" />
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="url(#headerGoldGradient)" stroke="#000000" strokeWidth="1" fontSize="60" fontWeight="bold">747</text>
              </svg>
            </div>
            <h1 className="text-xl font-bold ml-2 text-white font-montserrat truncate" style={{
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
            }}>
              747 <span className="text-secondary" style={{ 
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)',
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
              }}>E-Wallet</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-3 relative z-10">
            <ThemeToggle />
            <div className="relative">
              <button className="p-2 rounded-full text-white hover:bg-primary-foreground/20 transition-all duration-200 mobile-clickable"
                     style={{
                       boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                       transform: 'translateZ(0)'
                     }}>
                <BellIcon className="h-5 w-5" style={{filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3))'}} />
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full"
                      style={{
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}>3</span>
              </button>
            </div>
            <div>
              <button className="p-2 rounded-full text-white hover:bg-primary-foreground/20 transition-all duration-200 mobile-clickable"
                     style={{
                       boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                       transform: 'translateZ(0)'
                     }}>
                <UserIcon className="h-5 w-5" style={{filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3))'}} />
              </button>
            </div>
          </div>
        </header>
        
        {/* Enhanced background pattern/texture with 3D feeling */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-60"></div>
          <div className="absolute inset-0 opacity-5" style={{ 
            backgroundImage: 'radial-gradient(circle at 1px 1px, gray 1px, transparent 0)', 
            backgroundSize: '20px 20px',
            boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.2)' 
          }}></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5 opacity-30"></div>
        </div>
        
        {/* Content Container with enhanced depth */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden -webkit-overflow-scrolling-touch scrollbar-none max-w-full relative z-10" 
             style={{
               perspective: '1000px',
               perspectiveOrigin: 'center'
             }}>
          {/* Added proper padding: pt-4 for header spacing, and increased bottom padding for mobile navigation */}
          <div className="mx-auto p-4 pt-4 pb-20 max-w-full overflow-x-hidden relative">
            {/* Subtle depth effect for content */}
            <div className="absolute inset-0 pointer-events-none rounded-lg opacity-50"
                 style={{
                   background: 'radial-gradient(circle at center top, rgba(255,255,255,0.05) 0%, transparent 70%)',
                   filter: 'blur(20px)'
                 }}>
            </div>
            {children}
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation - now shown for all devices */}
      <MobileNavigation />
    </div>
  );
};

export default Layout;
