import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Wallet, 
  History, 
  Activity, 
  Settings, 
  LogOut,
  User,
  Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const DesktopSidebar = () => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  
  const navLinks = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/wallet", icon: Wallet, label: "Wallet" },
    { path: "/history", icon: History, label: "History" },
    { path: "/activity", icon: Activity, label: "Activity" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 bg-primary border-r-2 border-secondary/40 relative" 
         style={{
           boxShadow: '4px 0 20px rgba(0, 0, 0, 0.25), inset 1px 0 0 rgba(255, 255, 255, 0.05)',
         }}>
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-50"></div>
      
      <div className="flex justify-center p-4 border-b border-secondary/30 relative">
        <div className="flex items-center">
          <div className="w-12 h-12 overflow-hidden relative" style={{
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
            transform: 'translateZ(0)'
          }}>
            <svg viewBox="0 0 200 200" className="h-full w-full">
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#d4af37" />
                  <stop offset="50%" stopColor="#f2d87f" />
                  <stop offset="100%" stopColor="#b78628" />
                </linearGradient>
              </defs>
              <circle cx="100" cy="100" r="90" fill="#1a2b47" />
              <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="url(#goldGradient)" fontSize="60" fontWeight="bold" style={{textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'}}>747</text>
            </svg>
          </div>
          <div className="ml-2">
            <h1 className="text-xl font-bold text-white font-montserrat" style={{textShadow: '0 2px 3px rgba(0, 0, 0, 0.5)'}}>
              747 <span className="text-secondary" style={{filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))'}}>E-Wallet</span>
            </h1>
          </div>
        </div>
      </div>
      
      <div className="flex-grow py-4 relative z-10">
        <ul className="space-y-2">
          {navLinks.map((link) => {
            const isActive = location === link.path;
            return (
              <li key={link.path} className="px-4">
                <Link 
                  href={link.path}
                  className={cn(
                    "flex items-center py-2 px-4 text-white rounded-md relative transition-all duration-200",
                    isActive 
                      ? "bg-secondary/20 border border-secondary/30" 
                      : "hover:bg-secondary/10 border border-transparent hover:border-secondary/20"
                  )}
                  style={isActive ? {
                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2), 0 1px 0 rgba(255, 255, 255, 0.05)',
                    transform: 'translateZ(0)'
                  } : {}}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-l-md" 
                         style={{boxShadow: '0 0 8px rgba(183, 134, 40, 0.5)'}}></div>
                  )}
                  <link.icon className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isActive ? "text-secondary" : "text-white"
                  )} style={isActive ? {filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'} : {}} />
                  <span className={cn(
                    "ml-3 transition-all duration-200",
                    isActive ? "font-medium text-secondary" : ""
                  )} style={isActive ? {textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'} : {}}>
                    {link.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      
      <div className="p-4 border-t border-secondary/30 relative z-10">
        <div className="flex items-center p-2 rounded-lg bg-secondary/10 border border-secondary/20"
             style={{boxShadow: 'inset 0 1px 1px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.05)'}}>
          <div className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center"
               style={{boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1)'}}>
            <User className="h-5 w-5 text-white" style={{filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3))'}} />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'}}>
              {user?.username || "Loading..."}
            </p>
            <p className="text-xs text-gray-300">
              {user?.isVip ? "VIP Member" : "Member"}
            </p>
          </div>
          <button 
            onClick={() => logoutMutation.mutate()} 
            disabled={logoutMutation.isPending}
            className="ml-auto text-gray-300 hover:text-white p-2 rounded-full hover:bg-primary/40 transition-all"
            style={{
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
              transform: 'translateZ(0)'
            }}
            title="Logout"
          >
            {logoutMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5" style={{filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3))'}} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesktopSidebar;
