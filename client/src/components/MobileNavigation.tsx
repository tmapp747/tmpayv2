import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, Wallet, History, User } from "lucide-react";

const MobileNavigation = () => {
  const [location] = useLocation();
  
  const navLinks = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/wallet", icon: Wallet, label: "Wallet" },
    { path: "/history", icon: History, label: "History" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 w-full bg-primary border-t border-secondary/30 z-50 shadow-lg">
      <div className="flex items-center justify-around p-2">
        {navLinks.map((link) => {
          const isActive = location === link.path;
          return (
            <Link
              key={link.path}
              href={link.path}
              className={cn(
                "flex flex-col items-center p-2 text-white",
                isActive && "bg-secondary/20 rounded-lg"
              )}
            >
              <link.icon className={cn(
                "h-5 w-5",
                isActive && "text-secondary"
              )} />
              <span className="text-xs mt-1">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNavigation;
