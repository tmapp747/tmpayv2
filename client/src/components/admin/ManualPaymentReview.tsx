import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface ManualPayment {
  id: number;
  userId: number;
  transactionId: number;
  amount: string | number;
  paymentMethod: string;
  reference: string;
  proofImageUrl: string;
  notes: string | null;
  adminId?: number | null;
  adminNotes?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: string | Date;
  updatedAt: string | Date;
}

export default function ManualPaymentReview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState<ManualPayment | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [filter, setFilter] = useState<string>("all");

  // Fetch all manual payments
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/admin/manual-payments"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/manual-payments");
      const data = await res.json();
      return data;
    }
  });

  // Mutation for approving/rejecting payments
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("POST", `/api/admin/manual-payment/${id}/status`, {
        status,
        adminNotes: adminNotes
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manual-payments"] });
      toast({
        title: "Payment updated",
        description: "The payment status has been updated successfully",
        variant: "default",
      });
      setSelectedPayment(null);
      setAdminNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle payment approval
  const handleApprove = () => {
    if (!selectedPayment) return;
    updateStatusMutation.mutate({ id: selectedPayment.id, status: "approved" });
  };

  // Handle payment rejection
  const handleReject = () => {
    if (!selectedPayment) return;
    updateStatusMutation.mutate({ id: selectedPayment.id, status: "rejected" });
  };

  // Filter payments based on status
  const filteredPayments = data?.payments ? 
    data.payments.filter((payment: ManualPayment) => 
      filter === "all" || payment.status === filter
    ) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-lg text-center">
        <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
        <p className="text-destructive font-medium">Error loading manual payments</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Manual Payment Review</h2>
        <Select
          value={filter}
          onValueChange={setFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Payment Requests</h3>
          {filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No payments found
              </CardContent>
            </Card>
          ) : (
            filteredPayments.map((payment: ManualPayment) => (
              <Card 
                key={payment.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedPayment?.id === payment.id 
                    ? 'border-primary ring-1 ring-primary' 
                    : ''
                }`}
                onClick={() => {
                  setSelectedPayment(payment);
                  setAdminNotes(payment.adminNotes || "");
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">
                      {formatCurrency(payment.amount)}
                    </CardTitle>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription>
                    Ref: {payment.reference}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Method:</div>
                    <div className="font-medium">{payment.paymentMethod}</div>
                    <div>Date:</div>
                    <div className="font-medium">{formatDate(payment.createdAt)}</div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    User ID: {payment.userId}
                  </p>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Payment Details</h3>
          {selectedPayment ? (
            <Card>
              <CardHeader>
                <CardTitle>Payment #{selectedPayment.id}</CardTitle>
                <CardDescription>
                  Transaction ID: {selectedPayment.transactionId}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Amount:</div>
                  <div>{formatCurrency(selectedPayment.amount)}</div>
                  <div className="font-medium">Method:</div>
                  <div>{selectedPayment.paymentMethod}</div>
                  <div className="font-medium">Reference:</div>
                  <div>{selectedPayment.reference}</div>
                  <div className="font-medium">Status:</div>
                  <div>
                    <Badge className={getStatusColor(selectedPayment.status)}>
                      {selectedPayment.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="font-medium">Created:</div>
                  <div>{formatDate(selectedPayment.createdAt)}</div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">User Notes</h4>
                  <p className="text-sm p-2 bg-muted rounded-md">
                    {selectedPayment.notes || "No notes provided"}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Payment Proof</h4>
                  {selectedPayment.proofImageUrl ? (
                    <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                      <img 
                        src={selectedPayment.proofImageUrl} 
                        alt="Payment Proof" 
                        className="object-contain w-full h-full"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-destructive">No proof image provided</p>
                  )}
                </div>

                {selectedPayment.status === 'pending' && (
                  <>
                    <div className="space-y-2">
                      <h4 className="font-medium">Admin Notes</h4>
                      <Textarea
                        placeholder="Add notes about this payment"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="default"
                        className="flex-1"
                        onClick={handleApprove}
                        disabled={updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={handleReject}
                        disabled={updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </>
                )}

                {(selectedPayment.status === 'approved' || selectedPayment.status === 'rejected') && selectedPayment.adminNotes && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Admin Notes</h4>
                    <p className="text-sm p-2 bg-muted rounded-md">
                      {selectedPayment.adminNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground h-[500px] flex items-center justify-center">
                <div>
                  <p>Select a payment to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}