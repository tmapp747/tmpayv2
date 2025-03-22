import React, { useEffect, useState } from 'react';
import { useLocation, useRoute, useRouter } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

/**
 * Payment Status component that handles the redirect from GCash payment
 * 
 * This component:
 * 1. Reads the tx_id (reference ID) from the URL query string
 * 2. Polls the backend to check transaction status
 * 3. Displays appropriate UI based on status (success, pending, failed)
 * 4. Routes to thank you page on success
 */
export default function MobilePaymentStatus() {
  const [location] = useLocation();
  const router = useRouter();
  const { toast } = useToast();
  
  // Extract transaction reference from URL
  const params = new URLSearchParams(location.split('?')[1]);
  const txId = params.get('tx_id');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [transaction, setTransaction] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isPolling, setIsPolling] = useState(true);
  
  // Set max retries (10 retries × 3 seconds = 30 second max polling time)
  const MAX_RETRIES = 10;
  
  useEffect(() => {
    if (!txId) {
      toast({
        title: "Error",
        description: "No transaction ID found",
        variant: "destructive"
      });
      router('/deposit');
      return;
    }
    
    const checkStatus = async () => {
      try {
        const response = await apiRequest(`/api/payments/check-transaction-status?tx_id=${txId}`, {
          method: 'GET'
        });
        
        if (response.success) {
          setTransaction(response.transaction);
          
          // Handle different transaction statuses
          if (response.transaction.status === 'completed' || 
              response.transaction.status === 'payment_completed' ||
              (response.transaction.metadata?.gcashStatus === 'completed' || 
               response.transaction.metadata?.gcashStatus === 'success')) {
            setStatus('success');
            setIsPolling(false);
            // Redirect to thank you page after a short delay
            setTimeout(() => {
              router(`/thank-you?tx_id=${txId}`);
            }, 1500);
          } else if (response.transaction.status === 'failed' || 
                    response.transaction.status === 'expired' ||
                    (response.transaction.metadata?.gcashStatus === 'failed' || 
                     response.transaction.metadata?.gcashStatus === 'expired')) {
            setStatus('failed');
            setIsPolling(false);
          } else {
            // Still pending - keep polling if under max retries
            setStatus('pending');
            
            if (retryCount < MAX_RETRIES && isPolling) {
              setRetryCount(prev => prev + 1);
              setTimeout(checkStatus, 3000); // Poll every 3 seconds
            } else {
              // Stop polling after max retries, but keep showing pending
              setIsPolling(false);
            }
          }
        } else {
          setStatus('failed');
          setIsPolling(false);
          toast({
            title: "Error checking payment",
            description: response.message || "Failed to check payment status",
            variant: "destructive"
          });
        }
      } catch (err) {
        console.error("Error checking payment status:", err);
        setStatus('failed');
        setIsPolling(false);
        
        toast({
          title: "Error",
          description: "Failed to check payment status. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    checkStatus();
    
    // Cleanup
    return () => {
      setIsPolling(false);
    };
  }, [txId, router, toast]);
  
  const handleManualRefresh = () => {
    setStatus('loading');
    setIsPolling(true);
    setRetryCount(0);
  };
  
  const handleGoToDashboard = () => {
    router('/');
  };
  
  const handleTryAnotherDeposit = () => {
    router('/deposit');
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-4 h-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl text-center">
            {status === 'loading' && 'Checking Payment Status...'}
            {status === 'pending' && 'Payment Processing...'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'failed' && 'Payment Failed'}
          </CardTitle>
          <CardDescription className="text-center">
            {status === 'loading' && 'Please wait while we verify your payment'}
            {status === 'pending' && 'Your payment is being processed by GCash'}
            {status === 'success' && 'Your deposit was completed successfully'}
            {status === 'failed' && 'We couldn\'t complete your payment'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center justify-center py-6">
          {status === 'loading' && (
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
          )}
          
          {status === 'pending' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <p className="text-sm text-center text-muted-foreground">
                This may take a moment. Please don't close this page.
              </p>
              {!isPolling && (
                <div className="mt-4">
                  <Button onClick={handleManualRefresh} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Status
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <div className="text-center">
                <p className="font-medium">Reference: {txId}</p>
                {transaction && (
                  <p className="text-lg font-bold mt-2">
                    Amount: ₱{parseFloat(transaction.amount).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {status === 'failed' && (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="w-16 h-16 text-red-500" />
              <p className="text-sm text-center">
                {transaction?.metadata?.gcashError || 
                 "Your payment could not be completed. Please try again or use a different payment method."}
              </p>
              <div className="text-center mt-2">
                <p className="font-medium">Reference: {txId}</p>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col gap-2">
          {status === 'success' && (
            <Button onClick={handleGoToDashboard} className="w-full" size="lg">
              Go to Dashboard
            </Button>
          )}
          
          {status === 'failed' && (
            <>
              <Button onClick={handleTryAnotherDeposit} className="w-full" size="lg">
                Try Again
              </Button>
              <Button onClick={handleGoToDashboard} variant="outline" className="w-full" size="lg">
                Go to Dashboard
              </Button>
            </>
          )}
          
          {(status === 'loading' || status === 'pending') && !isPolling && (
            <Button onClick={handleGoToDashboard} variant="outline" className="w-full" size="lg">
              Go to Dashboard
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}