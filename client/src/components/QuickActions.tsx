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
            "border-2 border-secondary/20 h-auto relative overflow-hidden",
            "transition-all duration-300 transform hover:-translate-y-1 hover:border-secondary/40",
            "animate-slideUp"
          )}
          style={{ 
            animationDelay: `${index * 0.1}s`,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 5px 10px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
            transform: 'translateZ(0)'
          }}
          onClick={() => handleActionClick(action.id)}
        >
          {/* Card background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Enhanced 3D layer */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-white/5 opacity-30"></div>
          
          {/* Glowing dot indicator with enhanced 3D effect */}
          <div 
            className={`absolute top-2 right-2 w-2 h-2 rounded-full opacity-80 animate-pulse ${
              action.color === 'green' ? 'bg-green-400' : 
              action.color === 'blue' ? 'bg-blue-400' : 
              action.color === 'purple' ? 'bg-purple-400' : 
              action.color === 'yellow' ? 'bg-yellow-400' : 
              'bg-secondary'
            }`}
            style={{
              boxShadow: `0 0 8px ${
                action.color === 'green' ? 'rgba(74, 222, 128, 0.5)' : 
                action.color === 'blue' ? 'rgba(96, 165, 250, 0.5)' : 
                action.color === 'purple' ? 'rgba(192, 132, 252, 0.5)' : 
                action.color === 'yellow' ? 'rgba(250, 204, 21, 0.5)' : 
                'rgba(183, 134, 40, 0.5)'
              }`
            }}
          ></div>
          
          {/* Enhanced 3D Icon container */}
          <div 
            className={`w-14 h-14 flex items-center justify-center rounded-full 
              mb-3 animate-float transition-all duration-300 relative ${
              action.color === 'green' ? 'from-green-500/20 to-green-500/5 text-green-400 group-hover:text-green-300' : 
              action.color === 'blue' ? 'from-blue-500/20 to-blue-500/5 text-blue-400 group-hover:text-blue-300' : 
              action.color === 'purple' ? 'from-purple-500/20 to-purple-500/5 text-purple-400 group-hover:text-purple-300' : 
              action.color === 'yellow' ? 'from-yellow-500/20 to-yellow-500/5 text-yellow-400 group-hover:text-yellow-300' : 
              'from-secondary/20 to-secondary/5 text-secondary group-hover:text-secondary/80'
            }`}
            style={{
              background: `radial-gradient(circle, ${
                action.color === 'green' ? 'rgba(74, 222, 128, 0.2)' : 
                action.color === 'blue' ? 'rgba(96, 165, 250, 0.2)' : 
                action.color === 'purple' ? 'rgba(192, 132, 252, 0.2)' : 
                action.color === 'yellow' ? 'rgba(250, 204, 21, 0.2)' : 
                'rgba(183, 134, 40, 0.2)'
              } 0%, transparent 70%)`,
              boxShadow: `0 10px 15px rgba(0, 0, 0, 0.1), inset 0 1px 1px ${
                action.color === 'green' ? 'rgba(74, 222, 128, 0.2)' : 
                action.color === 'blue' ? 'rgba(96, 165, 250, 0.2)' : 
                action.color === 'purple' ? 'rgba(192, 132, 252, 0.2)' : 
                action.color === 'yellow' ? 'rgba(250, 204, 21, 0.2)' : 
                'rgba(183, 134, 40, 0.2)'
              }, 0 0 15px ${
                action.color === 'green' ? 'rgba(74, 222, 128, 0.3)' : 
                action.color === 'blue' ? 'rgba(96, 165, 250, 0.3)' : 
                action.color === 'purple' ? 'rgba(192, 132, 252, 0.3)' : 
                action.color === 'yellow' ? 'rgba(250, 204, 21, 0.3)' : 
                'rgba(183, 134, 40, 0.3)'
              }`,
              transform: 'translateZ(20px)'
            }}
          >
            <div style={{
              filter: `drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))`
            }}>
              {getIcon(action.icon)}
            </div>
          </div>
          
          {/* Title and description with enhanced 3D text */}
          <div className="text-center">
            <span 
              className="text-sm text-white font-medium tracking-wide group-hover:text-secondary transition-colors duration-300 block"
              style={{textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'}}
            >
              {action.name}
            </span>
            <span 
              className="text-xs text-gray-400 mt-1 block opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
              }}
            >
              {action.description}
            </span>
          </div>
          
          {/* Enhanced 3D Bottom indicator line */}
          <div 
            className={`absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${
              action.color === 'green' ? 'bg-green-500/50' : 
              action.color === 'blue' ? 'bg-blue-500/50' : 
              action.color === 'purple' ? 'bg-purple-500/50' : 
              action.color === 'yellow' ? 'bg-yellow-500/50' : 
              'bg-secondary/50'
            }`}
            style={{
              boxShadow: `0 0 10px ${
                action.color === 'green' ? 'rgba(74, 222, 128, 0.5)' : 
                action.color === 'blue' ? 'rgba(96, 165, 250, 0.5)' : 
                action.color === 'purple' ? 'rgba(192, 132, 252, 0.5)' : 
                action.color === 'yellow' ? 'rgba(250, 204, 21, 0.5)' : 
                'rgba(183, 134, 40, 0.5)'
              }`
            }}
          ></div>
        </Button>
      ))}
    </div>
  );
};

export default QuickActions;
