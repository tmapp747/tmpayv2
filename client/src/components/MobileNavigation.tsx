import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, Wallet, History, User, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const MobileNavigation = () => {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  const { toast } = useToast();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const navLinks = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/wallet", icon: Wallet, label: "Wallet" },
    { path: "/history", icon: History, label: "History" },
    { path: "/profile", icon: User, label: "Profile" },
  ];
  
  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logoutMutation.mutate();
    // Adding a fallback in case the mutation doesn't redirect
    setTimeout(() => {
      if (document.location.pathname !== '/auth') {
        document.location.href = '/auth';
      }
    }, 2000);
  };

  return (
    <>
      {showLogoutConfirm && (
        <div className="lg:hidden fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-[#1a2b47] p-5 m-4 rounded-lg shadow-lg mobile-safe-area border border-[#3a4c67]/40">
            <h3 className="font-bold text-lg text-white mb-3">Confirm Logout</h3>
            <p className="text-white mb-4">Are you sure you want to logout?</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3 py-2 rounded-md bg-[#3a4c67] text-white font-medium native-button mobile-clickable hover:bg-[#4a5c77] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="px-3 py-2 rounded-md bg-red-600 text-white font-medium native-button mobile-clickable hover:bg-red-500 transition-colors"
              >
                {logoutMutation.isPending ? (
                  <div className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Logging out...</span>
                  </div>
                ) : (
                  "Logout"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-[#1a2b47] border-t border-[#3a4c67]/40 z-40 shadow-lg mobile-safe-area" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around p-2">
          {navLinks.map((link) => {
            const isActive = location === link.path;
            return (
              <Link
                key={link.path}
                href={link.path}
                className={cn(
                  "flex flex-col items-center p-2 text-white mobile-clickable",
                  isActive && "bg-[#2a3b57] rounded-lg"
                )}
              >
                <link.icon className="h-5 w-5 text-white" />
                <span className="text-xs mt-1 font-medium text-white">{link.label}</span>
              </Link>
            );
          })}
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="flex flex-col items-center p-2 text-white hover:text-white mobile-clickable"
          >
            <LogOut className="h-5 w-5 text-white" />
            <span className="text-xs mt-1 font-medium text-white">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;
