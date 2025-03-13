import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, getTimeRemaining } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { QrPayment, Transaction, GenerateQrCodeRequest } from "@/lib/types";
import { Loader2, QrCode, RefreshCw, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// QR Code Deposit component
export default function QRDeposit({ amount }: { amount: number }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [qrPayment, setQrPayment] = useState<QrPayment | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [progress, setProgress] = useState<number>(100);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "completed" | "failed" | "expired">("pending");
  const [isPolling, setIsPolling] = useState<boolean>(false);
  
  // Generate QR code mutation
  const generateQrMutation = useMutation({
    mutationFn: async (data: GenerateQrCodeRequest) => {
      const response = await apiRequest("POST", "/api/payments/gcash/generate-qr", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setQrPayment(data.qrPayment);
        setTransaction(data.transaction);
        setPaymentStatus(data.qrPayment.status);
        
        // Set expiry date
        if (data.qrPayment.expiresAt) {
          const expiry = new Date(data.qrPayment.expiresAt);
          setExpiryDate(expiry);
        }
        
        // Start polling for payment status
        setIsPolling(true);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to generate QR code",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate QR code",
        variant: "destructive",
      });
    },
  });
  
  // Check payment status function
  const checkPaymentStatus = async () => {
    if (!qrPayment?.id) return;
    
    try {
      const response = await fetch(`/api/payments/status/${qrPayment.directPayReference || qrPayment.id}`);
      const data = await response.json();
      
      if (data.success) {
        setPaymentStatus(data.status);
        
        // If payment is completed, stop polling and refresh user data
        if (data.status === "completed") {
          setIsPolling(false);
          queryClient.invalidateQueries({ queryKey: ["/api/user/info"] });
          queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
          
          toast({
            title: "Payment Successful",
            description: `₱${formatCurrency(amount)} has been added to your account`,
          });
        } else if (data.status === "failed" || data.status === "expired") {
          setIsPolling(false);
          toast({
            title: "Payment Failed",
            description: "Your payment could not be processed",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    }
  };
  
  // Generate QR code
  const generateQrCode = () => {
    if (!user) return;
    generateQrMutation.mutate({ amount });
  };
  
  // Handle expiry time calculation and progress bar
  useEffect(() => {
    if (!expiryDate) return;
    
    const updateTimeLeft = () => {
      const now = new Date();
      const timeDifference = expiryDate.getTime() - now.getTime();
      
      if (timeDifference <= 0) {
        setTimeLeft("Expired");
        setProgress(0);
        setPaymentStatus("expired");
        setIsPolling(false);
        return;
      }
      
      // Calculate time left
      const timeLeftString = getTimeRemaining(expiryDate);
      setTimeLeft(timeLeftString);
      
      // Calculate progress (assuming 15 minutes expiry time)
      const totalDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
      const progressValue = Math.max(0, Math.min(100, (timeDifference / totalDuration) * 100));
      setProgress(progressValue);
    };
    
    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    
    return () => clearInterval(interval);
  }, [expiryDate]);
  
  // Poll for payment status
  useEffect(() => {
    if (!isPolling) return;
    
    const poll = setInterval(checkPaymentStatus, 5000);
    
    return () => clearInterval(poll);
  }, [isPolling, qrPayment]);
  
  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <QrCode className="mr-2 h-5 w-5" />
          DirectPay GCash QR Deposit
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {!qrPayment ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <p className="text-center text-muted-foreground">
              Generate a QR code to make a GCash payment of ₱{formatCurrency(amount)}
            </p>
            <Button 
              onClick={generateQrCode} 
              disabled={generateQrMutation.isPending}
              className="w-full max-w-xs"
            >
              {generateQrMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate QR Code"
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-6 py-4">
            {paymentStatus === "pending" && (
              <>
                <div className="relative">
                  <img 
                    src={qrPayment.qrCodeData} 
                    alt="GCash QR Code" 
                    className="w-56 h-56 object-contain border rounded-lg shadow-sm" 
                  />
                  <div className="absolute bottom-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                    ₱{formatCurrency(amount)}
                  </div>
                </div>
                
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Time Remaining</span>
                    <span className="font-medium flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {timeLeft}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                <div className="space-y-2 text-sm text-center w-full">
                  <p>Scan the QR code with your GCash app</p>
                  <p className="text-muted-foreground">Payment will be automatically detected</p>
                </div>
                
                <div className="mt-4 flex justify-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={checkPaymentStatus}
                    disabled={isPolling}
                  >
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Refresh Status
                  </Button>
                </div>
              </>
            )}
            
            {paymentStatus === "completed" && (
              <div className="flex flex-col items-center space-y-4 py-8">
                <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <svg
                    className="h-10 w-10 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Payment Successful!</h3>
                <p className="text-center text-muted-foreground">
                  Your payment of ₱{formatCurrency(amount)} has been processed successfully and added to your account.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setQrPayment(null)}
                >
                  Make Another Payment
                </Button>
              </div>
            )}
            
            {(paymentStatus === "failed" || paymentStatus === "expired") && (
              <div className="flex flex-col items-center space-y-4 py-8">
                <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <svg
                    className="h-10 w-10 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">
                  Payment {paymentStatus === "expired" ? "Expired" : "Failed"}
                </h3>
                <p className="text-center text-muted-foreground">
                  {paymentStatus === "expired" 
                    ? "Your payment session has expired. Please try again."
                    : "There was an issue processing your payment. Please try again or use a different payment method."}
                </p>
                <Button onClick={() => setQrPayment(null)}>Try Again</Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="bg-muted/50 text-sm text-muted-foreground border-t flex justify-center">
        <p>DirectPay powered secure payment</p>
      </CardFooter>
    </Card>
  );
}