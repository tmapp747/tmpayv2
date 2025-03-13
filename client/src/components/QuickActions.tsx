import { QUICK_ACTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { QrCode, CreditCard, Coins, ArrowRightLeft, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

const QuickActions = () => {
  const [, navigate] = useLocation();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'qrcode':
        return <QrCode className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />;
      case 'credit-card':
        return <CreditCard className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />;
      case 'coins':
        return <Coins className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />;
      case 'exchange-alt':
        return <ArrowRightLeft className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />;
      case 'trending-up':
        return <TrendingUp className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />;
      default:
        return null;
    }
  };

  const handleActionClick = (id: string) => {
    if (id === 'deposit') {
      navigate('/wallet');
    } else if (id === 'transfer') {
      navigate('/wallet?tab=transfer');
    } else if (id === 'history') {
      navigate('/history');
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 max-w-full overflow-hidden">
      {QUICK_ACTIONS.map((action, index) => (
        <Button
          key={action.id}
          variant="outline"
          className={cn(
            "group bg-gradient-to-br from-primary to-dark p-5 rounded-xl flex flex-col items-center justify-center",
            "border border-secondary/20 shadow-md hover:shadow-lg hover:shadow-secondary/10 h-auto",
            "transition-all duration-300 transform hover:-translate-y-1 hover:border-secondary/40 relative overflow-hidden",
            "animate-slideUp"
          )}
          style={{ animationDelay: `${index * 0.1}s` }}
          onClick={() => handleActionClick(action.id)}
        >
          {/* Card background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Glowing dot indicator */}
          <div className={`absolute top-2 right-2 w-2 h-2 rounded-full opacity-70 animate-pulse ${
            action.color === 'green' ? 'bg-green-400' : 
            action.color === 'blue' ? 'bg-blue-400' : 
            action.color === 'purple' ? 'bg-purple-400' : 
            action.color === 'yellow' ? 'bg-yellow-400' : 
            'bg-secondary'
          }`}></div>
          
          {/* Icon container */}
          <div className={`w-14 h-14 flex items-center justify-center rounded-full 
            bg-gradient-to-br mb-3 shadow-inner animate-float transition-all duration-300 ${
            action.color === 'green' ? 'from-green-500/20 to-green-500/5 text-green-400 group-hover:from-green-500/30 group-hover:to-green-500/10' : 
            action.color === 'blue' ? 'from-blue-500/20 to-blue-500/5 text-blue-400 group-hover:from-blue-500/30 group-hover:to-blue-500/10' : 
            action.color === 'purple' ? 'from-purple-500/20 to-purple-500/5 text-purple-400 group-hover:from-purple-500/30 group-hover:to-purple-500/10' : 
            action.color === 'yellow' ? 'from-yellow-500/20 to-yellow-500/5 text-yellow-400 group-hover:from-yellow-500/30 group-hover:to-yellow-500/10' : 
            'from-secondary/20 to-secondary/5 text-secondary group-hover:from-secondary/30 group-hover:to-secondary/10'
          }`}>
            {getIcon(action.icon)}
          </div>
          
          {/* Title and description */}
          <div className="text-center">
            <span className="text-sm text-white font-medium tracking-wide group-hover:text-secondary transition-colors duration-300 block">
              {action.name}
            </span>
            <span className="text-xs text-gray-400 mt-1 block opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {action.description}
            </span>
          </div>
          
          {/* Bottom indicator line */}
          <div className={`absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${
            action.color === 'green' ? 'bg-green-500/50' : 
            action.color === 'blue' ? 'bg-blue-500/50' : 
            action.color === 'purple' ? 'bg-purple-500/50' : 
            action.color === 'yellow' ? 'bg-yellow-500/50' : 
            'bg-secondary/50'
          }`}></div>
        </Button>
      ))}
    </div>
  );
};

export default QuickActions;
