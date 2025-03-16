import { ReactNode } from "react";
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

  return (
    <div className={cn(
      "mobile-container flex min-h-screen pb-16 lg:pb-0 font-inter mobile-safe-area",
      "text-foreground bg-background transition-colors duration-300",
      theme === "dark" ? "dark" : "light"
    )} 
    style={{ height: 'var(--app-height, 100vh)' }}
    data-theme={theme}>
      {/* Desktop Sidebar */}
      <DesktopSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className={cn(
          "bg-primary p-4 lg:py-4 lg:px-6 border-b border-secondary/30",
          "flex items-center justify-between shadow-md sticky top-0 z-10"
        )}>
          <div className="flex items-center lg:hidden mobile-clickable">
            <div className="w-10 h-10 overflow-hidden">
              <svg viewBox="0 0 200 200" className="h-full w-full">
                <circle cx="100" cy="100" r="90" fill="#1a2b47" />
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#b78628" fontSize="60" fontWeight="bold">747</text>
              </svg>
            </div>
            <h1 className="text-xl font-bold ml-2 text-white font-montserrat">
              747 <span className="text-secondary">E-Wallet</span>
            </h1>
          </div>
          
          <div className="hidden lg:block">
            <h1 className="text-xl font-bold text-white">{getPageTitle()}</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <div className="relative">
              <button className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-primary/80 mobile-clickable">
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-0 right-0 bg-error text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">3</span>
              </button>
            </div>
            <div className="lg:hidden">
              <button className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-primary/80 mobile-clickable">
                <UserIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>
        
        {/* Content Container - Using mobile-container for smooth scrolling */}
        <div className="flex-1 overflow-y-auto -webkit-overflow-scrolling-touch scrollbar-none">
          <div className="container mx-auto p-4">
            {children}
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation - Fixed at bottom */}
      <MobileNavigation />
    </div>
  );
};

export default Layout;
