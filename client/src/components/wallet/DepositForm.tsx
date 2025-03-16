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
      className="rounded-xl p-6 relative border-2 border-green-900/30"
      style={{
        background: 'radial-gradient(circle at top right, rgba(20, 83, 45, 0.9), rgba(0, 0, 0, 0.85))',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4), 0 5px 10px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
        transform: 'translateZ(0)'
      }}
    >
      {/* Subtle gradient overlay with green glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-black/10 opacity-80 rounded-xl pointer-events-none"></div>
      {/* Extra radiant effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="mb-6 relative">
        <h3 className="text-xl font-bold mb-2 flex items-center text-green-300" style={{textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'}}>
          <Wallet className="h-5 w-5 mr-2 text-green-400" style={{filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5))'}} />
          Deposit Funds
        </h3>
        <p className="text-green-300/80 text-sm">Add funds to your wallet securely and instantly.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        <div className="space-y-3">
          <Label htmlFor="amount" className="text-sm font-medium text-green-300" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)'}}>
            Amount (PHP)
          </Label>
          <Input
            id="amount"
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder="Enter amount"
            className="w-full border-2 border-green-500/30 bg-black/50 text-white"
            style={{
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(0, 0, 0, 0.2), 0 0 10px rgba(74, 222, 128, 0.05)',
              textShadow: '0 1px 1px rgba(0, 0, 0, 0.3)'
            }}
          />
          
          <div className="grid grid-cols-4 gap-2 my-3">
            {DEPOSIT_AMOUNTS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant="outline"
                onClick={() => handleQuickAmountClick(option.value)}
                className={`border-2 ${amount === option.value ? 'border-green-500 bg-green-500/20 text-white' : 'border-green-800/30 bg-black/50 text-green-300/90'}`}
                style={{
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
                  transform: amount === option.value ? 'scale(1.05) translateZ(5px)' : 'translateZ(0)',
                  transition: 'all 0.2s ease',
                  textShadow: '0 1px 1px rgba(0, 0, 0, 0.3)'
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="payment-method" className="text-sm font-medium text-green-300" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)'}}>
            Payment Method
          </Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger 
              id="payment-method" 
              className="w-full border-2 border-green-500/30 bg-black/50 text-white"
              style={{
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(0, 0, 0, 0.2), 0 0 10px rgba(74, 222, 128, 0.05)',
                textShadow: '0 1px 1px rgba(0, 0, 0, 0.3)'
              }}
            >
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent className="border-green-900 bg-black/90">
              <SelectItem value="gcash" className="flex items-center text-white">
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2 text-green-400" />
                  GCash
                </div>
              </SelectItem>
              <SelectItem value="bank" className="text-white">
                <div className="flex items-center">
                  <Banknote className="h-4 w-4 mr-2 text-green-400" />
                  Bank Transfer
                </div>
              </SelectItem>
              <SelectItem value="crypto" className="text-white">
                <div className="flex items-center">
                  <Wallet className="h-4 w-4 mr-2 text-green-400" />
                  Crypto
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-green-700 border-2 border-green-600/50 hover:bg-green-600 text-white transition-all group"
          style={{
            background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.9), rgba(21, 128, 61, 0.95))',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3), 0 4px 10px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 0 15px rgba(74, 222, 128, 0.2)',
            transform: 'translateZ(0)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
          }}
        >
          Continue to Payment 
          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" style={{filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))'}} />
        </Button>
      </form>
    </motion.div>
  );
}

export default DepositForm;