import { Home, Wallet, User, History } from "lucide-react";
import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function BottomNavBar() {
  // Use the standard /mobile/* route pattern
  const [isHomePage] = useRoute("/mobile");
  const [isWalletPage] = useRoute("/mobile/wallet");
  const [isProfilePage] = useRoute("/mobile/profile");
  const [isDepositPage] = useRoute("/mobile/deposit");
  
  // For backward compatibility with legacy routes
  const [isWalletPageAlt] = useRoute("/mobile-wallet");
  const [isProfilePageAlt] = useRoute("/mobile-profile");
  const [isDepositPageAlt] = useRoute("/mobile-deposit");
  
  // New history page route
  const [isHistoryPage] = useRoute("/mobile/history");
  
  const [lastScrollY, setLastScrollY] = useState(0);
  const [hidden, setHidden] = useState(false);
  
  // Handle scroll behavior for hiding navbar on scroll down
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);
  
  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#001138] to-[#001c4d] border-t border-white/10 shadow-lg p-2 z-50 backdrop-blur-md"
      initial={{ y: 0 }}
      animate={{ y: hidden ? 80 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-around">
        <NavItem 
          href="/mobile" 
          icon={<Home size={24} />} 
          label="Home" 
          isActive={isHomePage}
        />
        <NavItem 
          href="/mobile/wallet" 
          icon={<Wallet size={24} />} 
          label="Wallet" 
          isActive={isWalletPage || isWalletPageAlt || isDepositPage || isDepositPageAlt}
        />
        <NavItem 
          href="/history" 
          icon={<History size={24} />} 
          label="History" 
          isActive={false}
        />
        <NavItem 
          href="/mobile/profile" 
          icon={<User size={24} />} 
          label="Profile" 
          isActive={isProfilePage || isProfilePageAlt}
        />
      </div>
      
      {/* iPhone home indicator spacing */}
      <div className="h-5" />
    </motion.div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link href={href}>
      <motion.div 
        className={`flex flex-col items-center py-1 px-3 rounded-lg ${
          isActive ? 'text-white' : 'text-gray-400'
        }`}
        whileTap={{ scale: 0.9 }}
      >
        <div className={`${isActive ? 'bg-blue-600/20 text-blue-500' : ''} p-2 rounded-full`}>
          {icon}
        </div>
        <span className="text-xs mt-1">{label}</span>
        
        {isActive && (
          <motion.div 
            layoutId="activeNavIndicator"
            className="absolute bottom-[5px] w-1.5 h-1.5 rounded-full bg-blue-500"
          />
        )}
      </motion.div>
    </Link>
  );
}