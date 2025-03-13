import { CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SuccessNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  newBalance: string | number;
  transactionId: string;
}

const SuccessNotificationModal = ({ 
  isOpen, 
  onClose, 
  amount, 
  newBalance,
  transactionId 
}: SuccessNotificationModalProps) => {
  const [, navigate] = useLocation();
  
  if (!isOpen) return null;
  
  const handleContinueToCasino = () => {
    // This would navigate to the casino page or open the casino in a new window
    window.open("https://747casino.com", "_blank");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-primary w-full max-w-md mx-4 rounded-xl overflow-hidden shadow-2xl border border-secondary/30">
        <div className="p-5">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto bg-accent/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="text-accent text-3xl h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-white">Payment Successful!</h3>
            <p className="text-gray-300 mt-2">Your balance has been updated successfully.</p>
          </div>
          
          <div className="bg-dark/30 rounded-lg p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-300">Amount Added:</span>
              <span className="text-white font-bold">{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-300">Transaction ID:</span>
              <span className="text-white">{transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">New Balance:</span>
              <span className="text-white font-bold">{formatCurrency(newBalance)}</span>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button 
              variant="outline"
              className="flex-1 bg-dark hover:bg-dark/70 text-white py-3 rounded-lg"
              onClick={() => { navigate("/history"); onClose(); }}
            >
              View Receipt
            </Button>
            <Button 
              className="flex-1 bg-secondary hover:bg-secondary/90 text-white font-medium py-3 rounded-lg"
              onClick={handleContinueToCasino}
            >
              Continue to Casino
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessNotificationModal;
