import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, QrCode, LogIn } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import SuccessNotificationModal from "./SuccessNotificationModal";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const QRDeposit = () => {
  const [amount, setAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Verify authentication state on component mount
  useEffect(() => {
    console.log("QRDeposit authentication state:", user ? "Authenticated" : "Not authenticated");
  }, [user]);

  // Handle displaying amounts in the preset buttons
  const formatDisplayAmount = (value: number | null) => {
    // Safely handle the formatting
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

  const getPresetButtonClasses = (amount: number): string => {
    return cn(
      "border-secondary/50 hover:border-secondary",
      selectedAmount === amount && "bg-secondary hover:bg-secondary/90"
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

      // For anonymous payments, we need to use a different approach
      // We'll make a direct fetch request instead of using apiRequest to avoid auth handling
      const res = await fetch("/api/payments/gcash/generate-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: numAmount,
        }),
        // This ensures cookies are sent with the request, important for maintaining session if any
        credentials: "include"
      });

      if (!res.ok) {
        // Attempt to parse error message, but provide fallback
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
        // Store QR code data (which might be the payment URL)
        setQrData(data.qrPayment.qrCodeData);
        setReferenceId(data.qrPayment.directPayReference);
        
        console.log("QR Payment data received:", data.qrPayment);
        
        // Check if there's a payment URL in the QR payment data
        if (data.qrPayment.payUrl) {
          console.log("Payment URL found:", data.qrPayment.payUrl);
          setPayUrl(data.qrPayment.payUrl);
          
          // Open payment URL in new window
          try {
            const newWindow = window.open(data.qrPayment.payUrl, '_blank');
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
              console.warn("Popup blocked - could not open payment URL in new window");
              toast({
                title: "Payment Link Ready",
                description: "Please use the 'Open in New Window' button in the dialog to complete your payment.",
                variant: "default",
              });
            } else {
              console.log("Payment URL opened in new window");
            }
          } catch (e) {
            console.error("Error opening payment URL:", e);
          }
        } else {
          console.warn("No payment URL found in QR payment data");
          toast({
            title: "QR Code Generated",
            description: "Please scan the QR code with your GCash app to complete payment",
            variant: "default",
          });
        }
        
        // Show the payment modal with QR code or embedded payment URL
        setIsModalOpen(true);

        // Start polling for payment status
        pollPaymentStatus(data.qrPayment.directPayReference);
      } else {
        console.warn("No QR payment data received from server");
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
    // Track consecutive errors to handle persistent auth problems
    let consecutiveErrors = 0;
    
    // Poll every 5 seconds
    const interval = setInterval(async () => {
      try {
        // Use direct fetch call to bypass authentication for anonymous status checks
        const res = await fetch(`/api/payments/status/${refId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // Include credentials to maintain session if any
          credentials: "include"
        });
        
        // Reset consecutive errors counter on successful response
        consecutiveErrors = 0;
        
        // Process the response
        if (!res.ok) {
          console.error(`Error checking payment status: ${res.status} ${res.statusText}`);
          return;
        }
        
        const data = await res.json();
        console.log("Payment status check response:", data);

        if (data.status === "completed") {
          clearInterval(interval);
          setSuccessData({
            amount: parseFloat(amount),
            newBalance: data.qrPayment?.amount || amount,
            transactionId: refId,
          });
          setIsModalOpen(false);
          setIsSuccessModalOpen(true);
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
    <div className="bg-primary rounded-xl shadow-lg overflow-hidden mb-6 border border-secondary/30">
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-white">
            Deposit via GCash
          </h2>
          <div className="bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-medium">
            Instant
          </div>
        </div>
        
        {/* Always show the deposit form, even if not logged in - authentication will be handled on the server side */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Select Amount</label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-3">
            {presetAmounts.map((amt) => (
              <Button
                key={amt}
                type="button"
                variant={selectedAmount === amt ? "default" : "outline"}
                className={getPresetButtonClasses(amt)}
                onClick={() => handlePresetAmountClick(amt)}
              >
                ₱{formatDisplayAmount(amt)}
              </Button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-white">
            Or Enter Custom Amount
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 py-2 text-sm bg-secondary/20 border border-r-0 border-secondary/50 rounded-l-md text-white">
              ₱
            </span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setSelectedAmount(null);
              }}
              placeholder="Enter amount"
              className="rounded-l-none text-white placeholder-gray-400"
              min="100"
              max="50000"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Min: ₱100 | Max: ₱50,000
          </p>
        </div>

        <Button
          onClick={() => generateQrMutation.mutate()}
          disabled={generateQrMutation.isPending}
          className="w-full bg-secondary hover:bg-secondary/90"
        >
          {generateQrMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating QR...
            </>
          ) : (
            <>
              <QrCode className="mr-2 h-4 w-4" />
              Pay with GCash
            </>
          )}
        </Button>
      </div>

      {/* Payment Modal - QR Code or Payment URL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-primary text-white border-secondary/30 sm:max-w-md">
          <DialogTitle className="text-xl font-semibold text-center">
            {payUrl ? "Pay with GCash" : "Scan with GCash App"}
          </DialogTitle>
          
          {payUrl ? (
            // If we have a payment URL, show the iframe or redirect button
            <div className="w-full mx-auto">
              {/* PayURL can be used in an iframe or as a redirect */}
              <iframe 
                src={payUrl} 
                className="w-full rounded-lg border border-secondary/20"
                style={{ height: "400px" }}
                title="GCash Payment"
              />
              <div className="flex justify-center mt-3">
                <Button 
                  variant="outline" 
                  className="text-xs border-secondary/20 hover:bg-secondary/20"
                  onClick={() => window.open(payUrl, '_blank')}
                >
                  Open in New Window
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
          
          <div className="text-center">
            <p className="text-sm text-gray-300 mb-2">
              Amount: <span className="text-white font-medium">₱{amount}</span>
            </p>
            <p className="text-sm text-gray-300 mb-4">
              Reference: <span className="text-white font-mono text-xs">{referenceId}</span>
            </p>
            <p className="text-xs text-gray-400">
              This payment will expire in 30 minutes. Please complete your payment.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      {successData && (
        <SuccessNotificationModal
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          amount={successData.amount}
          newBalance={successData.newBalance}
          transactionId={successData.transactionId}
        />
      )}
    </div>
  );
};

export default QRDeposit;