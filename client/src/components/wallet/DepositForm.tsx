import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { DEPOSIT_AMOUNTS } from "@/lib/constants";
import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, CreditCard, Banknote, ArrowRight } from "lucide-react";

function DepositForm() {
  const [amount, setAmount] = useState<number | string>('');
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle deposit submission
    console.log('Deposit submitted:', { amount, paymentMethod });
  };
  
  const handleQuickAmountClick = (value: number) => {
    setAmount(value);
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card rounded-xl p-6 relative border-2 border-secondary/20"
      style={{
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 5px 10px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
        transform: 'translateZ(0)'
      }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 opacity-50 rounded-xl pointer-events-none"></div>
      
      <div className="mb-6 relative">
        <h3 className="text-xl font-bold mb-2 flex items-center" style={{textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'}}>
          <Wallet className="h-5 w-5 mr-2 text-primary" style={{filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3))'}} />
          Deposit Funds
        </h3>
        <p className="text-muted-foreground text-sm">Add funds to your wallet securely and instantly.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        <div className="space-y-3">
          <Label htmlFor="amount" className="text-sm font-medium" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'}}>
            Amount (PHP)
          </Label>
          <Input
            id="amount"
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder="Enter amount"
            className="w-full border-2 border-secondary/20 bg-card/50"
            style={{
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(0, 0, 0, 0.1)',
              textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)'
            }}
          />
          
          <div className="grid grid-cols-4 gap-2 my-3">
            {DEPOSIT_AMOUNTS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant="outline"
                onClick={() => handleQuickAmountClick(option.value)}
                className={`border-2 ${amount === option.value ? 'border-primary bg-primary/10' : 'border-secondary/20'}`}
                style={{
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
                  transform: amount === option.value ? 'scale(1.05) translateZ(5px)' : 'translateZ(0)',
                  transition: 'all 0.2s ease',
                  textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)'
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="payment-method" className="text-sm font-medium" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'}}>
            Payment Method
          </Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger 
              id="payment-method" 
              className="w-full border-2 border-secondary/20"
              style={{
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
                textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)'
              }}
            >
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gcash" className="flex items-center">
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
                  GCash
                </div>
              </SelectItem>
              <SelectItem value="bank">
                <div className="flex items-center">
                  <Banknote className="h-4 w-4 mr-2 text-green-500" />
                  Bank Transfer
                </div>
              </SelectItem>
              <SelectItem value="crypto">
                <div className="flex items-center">
                  <Wallet className="h-4 w-4 mr-2 text-yellow-500" />
                  Crypto
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-primary border-2 border-primary/50 hover:bg-primary/90 transition-all group"
          style={{
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2), 0 4px 10px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
            transform: 'translateZ(0)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
          }}
        >
          Continue to Payment 
          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" style={{filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3))'}} />
        </Button>
      </form>
    </motion.div>
  );
}

export default DepositForm;