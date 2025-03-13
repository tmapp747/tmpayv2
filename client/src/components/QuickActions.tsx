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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {QUICK_ACTIONS.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          className={cn(
            "group bg-gradient-to-br from-primary to-dark p-5 rounded-xl flex flex-col items-center justify-center",
            "border border-secondary/20 shadow-md hover:shadow-lg hover:shadow-secondary/10 h-auto",
            "transition-all duration-300 transform hover:-translate-y-1 hover:border-secondary/40 relative overflow-hidden"
          )}
          onClick={() => handleActionClick(action.id)}
        >
          {/* Animated background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Glowing dot in the corner */}
          <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-${action.color}-400 opacity-70 animate-pulse`}></div>
          
          <div className={`w-14 h-14 flex items-center justify-center rounded-full 
            bg-gradient-to-br from-${action.color}-500/20 to-${action.color}-500/5 
            text-${action.color}-500 mb-3 
            group-hover:from-${action.color}-500/30 group-hover:to-${action.color}-500/10 
            transition-all duration-300 shadow-inner`}>
            {getIcon(action.icon)}
          </div>
          
          <span className="text-sm text-white font-medium tracking-wide group-hover:text-secondary transition-colors duration-300">
            {action.name}
          </span>
        </Button>
      ))}
    </div>
  );
};

export default QuickActions;
