import { useEffect } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, ExternalLink, Users, CreditCard, BarChart3, ArrowUpRight, MessageCircle, Wallet, ShieldCheck, HelpCircle } from 'lucide-react';

/**
 * Portal selector page that presents important URLs with a clean, mobile-friendly UI
 */
export default function PortalSelector() {
  const { user, logout } = useAuth();

  useEffect(() => {
    // Set page title
    document.title = '747 Important Links';
    
    // Apply mobile-specific enhancements
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    // Set initial viewport height and update on resize
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    
    return () => {
      window.removeEventListener('resize', setViewportHeight);
    };
  }, []);
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Portal Links Data
  const portalLinks = [
    {
      title: "747 Player Portal",
      description: "Access your player account",
      domain: "747ph.live",
      url: "https://747ph.live",
      icon: <Users className="h-6 w-6" />,
      color: "blue"
    },
    {
      title: "Agent Portal",
      description: "Agent operations dashboard",
      domain: "agents.747ph.live",
      url: "https://agents.747ph.live",
      icon: <ShieldCheck className="h-6 w-6" />,
      color: "amber"
    },
    {
      title: "Casino Platform",
      description: "Play games and place bets",
      domain: "747.live",
      url: "https://747.live",
      icon: <CreditCard className="h-6 w-6" />,
      color: "emerald"
    },
    {
      title: "Deposit Portal",
      description: "Make deposits to your account",
      domain: "deposit.747ph.live",
      url: "/mobile/deposit",
      icon: <ArrowUpRight className="h-6 w-6" />,
      color: "green",
      internal: true
    },
    {
      title: "Transaction History",
      description: "View your payment history",
      domain: "history.747ph.live",
      url: "/mobile/history",
      icon: <BarChart3 className="h-6 w-6" />,
      color: "violet",
      internal: true
    },
    {
      title: "Wallet",
      description: "Manage your balance and payments",
      domain: "wallet.747ph.live",
      url: "/mobile/wallet",
      icon: <Wallet className="h-6 w-6" />,
      color: "indigo",
      internal: true
    },
    {
      title: "Support Center",
      description: "Get help and support",
      domain: "support.747ph.live",
      url: "https://support.747ph.live",
      icon: <HelpCircle className="h-6 w-6" />,
      color: "rose"
    },
    {
      title: "Chat Support",
      description: "Live chat with our support team",
      domain: "chat.747ph.live",
      url: "https://chat.747ph.live",
      icon: <MessageCircle className="h-6 w-6" />,
      color: "purple"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001138] to-[#002D87] flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#00174F]/95 backdrop-blur-md py-3">
        <div className="container flex items-center justify-between mx-4">
          {/* Logo */}
          <div className="relative flex items-center justify-center h-10 w-auto">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-300/40 to-amber-500/30 blur-xl transform scale-[1.4] animate-pulse-slow opacity-70"></div>
            <div className="absolute inset-0 rounded-full bg-white/30 blur-lg transform scale-[1.2]"></div>
            <img 
              src="/assets/logos/747-logo.png" 
              alt="747 Casino" 
              className="h-10 w-auto object-contain relative z-10 drop-shadow-xl"
              style={{filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.4))'}}
            />
          </div>
          
          {/* Title */}
          <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
            <h1 className="text-xl font-semibold text-white">Important Links</h1>
          </div>
          
          {/* Logout Button */}
          {user && (
            <button 
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200 flex items-center"
            >
              <LogOut size={20} className="text-white/90" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-20 px-4 pb-6">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">747 Portal Links</h2>
            <p className="text-blue-100/80">Access all your important 747 services</p>
          </div>
          
          {/* Links Grid */}
          <div className="grid gap-3">
            {portalLinks.map((link, index) => (
              <LinkCard
                key={index}
                title={link.title}
                description={link.description}
                domain={link.domain}
                url={link.url}
                icon={link.icon}
                color={link.color}
                internal={link.internal}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-white/50 text-xs">
        <p>© {new Date().getFullYear()} 747 Casino. All rights reserved.</p>
      </footer>
    </div>
  );
}

// Link Card Component
interface LinkCardProps {
  title: string;
  description: string;
  domain: string;
  url: string;
  icon: React.ReactNode;
  color: string;
  internal?: boolean;
}

function LinkCard({ title, description, domain, url, icon, color, internal = false }: LinkCardProps) {
  const colors: Record<string, string> = {
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    amber: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
    green: "from-green-500/20 to-green-600/10 border-green-500/30",
    violet: "from-violet-500/20 to-violet-600/10 border-violet-500/30", 
    indigo: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    rose: "from-rose-500/20 to-rose-600/10 border-rose-500/30"
  };

  const linkContent = (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      className={`bg-gradient-to-br ${colors[color]} backdrop-blur-md rounded-xl p-4 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors relative overflow-hidden`}
    >
      <div className="flex items-center">
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mr-4 backdrop-filter backdrop-blur-sm">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-sm text-blue-100/70">{description}</p>
          <div className="mt-1 text-xs text-blue-300">{domain}</div>
        </div>
        <ExternalLink size={18} className="text-white/50 ml-2" />
      </div>
    </motion.div>
  );

  return internal ? (
    <Link href={url}>
      {linkContent}
    </Link>
  ) : (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {linkContent}
    </a>
  );
}