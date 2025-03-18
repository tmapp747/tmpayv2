import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, QrCode, LogIn, CreditCard, Wallet, Building, ArrowDownCircle, LandmarkIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import SuccessNotificationModal from "./SuccessNotificationModal";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const QRDeposit = () => {
  const [amount, setAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("gcash");
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  
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
          
          // Store success data for use in regular modal if mobile redirect isn't applicable
          setSuccessData({
            amount: parseFloat(amount),
            newBalance: data.qrPayment?.amount || amount,
            transactionId: refId,
          });
          
          setIsModalOpen(false);
          
          // For mobile devices, redirect to the thank you page instead of showing modal
          if (isMobile) {
            // Format: /mobile/thank-you/:status/:amount/:transactionId?
            navigate(`/mobile/thank-you/completed/${parseFloat(amount)}/${refId}`);
          } else {
            setIsSuccessModalOpen(true);
          }
        } else if (data.status === "failed" || data.status === "expired") {
          clearInterval(interval);
          setIsModalOpen(false);
          
          // For mobile devices, redirect to the thank you page with failed status
          if (isMobile) {
            // Format: /mobile/thank-you/:status/:amount/:transactionId?
            navigate(`/mobile/thank-you/failed/${parseFloat(amount)}/${refId}`);
          } else {
            toast({
              title: "Payment Failed",
              description: "Your payment was not completed. Please try again.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        consecutiveErrors++;
        
        // Handle persistent errors
        if (consecutiveErrors >= 5) {
          clearInterval(interval);
          setIsModalOpen(false);
          
          // For mobile devices, redirect to the thank you page with pending status
          if (isMobile && referenceId) {
            // Format: /mobile/thank-you/:status/:amount/:transactionId?
            navigate(`/mobile/thank-you/pending/${parseFloat(amount)}/${referenceId}`);
          } else {
            toast({
              title: "Connection Error",
              description: "We're having trouble checking your payment status. Please check your transaction history later.",
              variant: "destructive",
            });
          }
        }
      }
    }, 5000);

    // Clear interval after 10 minutes (30 min is QR expiry)
    setTimeout(() => {
      clearInterval(interval);
    }, 10 * 60 * 1000);
  };

  const presetAmounts = [100, 200, 500, 1000, 5000];

  // Payment method options
  const paymentMethods = [
    { id: "gcash", name: "GCash", icon: <CreditCard className="h-4 w-4" />, description: "Pay with GCash wallet", automatic: true },
    { id: "paymaya", name: "PayMaya", icon: <Wallet className="h-4 w-4" />, description: "Pay with PayMaya wallet", automatic: false },
    { id: "bank", name: "Bank Transfer", icon: <Building className="h-4 w-4" />, description: "Pay via bank transfer", automatic: false },
    { id: "remittance", name: "Remittance", icon: <LandmarkIcon className="h-4 w-4" />, description: "Pay via remittance centers", automatic: false },
    { id: "other", name: "Other", icon: <ArrowDownCircle className="h-4 w-4" />, description: "Other payment methods", automatic: false }
  ];

  // Get the current payment method details
  const currentPaymentMethod = paymentMethods.find(method => method.id === paymentMethod) || paymentMethods[0];

  return (
    <div className="bg-primary rounded-xl shadow-lg overflow-hidden mb-6 border border-secondary/30">
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-white">
            Deposit via {currentPaymentMethod.name}
          </h2>
          <div className="bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-medium">
            {currentPaymentMethod.automatic ? "Instant" : "Manual"}
          </div>
        </div>
        
        {/* Payment Method Selector */}
        <div className="mb-4">
          <Label htmlFor="payment-method" className="block text-gray-300 mb-2">
            Payment Method
          </Label>
          <Select
            value={paymentMethod}
            onValueChange={setPaymentMethod}
          >
            <SelectTrigger className="w-full border-secondary/50 bg-secondary/10 text-white">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent className="bg-primary border-secondary/50">
              {paymentMethods.map((method) => (
                <SelectItem 
                  key={method.id} 
                  value={method.id}
                  className="text-white hover:bg-secondary/20 focus:bg-secondary/20 cursor-pointer"
                >
                  <div className="flex items-center">
                    <span className="mr-2">{method.icon}</span>
                    <span>{method.name}</span>
                    <span className="ml-2 text-xs text-gray-400">
                      {method.automatic ? "(Automatic)" : "(Manual)"}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400 mt-1">
            {currentPaymentMethod.description}
          </p>
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
              {currentPaymentMethod.automatic ? "Generating QR..." : "Processing..."}
            </>
          ) : (
            <>
              {currentPaymentMethod.icon}
              <span className="ml-2">
                {currentPaymentMethod.automatic 
                  ? `Pay with ${currentPaymentMethod.name}` 
                  : `Continue with ${currentPaymentMethod.name}`}
              </span>
            </>
          )}
        </Button>
      </div>

      {/* Payment Modal - QR Code or Payment URL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-primary text-white border-secondary/30 sm:max-w-md">
          <DialogTitle className="text-xl font-semibold text-center">
            Pay with GCash
          </DialogTitle>
          
          <div className="flex flex-col space-y-4">
            {/* Tabs for switching between Payment Page and QR Code */}
            <div className="flex border-b border-secondary/20">
              <button 
                className={`py-2 px-4 ${payUrl && !qrData ? 'border-b-2 border-secondary text-white' : 'text-gray-400'}`}
                onClick={() => {
                  if (payUrl) {
                    // Prioritize showing payment URL in iframe
                    setQrData(null);
                  }
                }}
              >
                Pay Online
              </button>
              <button 
                className={`py-2 px-4 ${qrData ? 'border-b-2 border-secondary text-white' : 'text-gray-400'}`}
                onClick={() => {
                  // If we have a qrData (or can generate one from payUrl), prioritize showing QR
                  if (qrData || payUrl) {
                    setQrData(qrData || payUrl);
                  }
                }}
              >
                Scan QR
              </button>
            </div>

            {/* Content area - shows either payment iframe or QR code */}
            {(payUrl && !qrData) ? (
              // Payment URL in iframe
              <div className="w-full mx-auto">
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
                <div className="text-center mt-3">
                  <Button
                    variant="secondary"
                    className="text-xs"
                    onClick={() => {
                      // Switch to QR code view
                      setQrData(payUrl);
                    }}
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    Show QR Code for Scanning
                  </Button>
                </div>
              </div>
            ) : (
              // QR code view
              <div className="flex flex-col items-center">
                <div className="p-4 bg-white rounded-lg mx-auto mb-3" style={{ maxWidth: "280px" }}>
                  {qrData && qrData.includes('<iframe') ? (
                    <div dangerouslySetInnerHTML={{ __html: qrData }} className="w-full" />
                  ) : qrData ? (
                    <img 
                      src={qrData} 
                      alt="GCash QR Code"
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-64 w-64">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* If both options are available, show button to switch to iframe */}
                {payUrl && (
                  <Button
                    variant="secondary"
                    className="text-xs"
                    onClick={() => {
                      // Switch to payment view
                      setQrData(null);
                    }}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Switch to Online Payment
                  </Button>
                )}
              </div>
            )}
          </div>
          
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