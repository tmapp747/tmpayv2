import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, QrCode, Check, CreditCard, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { formatCurrency, cn } from "@/lib/utils";
import { useSwipe } from "@/hooks/use-mobile";

export default function MobileGCashDeposit() {
  const [amount, setAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  // Setup swipe back gesture
  const swipeHandlers = useSwipe({
    onSwipeRight: () => {
      if (!isModalOpen && !isSuccess) {
        navigate("/mobile/wallet");
      }
    },
  });

  // Handle displaying amounts in the preset buttons
  const formatDisplayAmount = (value: number | null) => {
    if (value === null || value === undefined) {
      return "0";
    }

    try {
      return value.toLocaleString(undefined, { minimumFractionDigits: 0 });
    } catch (error) {
      console.error("Error formatting amount:", error);
      return value.toString();
    }
  };

  const handlePresetAmountClick = (value: number) => {
    setSelectedAmount(value);
    setAmount(value.toString());
  };

  const getPresetButtonClasses = (amt: number): string => {
    return cn(
      "border border-blue-500/30 rounded-lg p-3 text-center flex flex-col items-center justify-center transition-all duration-200",
      selectedAmount === amt 
        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30" 
        : "bg-white/5 text-white"
    );
  };

  const generateQrMutation = useMutation({
    mutationFn: async () => {
      // Validate amount
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      if (numAmount < 100) {
        throw new Error("Minimum deposit amount is ₱100");
      }

      if (numAmount > 50000) {
        throw new Error("Maximum deposit amount is ₱50,000");
      }

      // Make direct fetch request
      const res = await fetch("/api/payments/gcash/generate-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: numAmount,
        }),
        credentials: "include"
      });

      if (!res.ok) {
        try {
          const data = await res.json();
          throw new Error(data.message || "Failed to generate QR code");
        } catch (e) {
          throw new Error(`Error ${res.status}: Failed to generate QR code. Please try again.`);
        }
      }

      const data = await res.json();
      return data;
    },
    onSuccess: (data) => {
      if (data.qrPayment) {
        // Store QR code data
        setQrData(data.qrPayment.qrCodeData);
        setReferenceId(data.qrPayment.directPayReference);
        
        // Check if there's a payment URL
        if (data.qrPayment.payUrl) {
          setPayUrl(data.qrPayment.payUrl);
        } else {
          toast({
            title: "QR Code Generated",
            description: "Please scan the QR code with your GCash app to complete payment",
          });
        }
        
        // Show the payment modal
        setIsModalOpen(true);

        // Start polling for payment status
        pollPaymentStatus(data.qrPayment.directPayReference);
      } else {
        toast({
          title: "Error",
          description: "Failed to generate payment information",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pollPaymentStatus = async (refId: string) => {
    // Track consecutive errors 
    let consecutiveErrors = 0;
    
    // Poll every 5 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status/${refId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include"
        });
        
        // Reset consecutive errors counter
        consecutiveErrors = 0;
        
        // Process the response
        if (!res.ok) {
          console.error(`Error checking payment status: ${res.status} ${res.statusText}`);
          return;
        }
        
        const data = await res.json();

        if (data.status === "completed") {
          clearInterval(interval);
          setSuccessData({
            amount: parseFloat(amount),
            newBalance: data.qrPayment?.amount || amount,
            transactionId: refId,
          });
          setIsModalOpen(false);
          setIsSuccess(true);
          
          // Add to transaction history
          toast({
            title: "Payment Successful",
            description: `₱${formatDisplayAmount(parseFloat(amount))} has been added to your wallet`,
            variant: "default",
          });
        } else if (data.status === "failed" || data.status === "expired") {
          clearInterval(interval);
          setIsModalOpen(false);
          toast({
            title: "Payment Failed",
            description: "Your payment was not completed. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        consecutiveErrors++;
        
        // Handle persistent errors
        if (consecutiveErrors >= 5) {
          clearInterval(interval);
          setIsModalOpen(false);
          toast({
            title: "Connection Error",
            description: "We're having trouble checking your payment status. Please check your transaction history later.",
            variant: "destructive",
          });
        }
      }
    }, 5000);

    // Clear interval after 10 minutes (30 min is QR expiry)
    setTimeout(() => {
      clearInterval(interval);
    }, 10 * 60 * 1000);
  };

  const presetAmounts = [100, 200, 500, 1000, 5000];

  return (
    <div 
      className="banking-app min-h-screen pb-20 overflow-hidden bg-gradient-to-b from-[#001138] to-[#002D87]"
      {...swipeHandlers}
    >
      {/* App Header */}
      <header className="p-4 sticky top-0 z-40 backdrop-blur-md bg-[#00174F]/70">
        <div className="flex items-center">
          <Link href="/mobile/wallet">
            <Button variant="ghost" className="rounded-full h-10 w-10 p-0 mr-3 text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-white">GCash Deposit</h1>
            <p className="text-sm text-blue-300">Fund your wallet instantly</p>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {isSuccess ? (
          <SuccessScreen 
            amount={successData.amount} 
            transactionId={successData.transactionId}
            onClose={() => navigate("/mobile/wallet")}
          />
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-4 pb-6 space-y-6"
          >
            {/* Instructions */}
            <div className="bg-white/5 rounded-xl p-4 backdrop-blur-md">
              <h3 className="font-medium text-white mb-2 flex items-center">
                <CreditCard className="h-4 w-4 mr-2 text-blue-300" />
                How to Deposit
              </h3>
              <ol className="text-sm text-blue-100 space-y-2 list-decimal pl-5">
                <li>Select or enter your desired amount</li>
                <li>Tap "Generate QR Code"</li>
                <li>Scan the QR with your GCash app or use the payment link</li>
                <li>Confirm payment in your GCash app</li>
                <li>Wait for confirmation (typically instant)</li>
              </ol>
            </div>

            {/* Amount Selection */}
            <div>
              <h3 className="text-white font-medium mb-3">Select Amount</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {presetAmounts.map((amt) => (
                  <motion.div
                    key={amt}
                    whileTap={{ scale: 0.95 }}
                    className={getPresetButtonClasses(amt)}
                    onClick={() => handlePresetAmountClick(amt)}
                  >
                    <span className="text-xl font-bold">₱{formatDisplayAmount(amt)}</span>
                    <span className="text-xs opacity-70">Tap to select</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div>
              <h3 className="text-white font-medium mb-3">Or Enter Custom Amount</h3>
              <div className="relative mb-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-white">₱</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setSelectedAmount(null);
                  }}
                  placeholder="Enter amount"
                  className="pl-8 py-6 text-xl text-white border-blue-500/30 bg-white/5 backdrop-blur-sm"
                  min="100"
                  max="50000"
                />
              </div>
              <p className="text-xs text-blue-300 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                Min: ₱100 | Max: ₱50,000
              </p>
            </div>

            {/* Proceed Button */}
            <motion.div 
              className="pt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={() => generateQrMutation.mutate()}
                disabled={generateQrMutation.isPending || !amount || parseFloat(amount) < 100}
                className="w-full py-6 text-lg font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-900/30"
              >
                {generateQrMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating QR...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-5 w-5" />
                    Generate GCash QR Code
                  </>
                )}
              </Button>
              
              <p className="text-center text-xs text-blue-300 mt-3">
                Secure payment processing via DirectPay
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal - QR Code or Payment URL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#001138] text-white border-blue-500/30 max-w-sm mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold">
              {payUrl ? "Pay with GCash" : "Scan with GCash App"}
            </h2>
            
            <p className="text-sm text-blue-300 mt-1">
              Amount: <span className="text-white font-medium">₱{amount}</span>
            </p>
          </div>
          
          {payUrl ? (
            // If we have a payment URL, show the iframe or redirect button
            <div className="w-full mx-auto">
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 mb-4">
                <iframe 
                  src={payUrl} 
                  className="w-full rounded-lg border border-blue-500/20"
                  style={{ height: "400px" }}
                  title="GCash Payment"
                />
              </div>
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  className="text-sm border-blue-500/20 hover:bg-blue-500/20 shadow-lg"
                  onClick={() => window.open(payUrl, '_blank')}
                >
                  Open in GCash App
                </Button>
              </div>
            </div>
          ) : (
            // Otherwise show the QR code image
            <div className="p-4 bg-white rounded-lg mx-auto" style={{ maxWidth: "280px" }}>
              {qrData && qrData.includes('<iframe') ? (
                <div dangerouslySetInnerHTML={{ __html: qrData }} className="w-full" />
              ) : (
                <img 
                  src={qrData || '/images/placeholder-qr.png'} 
                  alt="GCash QR Code"
                  className="w-full h-auto"
                />
              )}
            </div>
          )}
          
          <div className="text-center mt-4">
            <p className="text-xs text-blue-300 mb-2">
              Reference: <span className="text-white font-mono text-xs">{referenceId}</span>
            </p>
            <p className="text-xs text-blue-300">
              This payment will expire in 30 minutes
            </p>
            <div className="mt-4 flex justify-center">
              <div className="animate-pulse flex items-center bg-blue-900/50 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-xs">Waiting for payment...</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Success screen component
function SuccessScreen({ amount, transactionId, onClose }: { amount: number, transactionId: string, onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center px-4 py-12 h-[70vh]"
    >
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center mb-6 shadow-lg shadow-green-900/30"
      >
        <Check className="h-10 w-10 text-white" />
      </motion.div>
      
      <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
      <p className="text-blue-300 text-center mb-6">Your wallet has been credited with</p>
      
      <div className="text-4xl font-bold text-white mb-8">
        ₱{formatCurrency(amount, '')}
      </div>
      
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 w-full mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-blue-300">Transaction ID:</span>
          <span className="text-white font-mono">{transactionId.substring(0, 8)}...</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-blue-300">Status:</span>
          <span className="text-green-400">Completed</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-blue-300">Date & Time:</span>
          <span className="text-white">{new Date().toLocaleString()}</span>
        </div>
      </div>
      
      <Button 
        onClick={onClose}
        className="w-full py-6 text-lg font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-900/30"
      >
        Back to Wallet
      </Button>
    </motion.div>
  );
}