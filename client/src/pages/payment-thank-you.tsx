import { useEffect, useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { CheckCircle2, ArrowRight, RefreshCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

interface PaymentStatusResponse {
  success: boolean;
  status: "pending" | "completed" | "failed" | "expired";
  message?: string;
  qrPayment?: any;
}

export default function PaymentThankYou() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/payment/thank-you");
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"pending" | "completed" | "failed" | "expired">("pending");
  const [pollingCount, setPollingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Parse query parameters
  const queryParams = new URLSearchParams(window.location.search);
  const reference = queryParams.get("reference");
  const amount = queryParams.get("amount") ? parseFloat(queryParams.get("amount")!) : 0;
  const username = queryParams.get("username");

  // Maximum number of polling attempts (10 attempts * 3s = 30s max polling time)
  const MAX_POLLING = 10;

  useEffect(() => {
    // If no reference, redirect to wallet
    if (!reference) {
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

        const response = await apiRequest("GET", `/api/payments/status/${reference}`);
        const data: PaymentStatusResponse = await response.json();

        if (data.status === "completed") {
          setStatus("completed");
          setLoading(false);
        } else if (data.status === "failed") {
          setStatus("failed");
          setLoading(false);
          setError(data.message || "Payment processing failed");
        } else if (data.status === "expired") {
          setStatus("expired");
          setLoading(false);
          setError("Your payment session has expired");
        } else {
          // Still pending, continue polling
          setPollingCount(prev => prev + 1);
          setTimeout(checkPaymentStatus, 3000); // Check every 3 seconds
        }
      } catch (err) {
        console.error("Error checking payment status:", err);
        setError("Unable to verify payment status");
        setLoading(false);
      }
    };

    // Start checking payment status
    checkPaymentStatus();
  }, [reference, pollingCount, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background/70 to-background">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">
            {loading && "Processing Payment"}
            {status === "completed" && "Payment Successful"}
            {status === "failed" && "Payment Failed"}
            {status === "expired" && "Payment Expired"}
          </CardTitle>
          <CardDescription>
            {loading && "We're verifying your payment with DirectPay..."}
            {status === "completed" && "Your account has been credited successfully!"}
            {status === "failed" && error}
            {status === "expired" && "Your payment session has expired"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center">
              <RefreshCcw className="h-16 w-16 text-primary animate-spin" />
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Verifying payment of {formatCurrency(amount)}...
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Reference: {reference}
              </p>
            </div>
          ) : status === "completed" ? (
            <div className="flex flex-col items-center justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h3 className="text-lg font-semibold mt-4">Thank You!</h3>
              <p className="text-center text-sm text-muted-foreground mt-1">
                {formatCurrency(amount)} has been added to your account.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Reference: {reference}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <AlertTriangle className="h-16 w-16 text-amber-500" />
              <h3 className="text-lg font-semibold mt-4">
                {status === "failed" ? "Payment Failed" : "Payment Expired"}
              </h3>
              <p className="text-center text-sm text-muted-foreground mt-1">
                {error || "There was an issue with your payment"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Reference: {reference}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center gap-4 pb-6">
          <Button asChild variant="outline">
            <Link href="/wallet">
              <ArrowRight className="mr-2 h-4 w-4" />
              Back to Wallet
            </Link>
          </Button>
          {(status === "failed" || status === "expired") && (
            <Button asChild>
              <Link href="/wallet">
                Try Again
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}