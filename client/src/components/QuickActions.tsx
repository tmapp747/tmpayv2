import { QUICK_ACTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { QrCode, CreditCard, Coins, ArrowRightLeft } from "lucide-react";

const QuickActions = () => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'qrcode':
        return <QrCode className="h-6 w-6" />;
      case 'credit-card':
        return <CreditCard className="h-6 w-6" />;
      case 'coins':
        return <Coins className="h-6 w-6" />;
      case 'exchange-alt':
        return <ArrowRightLeft className="h-6 w-6" />;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {QUICK_ACTIONS.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          className={cn(
            "bg-primary hover:bg-primary/80 p-4 rounded-xl flex flex-col items-center justify-center",
            "border border-secondary/20 shadow-sm h-auto"
          )}
        >
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-secondary/20 text-secondary mb-2">
            {getIcon(action.icon)}
          </div>
          <span className="text-xs text-white font-medium">{action.name}</span>
        </Button>
      ))}
    </div>
  );
};

export default QuickActions;
