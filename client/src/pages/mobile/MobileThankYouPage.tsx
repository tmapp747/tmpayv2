import { useEffect, useState } from 'react';
import { useLocation, useRoute, useRouter } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, ChevronRight, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Sparkles } from '@/components/ui/sparkles';

export default function MobileThankYouPage() {
  const [countdown, setCountdown] = useState(5);
  const [, navigate] = useLocation();
  const [match, params] = useRoute('/mobile/thank-you/:status/:amount/:transactionId?');
  
  const status = params?.status || 'completed';
  const amount = params?.amount ? parseFloat(params.amount) : 0;
  const transactionId = params?.transactionId || '';
  
  // Auto-redirect after countdown
  useEffect(() => {
    if (countdown <= 0) {
      navigate('/mobile');
      return;
    }
    
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown, navigate]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-emerald-950 p-4">
      <Card className="w-full max-w-md mx-auto rounded-xl bg-emerald-900/50 border border-emerald-700/30 shadow-xl overflow-hidden">
        <div className="p-6 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-emerald-800/50 flex items-center justify-center">
              <Check className="h-10 w-10 text-emerald-400" />
            </div>
            <Sparkles className="absolute top-0 right-0 left-0 bottom-0" />
          </div>
          
          <h1 className="text-2xl font-bold text-emerald-100 mb-2">
            Thank You!
          </h1>
          
          {status === 'completed' ? (
            <>
              <p className="text-emerald-300 mb-4">
                Your payment of {formatCurrency(amount, 'PHP')} has been received.
              </p>
              <div className="mb-6 bg-emerald-800/50 rounded-lg p-4 w-full">
                <p className="text-emerald-200 font-medium">Payment Status:</p>
                <p className="text-emerald-100 font-bold flex items-center justify-center">
                  <span className="inline-block w-3 h-3 bg-emerald-400 rounded-full mr-2"></span>
                  Completed
                </p>
                {transactionId && (
                  <p className="text-emerald-300 text-sm mt-2">
                    Transaction ID: #{transactionId}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-emerald-300 mb-4">
                Your payment of {formatCurrency(amount, 'PHP')} is being processed.
              </p>
              <div className="mb-6 bg-emerald-800/50 rounded-lg p-4 w-full">
                <p className="text-emerald-200 font-medium">Payment Status:</p>
                <p className="text-amber-100 font-bold flex items-center justify-center">
                  <span className="inline-block w-3 h-3 bg-amber-400 rounded-full mr-2"></span>
                  {status === 'pending' ? 'Pending' : 'Processing'}
                </p>
                {transactionId && (
                  <p className="text-emerald-300 text-sm mt-2">
                    Transaction ID: #{transactionId}
                  </p>
                )}
              </div>
            </>
          )}
          
          <p className="text-emerald-400 text-sm mb-4">
            Redirecting to home in {countdown} seconds...
          </p>
          
          <Button
            onClick={() => navigate('/mobile')}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            Continue to Home
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}