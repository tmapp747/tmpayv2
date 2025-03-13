import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
  transactionId,
}: SuccessNotificationModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(transactionId);
    setCopied(true);
    
    toast({
      title: "Copied",
      description: "Transaction ID copied to clipboard",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transaction Successful</DialogTitle>
          <DialogDescription>
            Your transaction has been completed successfully
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center p-6 space-y-6">
          <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          
          <div className="text-center space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-2xl font-bold">₱{formatCurrency(amount)}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">New Balance</p>
              <p className="text-xl font-semibold">₱{formatCurrency(newBalance)}</p>
            </div>
            
            <div className="pt-2">
              <p className="text-sm text-muted-foreground mb-1">Transaction ID</p>
              <div className="flex items-center justify-center">
                <code className="bg-muted px-2 py-1 rounded text-sm mr-2 truncate max-w-[180px]">
                  {transactionId}
                </code>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={copyToClipboard}
                  className="h-6 w-6"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onClose}>
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessNotificationModal;