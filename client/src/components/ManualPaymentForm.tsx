import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, generateTransactionReference } from "@/lib/utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Upload } from "lucide-react";

// Manual payment form schema
const manualPaymentSchema = z.object({
  amount: z.coerce.number()
    .min(100, "Minimum deposit is ₱100")
    .max(100000, "Maximum deposit is ₱100,000"),
  paymentMethod: z.string()
    .min(1, "Payment method is required"),
  notes: z.string()
    .optional(),
  proofImage: z.instanceof(File)
    .refine(file => file.size > 0, "Proof of payment is required")
    .refine(file => file.size <= 5000000, "File size should be less than 5MB")
    .refine(
      file => ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type),
      "Only .jpg, .jpeg, .png and .webp files are accepted."
    ),
});

type ManualPaymentFormValues = z.infer<typeof manualPaymentSchema>;

export default function ManualPaymentForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form
  const form = useForm<ManualPaymentFormValues>({
    resolver: zodResolver(manualPaymentSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: "",
      notes: "",
    },
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Update form value
    form.setValue("proofImage", file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle form submission
  const onSubmit = async (data: ManualPaymentFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("amount", data.amount.toString());
      formData.append("paymentMethod", data.paymentMethod);
      if (data.notes) formData.append("notes", data.notes);
      formData.append("proofImage", data.proofImage);
      formData.append("reference", generateTransactionReference());
      
      const response = await fetch("/api/payments/manual/submit", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit manual payment");
      }
      
      const responseData = await response.json();
      
      toast({
        title: "Payment submitted",
        description: "Your manual payment has been submitted for approval",
      });
      
      // Reset form
      form.reset();
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
    } catch (error) {
      console.error("Manual payment error:", error);
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle>Manual Payment</CardTitle>
        <CardDescription>
          Upload proof of external payments for manual verification
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                      <Input 
                        type="number" 
                        placeholder="1000" 
                        className="pl-8" 
                        {...field} 
                        disabled={isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gcash">GCash</SelectItem>
                      <SelectItem value="paymaya">PayMaya</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="remittance">Remittance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any details about your payment..." 
                      className="resize-none" 
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="proofImage"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Proof of Payment</FormLabel>
                  <FormControl>
                    <div className="grid gap-4">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        disabled={isSubmitting}
                      />
                      <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-2 cursor-pointer"
                           onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {previewUrl ? 'Change image' : 'Click to upload a screenshot of your payment'}
                        </p>
                      </div>
                      
                      {previewUrl && (
                        <div className="relative mt-2">
                          <img 
                            src={previewUrl} 
                            alt="Proof of payment preview" 
                            className="w-full h-auto max-h-[200px] object-contain rounded-lg" 
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            type="button"
                            onClick={() => {
                              setPreviewUrl(null);
                              form.setValue("proofImage", undefined as any);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit for Approval"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="bg-muted/50 text-sm text-muted-foreground border-t flex justify-center">
        <p>Manual payments will be processed by an admin within 24 hours</p>
      </CardFooter>
    </Card>
  );
}