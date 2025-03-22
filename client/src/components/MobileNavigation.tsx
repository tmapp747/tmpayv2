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

  // Update paths to match our mobile-only strategy
  const navLinks = [
    { path: "/mobile/dashboard", icon: Home, label: "Home" },
    { path: "/mobile/wallet", icon: Wallet, label: "Wallet" },
    { path: "/mobile/history", icon: History, label: "History" },
    { path: "/mobile/profile", icon: User, label: "Profile" },
  ];

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logoutMutation.mutate();
    // Adding a fallback in case the mutation doesn't redirect
    setTimeout(() => {
      if (document.location.pathname !== '/mobile/auth') {
        document.location.href = '/mobile/auth';
      }
    }, 2000);
  };

  return (
    <>
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-[#1a2b47] p-5 m-4 rounded-lg mobile-safe-area border-2 border-[#3a4c67]/60 relative"
               style={{
                 boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4), 0 5px 10px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 0 30px rgba(59, 130, 246, 0.1)',
                 transform: 'translateZ(0px)'
               }}>
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-lg z-0"></div>

            <div className="relative z-10">
              <h3 className="font-bold text-lg text-white mb-3" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Confirm Logout</h3>
              <p className="text-white mb-4">Are you sure you want to logout?</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-3 py-2 rounded-md bg-[#3a4c67] text-white font-medium native-button mobile-clickable hover:bg-[#4a5c77] transition-all"
                  style={{
                    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2), 0 2px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    transform: 'translateY(-1px)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="px-3 py-2 rounded-md bg-red-600 text-white font-medium native-button mobile-clickable hover:bg-red-500 transition-all"
                  style={{
                    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2), 0 2px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    transform: 'translateY(-1px)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }}
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
        </div>
      )}

      {/* Removed lg:hidden class to make navigation visible on all devices */}
      <div className="fixed bottom-0 left-0 w-full bg-[#1a2b47] border-t-2 border-[#3a4c67]/60 z-40 mobile-safe-area"
           style={{
             paddingBottom: 'env(safe-area-inset-bottom, 0px)',
             boxShadow: '0 -5px 20px rgba(0, 0, 0, 0.2), 0 -3px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
           }}>
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-70"></div>

        <div className="flex items-center justify-around p-2 relative z-10">
          {navLinks.map((link) => {
            // Check if the current location matches this link path
            // This supports both direct matches and prefix matches
            const isActive = 
              location === link.path || 
              (link.path === "/mobile/dashboard" && location === "/") ||
              (location.startsWith(link.path) && link.path !== "/mobile/dashboard");
              
            return (
              <Link
                key={link.path}
                href={link.path}
                className={cn(
                  "flex flex-col items-center p-2 text-white mobile-clickable relative transition-all",
                  isActive ? "bg-[#2a3b57]/80 rounded-lg" : "hover:bg-[#2a3b57]/30 rounded-lg"
                )}
                style={isActive ? {
                  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2), 0 1px 0 rgba(255, 255, 255, 0.05)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                } : {}}
              >
                {isActive && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/60 rounded-t-lg"></div>
                )}
                <link.icon 
                  className={cn("h-5 w-5 transition-all", isActive ? "text-blue-400" : "text-white")} 
                  style={isActive ? { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' } : {}}
                />
                <span 
                  className={cn("text-xs mt-1 font-medium transition-all", isActive ? "text-blue-300" : "text-white")}
                  style={isActive ? { textShadow: '0 1px 2px rgba(0,0,0,0.3)' } : {}}
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="flex flex-col items-center p-2 text-white hover:bg-[#2a3b57]/30 rounded-lg mobile-clickable transition-all"
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