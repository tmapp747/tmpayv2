import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Loader2, 
  QrCode, 
  Check, 
  CreditCard, 
  AlertCircle, 
  Share2, 
  Copy, 
  ExternalLink, 
  Smartphone,
  Phone,
  ChevronDown
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
  const [copySuccess, setCopySuccess] = useState(false);
  // Define interface for transaction success data
  interface SuccessData {
    amount: number;
    newBalance: string | number;
    transactionId: string;
    timestamp: string;
    paymentMethod: string;
    statusUpdatedAt?: string;
    completedAt?: string;
  }
  
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();

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

        // Immediately invalidate transactions query to show the pending transaction
        queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });

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
    
    // Poll every 1.5 seconds for faster updates
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
        
        // Log real-time status updates
        console.log(`GCash payment status update [${new Date().toLocaleTimeString()}]:`, {
          reference: refId,
          status: data.status,
          qrPayment: data.qrPayment ? {
            status: data.qrPayment.status,
            amount: data.qrPayment.amount,
            updatedAt: data.qrPayment.updatedAt,
            statusUpdatedAt: data.qrPayment.statusUpdatedAt,
            completedAt: data.qrPayment.completedAt,
          } : null
        });

        if (data.status === "completed") {
          clearInterval(interval);
          
          // Get completion timestamp either from API response or use current time
          const completionTimestamp = data.qrPayment?.completedAt || 
                                      data.qrPayment?.statusUpdatedAt || 
                                      new Date().toISOString();
          
          // Store successful transaction data with timestamp information
          setSuccessData({
            amount: parseFloat(amount),
            newBalance: data.qrPayment?.amount || amount,
            transactionId: refId,
            timestamp: completionTimestamp,
            paymentMethod: 'GCash',
            statusUpdatedAt: data.qrPayment?.statusUpdatedAt || completionTimestamp,
            completedAt: data.qrPayment?.completedAt || completionTimestamp
          });
          
          // Close modal and show success screen
          setIsModalOpen(false);
          setIsSuccess(true);
          
          // Invalidate queries to refresh transaction list and user balance
          queryClient.invalidateQueries({queryKey: ['/api/transactions']});
          queryClient.invalidateQueries({queryKey: ['/api/user/info']});
          
          // Log completion details
          console.log("Payment completed:", {
            reference: refId,
            amount: parseFloat(amount),
            completedAt: completionTimestamp,
            status: "completed"
          });
          
          // Notify user
          toast({
            title: "GCash Payment Successful",
            description: `₱${formatDisplayAmount(parseFloat(amount))} has been added to your wallet`,
            variant: "default",
          });
          
        } else if (data.status === "failed" || data.status === "expired") {
          clearInterval(interval);
          setIsModalOpen(false);
          
          // Invalidate queries to ensure UI is up-to-date
          queryClient.invalidateQueries({queryKey: ['/api/transactions']});
          
          console.log("Payment failed or expired:", {
            reference: refId,
            status: data.status,
            timestamp: new Date().toISOString()
          });
          
          toast({
            title: "GCash Payment Failed",
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
    }, 1500);

    // Clear interval after 10 minutes (30 min is QR expiry)
    setTimeout(() => {
      clearInterval(interval);
    }, 10 * 60 * 1000);
  };

  // Handle copying payment URL to clipboard
  const handleCopyLink = useCallback(() => {
    if (!payUrl) return;
    
    navigator.clipboard.writeText(payUrl)
      .then(() => {
        setCopySuccess(true);
        toast({
          title: "Link Copied",
          description: "Payment link copied to clipboard",
        });
        
        // Reset copy success state after 2 seconds
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error("Failed to copy link: ", err);
        toast({
          title: "Copy Failed",
          description: "Could not copy link to clipboard",
          variant: "destructive",
        });
      });
  }, [payUrl, toast]);
  
  // Handle sharing payment link to other apps
  const handleShareLink = useCallback(() => {
    if (!payUrl) return;
    
    if (navigator.share) {
      navigator.share({
        title: "GCash Payment",
        text: `Pay ₱${amount} via GCash`,
        url: payUrl
      })
        .then(() => {
          toast({
            title: "Link Shared",
            description: "Payment link shared successfully",
          });
        })
        .catch(err => {
          console.error("Share failed:", err);
          // Fall back to copy if sharing fails
          handleCopyLink();
        });
    } else {
      // Fallback for browsers that don't support Web Share API
      handleCopyLink();
    }
  }, [payUrl, amount, handleCopyLink, toast]);

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
          <div className="flex items-center">
            <img 
              src="/images/gcash.png" 
              alt="GCash Logo" 
              className="w-10 h-10 mr-3 rounded-xl shadow-lg"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }}
            />
            <div>
              <h1 className="text-xl font-semibold text-white">GCash Deposit</h1>
              <p className="text-sm text-blue-300">Fund your wallet instantly</p>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {isSuccess && successData ? (
          <SuccessScreen 
            amount={successData.amount} 
            transactionId={successData.transactionId}
            timestamp={successData.timestamp}
            completedAt={successData.completedAt}
            statusUpdatedAt={successData.statusUpdatedAt}
            onClose={() => navigate("/mobile/wallet")}
          />
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-4 pb-6 pt-5 space-y-6"
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
                <li>Scan the QR with your GCash app <strong>or</strong> share the payment link to another device</li>
                <li>Confirm payment in your GCash app</li>
                <li>Wait for confirmation (typically instant)</li>
              </ol>
              <div className="mt-2 flex items-start bg-blue-900/30 rounded-md p-2 text-xs">
                <Phone className="h-3.5 w-3.5 mr-1.5 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-blue-200">
                  <strong>New:</strong> You can now share the payment URL to pay using another device!
                </p>
              </div>
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
        <DialogContent className="bg-[#001138] text-white border-blue-500/30 max-w-sm mx-auto" aria-describedby="payment-description">
          <DialogTitle className="sr-only">
            {payUrl ? "Pay with GCash" : "Scan with GCash App"}
          </DialogTitle>
          
          <div className="text-center mb-4">
            <div className="flex items-center justify-center mb-2">
              <img 
                src="/images/gcash.png" 
                alt="GCash Logo" 
                className="w-12 h-12 mr-2 rounded-xl shadow-md"
              />
              <h2 className="text-xl font-semibold">
                {payUrl ? "Pay with GCash" : "Scan with GCash App"}
              </h2>
            </div>
            
            <p className="text-sm text-blue-300 mt-1" id="payment-description">
              Amount: <span className="text-white font-medium">₱{amount}</span>
            </p>
          </div>
          
          {payUrl ? (
            // If we have a payment URL, show the iframe with QR overlay
            <div className="w-full mx-auto">
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 mb-4 relative">
                {/* The iframe is positioned as relative */}
                <div className="relative">
                  {/* Scrollable iframe */}
                  <iframe 
                    src={payUrl} 
                    className="w-full rounded-lg border border-blue-500/20"
                    style={{ 
                      height: "350px", 
                      overflow: "auto" // Make iframe scrollable
                    }}
                    title="GCash Payment"
                  />
                  
                  {/* Instead of overlay, add a hint at the bottom */}
                  <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#001138]/80 to-transparent py-2 text-center">
                    <div className="text-xs font-medium text-blue-200">
                      <span>Scroll to see all details</span>
                    </div>
                  </div>
                </div>
                
                {/* Centered QR code below the iframe */}
                <div className="mt-4 flex flex-col items-center">
                  <div className="bg-white p-3 rounded-lg shadow-md mb-2" style={{ width: "150px", height: "150px" }}>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(payUrl || '')}`}
                      alt="Payment QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-blue-300 text-center">
                    <Smartphone className="h-3 w-3 inline mr-1" />
                    Scan with another device to pay
                  </p>
                </div>
              </div>
              
              {/* Cross-device payment options */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-blue-500/20 text-white bg-blue-900/40 hover:bg-blue-800/60"
                  onClick={handleShareLink}
                >
                  <div className="flex flex-col items-center text-xs">
                    <Share2 className="h-4 w-4 mb-1" />
                    <span>Share</span>
                  </div>
                </Button>
                
                <Button 
                  variant="outline"
                  size="sm"
                  className={cn(
                    "border-blue-500/20 text-white bg-blue-900/40 hover:bg-blue-800/60",
                    copySuccess && "bg-green-900/40 border-green-500/30"
                  )}
                  onClick={handleCopyLink}
                >
                  <div className="flex flex-col items-center text-xs">
                    <Copy className="h-4 w-4 mb-1" />
                    <span>{copySuccess ? "Copied" : "Copy link"}</span>
                  </div>
                </Button>
                
                <Button 
                  variant="outline"
                  size="sm"
                  className="border-blue-500/20 text-white bg-blue-900/40 hover:bg-blue-800/60"
                  onClick={() => window.open(payUrl, '_blank')}
                >
                  <div className="flex flex-col items-center text-xs">
                    <ExternalLink className="h-4 w-4 mb-1" />
                    <span>Open</span>
                  </div>
                </Button>
              </div>
              
              <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/30">
                <p className="text-blue-200 text-xs mb-2 flex items-start">
                  <Phone className="h-4 w-4 mr-2 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>
                    You can also pay using <strong>another device</strong> by sharing this payment link or scanning the QR code.
                  </span>
                </p>
              </div>
            </div>
          ) : (
            // Otherwise show the QR code image with cross-device instructions
            <div className="mx-auto space-y-4">
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
              
              <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/30">
                <p className="text-blue-200 text-xs mb-2 flex items-start">
                  <Smartphone className="h-4 w-4 mr-2 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Scan the QR code</strong> with your GCash app or another device to complete payment.
                  </span>
                </p>
              </div>
            </div>
          )}
          
          <div className="text-center mt-4">
            <p className="text-xs text-blue-300 mb-2">
              Reference: <span className="text-white font-mono text-xs">{referenceId}</span>
            </p>
            <p className="text-xs text-blue-300">
              This payment will expire in 30 minutes
            </p>
            <div className="mt-4 flex flex-col items-center">
              <div className="flex items-center mb-2">
                <img 
                  src="/images/gcash.png" 
                  alt="GCash" 
                  className="w-5 h-5 mr-2" 
                />
                <div className="animate-pulse flex items-center bg-blue-900/50 rounded-full px-3 py-1.5">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-xs ml-2">Waiting for GCash payment...</span>
                </div>
              </div>
              <p className="text-xs text-blue-200/80">
                Secure payment processing via <span className="font-medium">GCash</span>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Success screen component
function SuccessScreen({ 
  amount, 
  transactionId, 
  onClose, 
  timestamp, 
  completedAt, 
  statusUpdatedAt 
}: { 
  amount: number, 
  transactionId: string, 
  onClose: () => void,
  timestamp?: string,
  completedAt?: string,
  statusUpdatedAt?: string
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center px-4 py-16 h-[75vh]"
    >
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="relative"
      >
        <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center mb-6 shadow-lg shadow-green-900/30">
          <Check className="h-10 w-10 text-white" />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-lg">
          <img 
            src="/images/gcash.png" 
            alt="GCash" 
            className="w-8 h-8 rounded-full" 
          />
        </div>
      </motion.div>
      
      <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
      <p className="text-blue-300 text-center mb-6">Your wallet has been credited with</p>
      
      <div className="text-4xl font-bold text-white mb-8">
        ₱{formatCurrency(amount, '')}
      </div>
      
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 w-full mb-8">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-500/20">
          <span className="text-blue-300 text-sm">Payment Method</span>
          <div className="flex items-center">
            <img 
              src="/images/gcash.png" 
              alt="GCash" 
              className="w-5 h-5 mr-1.5" 
            />
            <span className="text-white font-medium">GCash</span>
          </div>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-blue-300">Transaction ID:</span>
          <span className="text-white font-mono">{transactionId.substring(0, 8)}...</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-blue-300">Status:</span>
          <span className="text-green-400 flex items-center">
            <Check className="h-3 w-3 mr-1" /> Completed
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-blue-300">Date & Time:</span>
          <span className="text-white">
            {completedAt 
              ? new Date(completedAt).toLocaleString() 
              : timestamp 
                ? new Date(timestamp).toLocaleString()
                : new Date().toLocaleString()
            }
          </span>
        </div>
        {statusUpdatedAt && (
          <div className="flex justify-between text-sm mt-2 pt-2 border-t border-blue-500/20">
            <span className="text-blue-300">Status Updated:</span>
            <span className="text-blue-200 text-xs flex items-center">
              {new Date(statusUpdatedAt).toLocaleString()}
              <span className="ml-1 bg-green-500/20 rounded-sm px-1 py-0.5 text-[10px] text-green-300">
                LIVE
              </span>
            </span>
          </div>
        )}
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