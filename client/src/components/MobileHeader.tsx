import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';

type MobileHeaderProps = {
  title: string;
  showBackButton?: boolean;
  showLogout?: boolean;
  transparent?: boolean;
  customClassName?: string;
};

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBackButton = false,
  showLogout = true,
  transparent = false,
  customClassName = ''
}) => {
  const { logout } = useAuth();
  const [, navigate] = useLocation();

  // Handle logout action
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Enhanced Logo Component with glowing effect
  const Logo = () => (
    <div className="relative flex items-center justify-center h-10 w-auto overflow-visible">
      {/* Multi-layered dynamic glow effects */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-300/40 to-amber-500/30 blur-xl transform scale-[1.4] animate-pulse-slow opacity-70"></div>
      <div className="absolute inset-0 rounded-full bg-white/30 blur-lg transform scale-[1.2]"></div>
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 via-purple-400/10 to-amber-500/20 blur-md transform scale-[1.1] animate-pulse-slower"></div>
      
      {/* Light rays shining effect */}
      <div className="absolute inset-0 overflow-hidden rounded-full">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -rotate-45 translate-x-full animate-shine"></div>
      </div>
      
      {/* Logo image with enhanced drop shadow */}
      <img 
        src="/assets/logos/747-logo.png" 
        alt="747 Casino" 
        className="h-10 w-auto object-contain relative z-10 drop-shadow-xl"
        style={{filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.4))'}}
      />
    </div>
  );

  return (
    <header className={`
      sticky top-0 z-50 w-full
      ${transparent ? 'bg-[#00174F]/80' : 'bg-[#00174F]/95'} 
      backdrop-blur-md
      px-4 py-3 
      transition-all duration-300
      ${customClassName}
    `}>
      <div className="flex items-center justify-between">
        {/* Left - Logo */}
        <Logo />
        
        {/* Center - Title */}
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
          <h1 className="text-xl font-semibold text-white">{title}</h1>
        </div>
        
        {/* Right - Logout Button */}
        {showLogout && (
          <button 
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200 flex items-center with-ripple"
          >
            <LogOut size={20} className="text-white/90" />
          </button>
        )}
      </div>
    </header>
  );
};

export default MobileHeader;