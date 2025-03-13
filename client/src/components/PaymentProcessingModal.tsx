import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PaymentProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  reference: string;
}

const PaymentProcessingModal = ({
  isOpen,
  onClose,
  amount,
  reference,
}: PaymentProcessingModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [status, setStatus] = useState<"processing" | "success" | "failed">("processing");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string>("");
  const [newBalance, setNewBalance] = useState<string | number>(0);
  const [isPolling, setIsPolling] = useState(true);
  
  // Check payment status
  const checkPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/payments/status/${reference}`);
      const data = await response.json();
      
      if (data.success) {
        if (data.status === "completed") {
          setStatus("success");
          setMessage("Your payment has been processed successfully!");
          setIsPolling(false);
          setNewBalance(data.newBalance || 0);
          
          // Refresh user data
          queryClient.invalidateQueries({ queryKey: ["/api/user/info"] });
          queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
          
          toast({
            title: "Payment Successful",
            description: `₱${formatCurrency(amount)} has been added to your account`,
          });
        } else if (data.status === "failed") {
          setStatus("failed");
          setMessage("Your payment could not be processed. Please try again.");
          setIsPolling(false);
          
          toast({
            title: "Payment Failed",
            description: "Your payment could not be processed",
            variant: "destructive",
          });
        } else if (data.status === "expired") {
          setStatus("failed");
          setMessage("Your payment session has expired. Please try again.");
          setIsPolling(false);
          
          toast({
            title: "Payment Expired",
            description: "Your payment session has expired",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    }
  };
  
  // Progress animation
  useEffect(() => {
    if (status !== "processing") return;
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [status]);
  
  // Polling for payment status
  useEffect(() => {
    if (!isPolling || !isOpen) return;
    
    const poll = setInterval(checkPaymentStatus, 5000);
    checkPaymentStatus(); // Check immediately
    
    return () => clearInterval(poll);
  }, [isPolling, isOpen, reference]);
  
  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setStatus("processing");
      setProgress(0);
      setMessage("");
      setIsPolling(true);
    }
  }, [isOpen]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {status === "processing" && "Processing Payment"}
            {status === "success" && "Payment Successful"}
            {status === "failed" && "Payment Failed"}
          </DialogTitle>
          <DialogDescription>
            {status === "processing" && "Please wait while we process your payment..."}
            {status === "success" && "Your payment has been processed successfully!"}
            {status === "failed" && message}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center p-6 space-y-6">
          {status === "processing" && (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <div className="w-full space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">Processing your payment of ₱{formatCurrency(amount)}</p>
              </div>
            </>
          )}
          
          {status === "success" && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Payment Complete</h3>
                <p className="text-sm text-muted-foreground">
                  ₱{formatCurrency(amount)} has been added to your account
                </p>
                <p className="text-sm font-medium">
                  New Balance: ₱{formatCurrency(newBalance)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Reference: {reference}
                </p>
              </div>
              <Button onClick={onClose} className="mt-4">
                Continue
              </Button>
            </>
          )}
          
          {status === "failed" && (
            <>
              <XCircle className="h-16 w-16 text-red-500" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Payment Failed</h3>
                <p className="text-sm text-muted-foreground">
                  {message || "There was an issue processing your payment"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Reference: {reference}
                </p>
              </div>
              <Button onClick={onClose} variant="outline" className="mt-4">
                Try Again
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentProcessingModal;