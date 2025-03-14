import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, QrCode } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import SuccessNotificationModal from "./SuccessNotificationModal";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const QRDeposit = () => {
  const [amount, setAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const { toast } = useToast();

  // Handle displaying amounts in the preset buttons
  const formatDisplayAmount = (value: number) => {
    // Safely handle the formatting
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

      const res = await apiRequest("POST", "/api/payments/gcash/generate-qr", {
        amount: numAmount,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to generate QR code");
      }

      const data = await res.json();
      return data;
    },
    onSuccess: (data) => {
      if (data.qrPayment) {
        setQrData(data.qrPayment.qrCodeData);
        setReferenceId(data.qrPayment.directPayReference);
        setIsModalOpen(true);

        // Start polling for payment status
        pollPaymentStatus(data.qrPayment.directPayReference);
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
    // Poll every 5 seconds
    const interval = setInterval(async () => {
      try {
        const res = await apiRequest("GET", `/api/payments/status/${refId}`);
        const data = await res.json();

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

        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Select Amount</label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-3">
            {presetAmounts.map((amt) => (
              <Button
                key={amt}
                type="button"
                variant={selectedAmount === amt ? "default" : "outline"}
                className={cn(
                  "border-secondary/50 hover:border-secondary",
                  selectedAmount === amt && "bg-secondary hover:bg-secondary/90"
                )}
                onClick={() => handlePresetAmountClick(amt)}
              >
                ₱{formatDisplayAmount(amt)}
              </Button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-300 mb-2">
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
              className="rounded-l-none"
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
              Generate GCash QR
            </>
          )}
        </Button>
      </div>

      {/* QR Code Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-primary text-white border-secondary/30 sm:max-w-md">
          <DialogTitle className="text-xl font-semibold text-center">
            Scan with GCash App
          </DialogTitle>
          <div className="p-4 bg-white rounded-lg mx-auto" 
               style={{ maxWidth: "280px" }}>
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
          <div className="text-center">
            <p className="text-sm text-gray-300 mb-2">
              Amount: <span className="text-white font-medium">₱{amount}</span>
            </p>
            <p className="text-sm text-gray-300 mb-4">
              Reference: <span className="text-white font-mono text-xs">{referenceId}</span>
            </p>
            <p className="text-xs text-gray-400">
              This QR code will expire in 30 minutes. Please complete your payment.
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