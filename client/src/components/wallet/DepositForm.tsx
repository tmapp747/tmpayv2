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
      className="rounded-xl p-6 relative border-2 border-blue-900/30"
      style={{
        background: 'radial-gradient(circle at top right, rgba(7, 89, 133, 0.9), rgba(12, 74, 110, 0.85))',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4), 0 5px 10px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
        transform: 'translateZ(0)'
      }}
    >
      {/* Subtle gradient overlay with cyan glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-navy-900/20 opacity-80 rounded-xl pointer-events-none"></div>
      {/* Extra radiant effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="mb-6 relative">
        <h3 className="text-xl font-bold mb-2 flex items-center text-cyan-300" style={{textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'}}>
          <Wallet className="h-5 w-5 mr-2 text-cyan-400" style={{filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5))'}} />
          Deposit Funds
        </h3>
        <p className="text-cyan-300/80 text-sm">Add funds to your wallet securely and instantly.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        <div className="space-y-3">
          <Label htmlFor="amount" className="text-sm font-medium text-teal-300" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)'}}>
            Amount (PHP)
          </Label>
          <Input
            id="amount"
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder="Enter amount"
            className="w-full border-2 border-teal-500/30 bg-indigo-950/60 text-white"
            style={{
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(0, 0, 0, 0.2), 0 0 10px rgba(45, 212, 191, 0.15)',
              textShadow: '0 1px 1px rgba(0, 0, 0, 0.3)',
              background: 'linear-gradient(to right, rgba(30, 41, 59, 0.8), rgba(30, 58, 138, 0.7))'
            }}
          />
          
          <div className="grid grid-cols-4 gap-2 my-3">
            {DEPOSIT_AMOUNTS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant="outline"
                onClick={() => handleQuickAmountClick(option.value)}
                className={`border-2 ${amount === option.value ? 'border-orange-500 bg-teal-800/30 text-white' : 'border-indigo-800/30 bg-slate-900/70 text-teal-300/90'}`}
                style={{
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
                  transform: amount === option.value ? 'scale(1.05) translateZ(5px)' : 'translateZ(0)',
                  transition: 'all 0.2s ease',
                  textShadow: '0 1px 1px rgba(0, 0, 0, 0.3)',
                  background: amount === option.value
                    ? 'linear-gradient(to right, rgba(19, 78, 74, 0.7), rgba(15, 118, 110, 0.5))'
                    : 'linear-gradient(to right, rgba(30, 41, 59, 0.6), rgba(49, 46, 129, 0.5))'
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="payment-method" className="text-sm font-medium text-fuchsia-200" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)'}}>
            Payment Method
          </Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger 
              id="payment-method" 
              className="w-full border-2 border-purple-500/30 bg-black/50 text-white"
              style={{
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(0, 0, 0, 0.2), 0 0 10px rgba(192, 132, 252, 0.2)',
                textShadow: '0 1px 1px rgba(0, 0, 0, 0.3)',
                background: 'linear-gradient(to right, rgba(88, 28, 135, 0.6), rgba(112, 26, 117, 0.7))'
              }}
            >
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent className="border-purple-900 bg-black/90">
              <SelectItem value="gcash" className="flex items-center text-white">
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2 text-fuchsia-400" />
                  GCash
                </div>
              </SelectItem>
              <SelectItem value="bank" className="text-white">
                <div className="flex items-center">
                  <Banknote className="h-4 w-4 mr-2 text-fuchsia-400" />
                  Bank Transfer
                </div>
              </SelectItem>
              <SelectItem value="crypto" className="text-white">
                <div className="flex items-center">
                  <Wallet className="h-4 w-4 mr-2 text-fuchsia-400" />
                  Crypto
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          type="submit" 
          className="w-full border-2 border-indigo-600/40 hover:bg-indigo-600/90 text-white transition-all group"
          style={{
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.9), rgba(67, 56, 202, 0.95))',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3), 0 4px 10px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 0 15px rgba(122, 122, 255, 0.35)',
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