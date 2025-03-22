import React, { useEffect, useState } from 'react';
import { useLocation, useRouter } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

/**
 * Thank You page shown after a successful payment
 * 
 * This component:
 * 1. Displays a success message with transaction details
 * 2. Provides buttons to return to the dashboard or view transactions
 */
export default function MobileThankYou() {
  const [location] = useLocation();
  const router = useRouter();
  const { toast } = useToast();
  
  // Extract transaction reference from URL
  const params = new URLSearchParams(location.split('?')[1]);
  const txId = params.get('tx_id');
  
  const [transaction, setTransaction] = useState<any>(null);
  
  useEffect(() => {
    if (!txId) {
      toast({
        title: "Error",
        description: "No transaction ID found",
        variant: "destructive"
      });
      router('/');
      return;
    }
    
    const fetchTransactionDetails = async () => {
      try {
        const response = await apiRequest(`/api/payments/check-transaction-status?tx_id=${txId}`, {
          method: 'GET'
        });
        
        if (response.success && response.transaction) {
          setTransaction(response.transaction);
        } else {
          toast({
            title: "Error",
            description: "Failed to retrieve transaction details",
            variant: "destructive"
          });
        }
      } catch (err) {
        console.error("Error fetching transaction details:", err);
        toast({
          title: "Error",
          description: "Failed to retrieve transaction details",
          variant: "destructive"
        });
      }
    };
    
    fetchTransactionDetails();
  }, [txId, router, toast]);
  
  const handleGoToDashboard = () => {
    router('/');
  };
  
  const handleViewTransactions = () => {
    router('/transactions');
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-4 h-full">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-2">
          <div className="mx-auto mb-2">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-center">Thank You!</CardTitle>
          <CardDescription className="text-center text-base">
            Your deposit was successful
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          <div className="bg-muted p-4 rounded-md mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-semibold">
                ₱{transaction ? parseFloat(transaction.amount).toFixed(2) : '0.00'}
              </span>
            </div>
            
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Reference:</span>
              <span className="font-medium text-sm">{txId}</span>
            </div>
            
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Status:</span>
              <span className="text-green-500 font-medium">Completed</span>
            </div>
            
            {transaction?.createdAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span>{new Date(transaction.createdAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-2">
          <Button 
            onClick={handleGoToDashboard} 
            className="w-full" 
            size="lg"
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <Button 
            onClick={handleViewTransactions} 
            variant="outline" 
            className="w-full" 
            size="lg"
          >
            View All Transactions
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}