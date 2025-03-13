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
    <div className="hidden lg:flex lg:flex-col lg:w-64 bg-primary border-r border-secondary/30">
      <div className="flex justify-center p-4 border-b border-secondary/30">
        <div className="flex items-center">
          <div className="w-12 h-12 overflow-hidden">
            <svg viewBox="0 0 200 200" className="h-full w-full">
              <circle cx="100" cy="100" r="90" fill="#1a2b47" />
              <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#b78628" fontSize="60" fontWeight="bold">747</text>
            </svg>
          </div>
          <div className="ml-2">
            <h1 className="text-xl font-bold text-white font-montserrat">
              747 <span className="text-secondary">E-Wallet</span>
            </h1>
          </div>
        </div>
      </div>
      
      <div className="flex-grow py-4">
        <ul className="space-y-2">
          {navLinks.map((link) => {
            const isActive = location === link.path;
            return (
              <li key={link.path} className="px-4">
                <Link 
                  href={link.path}
                  className={cn(
                    "flex items-center py-2 px-4 text-white hover:bg-secondary/20 rounded-md",
                    isActive && "bg-secondary/20"
                  )}
                >
                  <link.icon className={cn(
                    "h-5 w-5",
                    isActive && "text-secondary"
                  )} />
                  <span className={cn(
                    "ml-3",
                    isActive && "font-medium"
                  )}>
                    {link.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      
      <div className="p-4 border-t border-secondary/30">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">
              {user?.username || "Loading..."}
            </p>
            <p className="text-xs text-gray-300">
              {user?.isVip ? "VIP Member" : "Member"}
            </p>
          </div>
          <button 
            onClick={() => logoutMutation.mutate()} 
            disabled={logoutMutation.isPending}
            className="ml-auto text-gray-300 hover:text-white p-2 rounded-full hover:bg-primary/30 transition-colors"
            title="Logout"
          >
            {logoutMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesktopSidebar;
