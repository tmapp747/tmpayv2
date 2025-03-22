import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRight,
  Check,
  Clock,
  X,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PaymentStatusProps {
  reference?: string;
  transactionId?: number;
}

interface TimelineItem {
  status: string;
  label: string;
  description: string;
  timestamp: string;
  completed: boolean;
  current: boolean;
}

const MobilePaymentStatus: React.FC<PaymentStatusProps> = ({ reference, transactionId }) => {
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Determine the reference to use for checking status
  const paymentReference = reference || new URLSearchParams(window.location.search).get('reference');
  const paymentTransactionId = transactionId || 
                              Number(new URLSearchParams(window.location.search).get('id')) || 
                              undefined;

  // Helper function to format a date
  const formatDate = (date: Date | string): string => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMM d, yyyy h:mm a');
  };

  // Get status badge style based on status
  const getStatusBadge = (status: string) => {
    if (['completed', 'payment_completed', 'success'].includes(status.toLowerCase())) {
      return (
        <Badge className="bg-green-600 hover:bg-green-700">
          <Check className="h-3 w-3 mr-1" /> Completed
        </Badge>
      );
    } else if (['processing', 'pending', 'pending_transfer'].includes(status.toLowerCase())) {
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600">
          <Clock className="h-3 w-3 mr-1" /> Processing
        </Badge>
      );
    } else if (['failed', 'error', 'cancelled', 'expired'].includes(status.toLowerCase())) {
      return (
        <Badge className="bg-red-600 hover:bg-red-700">
          <X className="h-3 w-3 mr-1" /> Failed
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" /> {status}
      </Badge>
    );
  };

  // Refresh transaction status
  const refreshStatus = async () => {
    if (!paymentReference && !paymentTransactionId) {
      setError('No payment reference or transaction ID found');
      setIsLoading(false);
      return;
    }

    setIsRefreshing(true);
    
    try {
      let response;
      
      if (paymentReference) {
        // Check status by reference
        response = await apiRequest(`/api/payments/gcash/check-status`, {
          method: 'POST',
          data: { reference: paymentReference }
        });
      } else if (paymentTransactionId) {
        // Check status by transaction ID
        response = await apiRequest(`/api/transactions/${paymentTransactionId}`);
      }

      if (response?.success && response.transaction) {
        setTransactionData(response.transaction);
        
        // Extract timeline data
        if (response.transaction.metadata?.timeline) {
          setTimeline(response.transaction.metadata.timeline);
        }
      } else {
        throw new Error(response?.message || 'Failed to fetch payment status');
      }
    } catch (err: any) {
      console.error('Error fetching payment status:', err);
      setError(err.message || 'Error fetching payment status');
      toast({
        title: 'Error',
        description: 'Failed to refresh payment status. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load of transaction status
  useEffect(() => {
    refreshStatus();
    
    // Set up polling interval for pending payments
    const intervalId = setInterval(() => {
      if (transactionData && ['pending', 'processing', 'pending_transfer'].includes(transactionData.status)) {
        refreshStatus();
      }
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [paymentReference, paymentTransactionId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Loading Payment Status</h3>
        <p className="text-muted-foreground text-center">
          We're retrieving the latest information about your payment...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold flex items-center text-center justify-center">
            <AlertCircle className="h-6 w-6 mr-2 text-red-500" />
            Error Loading Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-muted-foreground text-center mb-4">{error}</p>
          <Button onClick={refreshStatus} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/wallet">
              <ArrowRight className="mr-2 h-4 w-4" />
              Back to Wallet
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!transactionData) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold flex items-center text-center justify-center">
            <AlertCircle className="h-6 w-6 mr-2 text-yellow-500" />
            Payment Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-muted-foreground text-center mb-4">
            We couldn't find information about this payment. It may have been processed through another system.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/wallet">
              <ArrowRight className="mr-2 h-4 w-4" />
              Back to Wallet
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Extract GCash status from transaction metadata
  const gcashStatus = transactionData.metadata?.gcashStatus || 'processing';
  const casinoStatus = transactionData.metadata?.casinoStatus || 'pending';
  
  // Determine if GCash payment is completed
  const isGcashCompleted = gcashStatus === 'completed';
  
  // Determine if casino transfer is completed
  const isCasinoCompleted = casinoStatus === 'completed';
  
  // Determine overall completion status
  const isFullyCompleted = isGcashCompleted && isCasinoCompleted;
  
  // Get payment URL if available and not completed
  const paymentUrl = !isGcashCompleted ? transactionData.metadata?.payUrl : null;
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center mb-2">
          <CardTitle className="text-xl font-semibold">Payment Status</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshStatus} 
            disabled={isRefreshing}
            className="h-8 px-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="flex items-center">
          {getStatusBadge(transactionData.status)}
          {isRefreshing && (
            <span className="text-xs text-muted-foreground ml-2">Refreshing...</span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="space-y-4">
          {/* Transaction details */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">₱{parseFloat(transactionData.amount).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference:</span>
                <span className="font-mono text-xs">{transactionData.reference}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span>{formatDate(transactionData.createdAt)}</span>
              </div>
              
              {transactionData.metadata?.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span>{formatDate(transactionData.metadata.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Dual status tracking */}
          <div className="bg-muted/30 rounded-lg p-3 border border-muted">
            <h3 className="text-sm font-medium mb-3">Payment Progress</h3>
            
            <div className="space-y-4">
              {/* GCash payment status */}
              <div className="flex items-start">
                <div className={`rounded-full h-6 w-6 flex items-center justify-center ${
                  isGcashCompleted 
                    ? 'bg-green-600' 
                    : gcashStatus === 'failed' 
                      ? 'bg-red-600' 
                      : 'bg-yellow-500'
                } mr-3 flex-shrink-0`}>
                  {isGcashCompleted ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : gcashStatus === 'failed' ? (
                    <X className="h-4 w-4 text-white" />
                  ) : (
                    <Clock className="h-4 w-4 text-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center">
                    <span className="font-medium">GCash Payment</span>
                    <Badge 
                      variant={
                        isGcashCompleted ? 'default' : 
                        gcashStatus === 'failed' ? 'destructive' : 'secondary'
                      }
                      className="ml-2"
                    >
                      {isGcashCompleted ? 'Completed' : 
                      gcashStatus === 'failed' ? 'Failed' : 'Processing'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isGcashCompleted 
                      ? 'Your GCash payment has been successfully processed.' 
                      : gcashStatus === 'failed'
                      ? 'Your GCash payment was not successful. Please try again.' 
                      : 'Your GCash payment is being processed.'}
                  </p>
                </div>
              </div>
              
              {/* Vertical connector line */}
              <div className="pl-3 ml-3 h-6 border-l-2 border-muted"></div>
              
              {/* Casino transfer status */}
              <div className="flex items-start">
                <div className={`rounded-full h-6 w-6 flex items-center justify-center ${
                  isCasinoCompleted 
                    ? 'bg-green-600' 
                    : casinoStatus === 'failed' 
                      ? 'bg-red-600' 
                      : isGcashCompleted ? 'bg-yellow-500' : 'bg-muted'
                } mr-3 flex-shrink-0`}>
                  {isCasinoCompleted ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : casinoStatus === 'failed' ? (
                    <X className="h-4 w-4 text-white" />
                  ) : isGcashCompleted ? (
                    <Clock className="h-4 w-4 text-white" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="flex items-center">
                    <span className={`font-medium ${!isGcashCompleted ? 'text-muted-foreground' : ''}`}>
                      Casino Transfer
                    </span>
                    <Badge 
                      variant={
                        isCasinoCompleted ? 'default' : 
                        casinoStatus === 'failed' ? 'destructive' : 
                        isGcashCompleted ? 'secondary' : 'outline'
                      }
                      className="ml-2"
                    >
                      {isCasinoCompleted ? 'Completed' : 
                      casinoStatus === 'failed' ? 'Failed' : 
                      isGcashCompleted ? 'Processing' : 'Waiting'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isCasinoCompleted 
                      ? 'Funds have been successfully added to your casino balance.' 
                      : casinoStatus === 'failed'
                      ? 'There was an issue adding funds to your casino balance.' 
                      : isGcashCompleted
                      ? 'Transferring funds to your casino balance...' 
                      : 'Waiting for GCash payment to complete first.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Timeline view if available */}
          {timeline && timeline.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Transaction Timeline</h3>
              <div className="space-y-3">
                {timeline.map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className={`rounded-full h-5 w-5 flex items-center justify-center ${
                      item.completed 
                        ? 'bg-green-600' 
                        : item.current 
                          ? 'bg-blue-600' 
                          : 'bg-muted'
                      } mr-2 mt-0.5 flex-shrink-0`}>
                      {item.completed ? (
                        <Check className="h-3 w-3 text-white" />
                      ) : item.current ? (
                        <Clock className="h-3 w-3 text-white" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-muted-foreground/50"></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <span className={`font-medium text-sm ${
                          !item.completed && !item.current ? 'text-muted-foreground' : ''
                        }`}>
                          {item.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                      {item.timestamp && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(item.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Payment action for pending payments */}
          {paymentUrl && (
            <div className="mt-6">
              <Separator className="mb-4" />
              <h4 className="text-sm font-medium mb-2">Complete Your Payment</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Click the button below to open GCash and complete your payment:
              </p>
              <Button
                className="w-full bg-[#0074E0] hover:bg-[#005BB1] text-white"
                onClick={() => window.open(paymentUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Pay with GCash
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                You can also save this page to resume payment later or from another device.
              </p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2">
        <div className="w-full">
          {isFullyCompleted ? (
            <div className="space-y-3 w-full">
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                asChild
              >
                <Link href="/wallet">
                  <Check className="h-4 w-4 mr-2" />
                  Back to Wallet
                </Link>
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Your transaction is complete! Funds have been added to your casino balance.
              </p>
            </div>
          ) : casinoStatus === 'failed' ? (
            <div className="space-y-3 w-full">
              <p className="text-sm text-center text-muted-foreground mb-2">
                There was an issue with the casino transfer. Our team has been notified and will resolve this soon.
              </p>
              <Button asChild className="w-full">
                <Link href="/wallet">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Return to Wallet
                </Link>
              </Button>
            </div>
          ) : gcashStatus === 'failed' ? (
            <div className="space-y-3 w-full">
              <Button 
                asChild 
                className="w-full"
              >
                <Link href="/deposit">
                  Try Again
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                className="w-full"
              >
                <Link href="/wallet">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Back to Wallet
                </Link>
              </Button>
            </div>
          ) : (
            <Button 
              asChild 
              variant="outline" 
              className="w-full"
            >
              <Link href="/wallet">
                <ArrowRight className="mr-2 h-4 w-4" />
                Back to Wallet
              </Link>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default MobilePaymentStatus;