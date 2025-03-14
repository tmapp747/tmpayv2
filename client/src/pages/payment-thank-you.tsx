import { useEffect, useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { 
  CheckCircle2, 
  ArrowRight, 
  RefreshCcw, 
  AlertTriangle, 
  Clock,
  ChevronLeft 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface PaymentStatusResponse {
  success: boolean;
  status: "pending" | "completed" | "failed" | "expired";
  message?: string;
  qrPayment?: {
    id: number;
    amount: string | number;
    expiresAt: string;
    createdAt: string;
    directPayReference: string;
    status: string;
  };
}

export default function PaymentThankYou() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/payment/thank-you");
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "completed" | "failed" | "expired">("pending");
  const [pollingCount, setPollingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentStatusResponse["qrPayment"] | null>(null);

  // Parse query parameters
  const queryParams = new URLSearchParams(window.location.search);
  const reference = queryParams.get("reference");
  const amount = queryParams.get("amount") ? parseFloat(queryParams.get("amount")!) : 0;
  const username = queryParams.get("username");

  // Maximum number of polling attempts (15 attempts * 3s = 45s max polling time)
  // We'll show a message after this time to inform the user the status is still being checked
  const MAX_POLLING = 15;

  useEffect(() => {
    // If no reference, redirect to wallet
    if (!reference) {
      toast({
        title: "Error",
        description: "No payment reference found. Redirecting to wallet.",
        variant: "destructive",
      });
      setLocation("/wallet");
      return;
    }

    // Function to check payment status
    const checkPaymentStatus = async () => {
      try {
        if (pollingCount >= MAX_POLLING) {
          // Stop polling after MAX_POLLING attempts, but don't mark as failed
          // The payment might still complete after we stop checking
          setLoading(false);
          return;
        }

        // Get user token from localStorage
        const userData = localStorage.getItem('userData');
        let token = '';
        
        if (userData) {
          try {
            const parsedUserData = JSON.parse(userData);
            if (parsedUserData?.user?.accessToken) {
              token = parsedUserData.user.accessToken;
            }
          } catch (e) {
            console.error("Error parsing userData:", e);
          }
        }

        // Make authenticated request
        const response = await fetch(`/api/payments/status/${reference}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Error checking payment: ${response.status}`);
        }

        const data = await response.json() as PaymentStatusResponse;
        
        // Store payment details if available
        if (data.qrPayment) {
          setPaymentDetails(data.qrPayment);
        }

        if (data.status === "completed") {
          setPaymentStatus("completed");
          setLoading(false);
          // Show success toast
          toast({
            title: "Payment Successful",
            description: `Your payment of ${formatCurrency(amount)} has been received.`,
          });
        } else if (data.status === "failed") {
          setPaymentStatus("failed");
          setLoading(false);
          setError(data.message || "Payment processing failed");
          // Show error toast
          toast({
            title: "Payment Failed",
            description: data.message || "Payment processing failed",
            variant: "destructive",
          });
        } else if (data.status === "expired") {
          setPaymentStatus("expired");
          setLoading(false);
          setError("Your payment session has expired");
          // Show warning toast
          toast({
            title: "Payment Expired",
            description: "Your payment session has expired",
            variant: "destructive",
          });
        } else {
          // Still pending, continue polling
          setPollingCount(prev => prev + 1);
          setTimeout(checkPaymentStatus, 3000); // Check every 3 seconds
        }
      } catch (err) {
        console.error("Error checking payment status:", err);
        setError("Unable to verify payment status");
        setLoading(false);
        // Show error toast
        toast({
          title: "Error",
          description: "Unable to verify payment status",
          variant: "destructive",
        });
      }
    };

    // Start checking payment status
    checkPaymentStatus();
  }, [reference, pollingCount, setLocation, toast, amount]);

  // Helper function to determine the status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Expired</Badge>;
      default:
        return <Badge variant="secondary" className="animate-pulse">Processing</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary/10 to-background">
      <div className="w-full max-w-md">
        {/* Top navigation button */}
        <div className="mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-sm" 
            asChild
          >
            <Link href="/wallet">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Wallet
            </Link>
          </Button>
        </div>
        
        <Card className="w-full shadow-lg border-secondary/20">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              {getStatusBadge(loading ? 'pending' : paymentStatus)}
            </div>
            <CardTitle className="text-2xl">
              {loading && "Processing Payment"}
              {paymentStatus === "completed" && "Payment Successful"}
              {paymentStatus === "failed" && "Payment Failed"}
              {paymentStatus === "expired" && "Payment Expired"}
            </CardTitle>
            <CardDescription>
              {loading && "We're verifying your payment with DirectPay..."}
              {paymentStatus === "completed" && "Your account has been credited successfully!"}
              {paymentStatus === "failed" && error}
              {paymentStatus === "expired" && "Your payment session has expired"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center">
                <RefreshCcw className="h-16 w-16 text-primary animate-spin" />
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Verifying payment of {formatCurrency(amount)}...
                </p>
                
                {pollingCount >= MAX_POLLING && (
                  <p className="text-center text-xs text-muted-foreground mt-3 max-w-xs">
                    <Clock className="h-3 w-3 inline mr-1" />
                    This is taking longer than expected. Your payment may still be processing.
                  </p>
                )}
              </div>
            ) : paymentStatus === "completed" ? (
              <div className="flex flex-col items-center justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <h3 className="text-lg font-semibold mt-4">Thank You!</h3>
                <p className="text-center text-sm text-muted-foreground mt-1">
                  {formatCurrency(amount)} has been added to your account.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <AlertTriangle className="h-16 w-16 text-amber-500" />
                <h3 className="text-lg font-semibold mt-4">
                  {paymentStatus === "failed" ? "Payment Failed" : "Payment Expired"}
                </h3>
                <p className="text-center text-sm text-muted-foreground mt-1">
                  {error || "There was an issue with your payment"}
                </p>
              </div>
            )}
            
            {/* Payment details section - always show, regardless of status */}
            <div className="w-full mt-6 pt-4">
              <Separator className="mb-4" />
              <h4 className="text-sm font-medium mb-2">Payment Details</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="font-mono text-xs bg-muted py-1 px-2 rounded">
                    {reference}
                  </span>
                </div>
                
                {paymentDetails?.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{formatDate(new Date(paymentDetails.createdAt))}</span>
                  </div>
                )}
                
                {username && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Username:</span>
                    <span>{username}</span>
                  </div>
                )}
                
                {paymentDetails?.expiresAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires:</span>
                    <span>{formatDate(new Date(paymentDetails.expiresAt))}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center gap-4 pb-6">
            <Button asChild variant="outline">
              <Link href="/wallet">
                <ArrowRight className="mr-2 h-4 w-4" />
                Back to Wallet
              </Link>
            </Button>
            {(paymentStatus === "failed" || paymentStatus === "expired") && (
              <Button asChild>
                <Link href="/wallet">
                  Try Again
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}