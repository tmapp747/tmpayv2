import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusCircle, CreditCard, Trash2, Check, 
  Wallet, Building, Plus, X, Star,
  ChevronDown, Edit3, Smartphone, Key, FileText,
  Fingerprint, Send, Repeat, QrCode, Shield,
  Globe, AlertCircle, BadgeCheck, DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define interfaces for our payment method types
interface PaymentMethod {
  id: number;
  name: string;
  type: string;
  accountName: string;
  accountNumber: string;
  bankName: string | null;
  branchName: string | null;
  instructions: string | null;
  iconUrl: string | null;
  isActive: boolean;
  sortOrder: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface UserPaymentMethod {
  id: number;
  userId: number;
  name: string;
  type: string;
  details: string;
  accountName: string;
  accountNumber: string;
  bankName: string | null;
  branchName: string | null;
  swiftCode: string | null;
  routingNumber: string | null;
  blockchainNetwork: string | null;
  
  // Philippine-specific fields
  instapayEnabled: boolean;
  pesonetEnabled: boolean;
  qrPhEnabled: boolean;
  dailyTransferLimit: number | null;
  perTransactionLimit: number | null;
  
  // Security and verification
  verificationMethod: string | null;
  verificationStatus: string;
  verificationDate: Date | string | null;
  verificationData: Record<string, any> | null;
  
  // Remittance-specific fields
  remittanceProvider: string | null;
  remittancePhoneNumber: string | null;
  remittancePin: string | null;
  
  // Enhanced categorization for e-wallets
  eWalletProvider: string | null;
  eWalletLinkedMobile: string | null;
  
  additionalInfo: Record<string, any>;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface PaymentMethodCardProps {
  method: UserPaymentMethod;
  onSetDefault: (id: number) => void;
  onDelete: (id: number) => void;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({ method, onSetDefault, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // Get the appropriate icon for the payment method type
  const getMethodIcon = () => {
    switch(method.type) {
      case 'bank':
        return <Building className="h-6 w-6 text-white" />;
      case 'wallet':
        return <Wallet className="h-6 w-6 text-white" />;
      case 'crypto':
        return <CreditCard className="h-6 w-6 text-white" />;
      case 'instapay':
        return <Send className="h-6 w-6 text-white" />;
      case 'pesonet':
        return <Globe className="h-6 w-6 text-white" />; 
      case 'remittance':
        return <Repeat className="h-6 w-6 text-white" />;
      default:
        return <CreditCard className="h-6 w-6 text-white" />;
    }
  };
  
  // Get the appropriate background style for the payment method type
  const getMethodBgStyle = () => {
    switch(method.type) {
      case 'bank':
        return 'bg-gradient-to-br from-blue-500 to-purple-500';
      case 'wallet':
        return 'bg-gradient-to-br from-green-500 to-teal-500';
      case 'crypto':
        return 'bg-gradient-to-br from-orange-500 to-yellow-500';
      case 'instapay':
        return 'bg-gradient-to-br from-blue-400 to-cyan-500';
      case 'pesonet':
        return 'bg-gradient-to-br from-indigo-500 to-blue-600';
      case 'remittance':
        return 'bg-gradient-to-br from-amber-500 to-orange-600';
      default:
        return 'bg-gradient-to-br from-gray-500 to-slate-500';
    }
  };
  
  // Get display name for payment method type
  const getMethodTypeName = () => {
    switch(method.type) {
      case 'bank': 
        return 'Bank Account';
      case 'wallet': 
        return 'E-Wallet';
      case 'crypto': 
        return 'Crypto Wallet';
      case 'instapay': 
        return 'InstaPay';
      case 'pesonet': 
        return 'PESONet';
      case 'remittance': 
        return 'Remittance';
      default: 
        return 'Other';
    }
  };
  
  // Get verification badge if method is verified
  const getVerificationBadge = () => {
    if (method.isVerified) {
      return (
        <div className="ml-1.5 bg-green-600/20 border border-green-500/30 rounded-full p-0.5 inline-flex">
          <BadgeCheck className="h-3 w-3 text-green-500" />
        </div>
      );
    }
    return null;
  };
  
  // Display special features badges
  const getFeatureBadges = () => {
    const badges = [];
    
    if (method.instapayEnabled) {
      badges.push(
        <span key="instapay" className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full inline-block mr-1 mb-1">
          InstaPay
        </span>
      );
    }
    
    if (method.pesonetEnabled) {
      badges.push(
        <span key="pesonet" className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full inline-block mr-1 mb-1">
          PESONet
        </span>
      );
    }
    
    if (method.qrPhEnabled) {
      badges.push(
        <span key="qrph" className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full inline-block mr-1 mb-1">
          QR Ph
        </span>
      );
    }
    
    return badges.length > 0 ? (
      <div className="flex flex-wrap mt-2">{badges}</div>
    ) : null;
  };
  
  return (
    <motion.div 
      className="bg-white/5 backdrop-blur-md rounded-xl p-4 mt-3 shadow-md"
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="flex items-center justify-between" onClick={() => setShowDetails(!showDetails)}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getMethodBgStyle()}`}>
            {getMethodIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center">
                  <h3 className="font-medium text-white truncate">{method.name}</h3>
                  {getVerificationBadge()}
                </div>
                <p className="text-sm text-gray-400 truncate">
                  {method.accountNumber}
                </p>
              </div>
              <div className="mt-1">
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full inline-block">
                  {getMethodTypeName()}
                </span>
                {method.eWalletProvider && (
                  <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full inline-block ml-1">
                    {method.eWalletProvider}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          {method.isDefault ? (
            <div className="bg-blue-600 rounded-full p-1.5">
              <Star className="h-4 w-4 text-white" />
            </div>
          ) : (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault(method.id);
              }} 
              className="text-blue-400 hover:text-blue-300 bg-blue-950/50 p-1.5 rounded-full"
            >
              <Star className="h-4 w-4" />
            </button>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(method.id);
            }} 
            className="text-red-400 hover:text-red-300 bg-red-950/50 p-1.5 rounded-full"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Expandable details section */}
      {showDetails && (
        <motion.div 
          className="mt-3 pt-3 border-t border-white/10"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          {/* Features badges */}
          {getFeatureBadges()}
          
          {/* Account details */}
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
            {method.bankName && (
              <div className="col-span-2">
                <span className="text-gray-400">Bank:</span> <span className="text-white">{method.bankName}</span>
              </div>
            )}
            {method.accountName && (
              <div className="col-span-2">
                <span className="text-gray-400">Account Name:</span> <span className="text-white">{method.accountName}</span>
              </div>
            )}
            {method.eWalletProvider && (
              <div className="col-span-2">
                <span className="text-gray-400">Provider:</span> <span className="text-white">{method.eWalletProvider}</span>
              </div>
            )}
            {method.eWalletLinkedMobile && (
              <div className="col-span-2">
                <span className="text-gray-400">Mobile:</span> <span className="text-white">{method.eWalletLinkedMobile}</span>
              </div>
            )}
            {method.dailyTransferLimit && (
              <div className="col-span-2">
                <span className="text-gray-400">Daily Limit:</span> <span className="text-white">₱ {method.dailyTransferLimit.toLocaleString()}</span>
              </div>
            )}
            {/* Verification status */}
            <div className="col-span-2 mt-1 pt-1 border-t border-white/10">
              <span className={`px-2 py-0.5 rounded-full text-xs inline-block ${
                method.verificationStatus === 'verified' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                method.verificationStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {method.verificationStatus.charAt(0).toUpperCase() + method.verificationStatus.slice(1)}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

interface AddPaymentMethodFormProps {
  onCancel: () => void;
  availablePaymentMethods: PaymentMethod[];
}

const AddPaymentMethodForm: React.FC<AddPaymentMethodFormProps> = ({ onCancel, availablePaymentMethods }) => {
  const [name, setName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [type, setType] = useState('bank');
  const [activeTab, setActiveTab] = useState('basic');
  
  // New Philippine-specific fields
  const [instapayEnabled, setInstapayEnabled] = useState(false);
  const [pesonetEnabled, setPesonetEnabled] = useState(false);
  const [qrPhEnabled, setQrPhEnabled] = useState(false);
  const [dailyLimit, setDailyLimit] = useState('');
  const [perTransactionLimit, setPerTransactionLimit] = useState('');
  const [eWalletProvider, setEWalletProvider] = useState('');
  const [eWalletMobile, setEWalletMobile] = useState('');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addPaymentMethodMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/user/payment-methods', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/payment-methods'] });
      toast({
        title: "Payment method added",
        description: "Your new payment method has been added successfully",
      });
      onCancel();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add payment method",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !type || !accountNumber) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }

    // Payment method is just for storing user's banking details - not for integration
    addPaymentMethodMutation.mutate({
      name,
      type,
      accountNumber,
      accountName,
      isDefault: false,
      // Include Philippine-specific fields
      instapayEnabled,
      pesonetEnabled,
      qrPhEnabled,
      dailyTransferLimit: dailyLimit ? parseFloat(dailyLimit) : null,
      perTransactionLimit: perTransactionLimit ? parseFloat(perTransactionLimit) : null,
      eWalletProvider: eWalletProvider || null,
      eWalletLinkedMobile: eWalletMobile || null,
      verificationStatus: 'pending', 
      verificationData: {} as Record<string, any>
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 backdrop-blur-md rounded-xl p-5 mt-3 shadow-lg"
    >
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
        <h3 className="text-lg font-medium text-white">Add Banking Method</h3>
        <button 
          onClick={onCancel} 
          className="text-white/70 hover:text-white transition-colors bg-white/5 rounded-full p-1.5"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList className="w-full bg-white/5 p-1">
          <TabsTrigger value="basic" className="flex-1 data-[state=active]:bg-blue-600">
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="features" className="flex-1 data-[state=active]:bg-blue-600">
            Features
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex-1 data-[state=active]:bg-blue-600">
            Verification
          </TabsTrigger>
        </TabsList>
        
        <form onSubmit={handleSubmit}>
          <TabsContent value="basic" className="mt-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1.5">Method Type</label>
                <div className="relative">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="bank">Bank Account</option>
                    <option value="wallet">E-Wallet</option>
                    <option value="crypto">Crypto Wallet</option>
                    <option value="instapay">InstaPay</option>
                    <option value="pesonet">PESONet</option>
                    <option value="remittance">Remittance</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="h-5 w-5 text-white/70" />
                  </div>
                </div>
              </div>
              
              {/* Payment Provider dropdown removed as requested */}
              
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1.5">Name / Alias</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., My Personal Bank Account"
                    className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Edit3 className="h-5 w-5 text-white/50" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1.5">
                  Account Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Enter account holder's name"
                    className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <BadgeCheck className="h-5 w-5 text-white/50" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1.5">
                  {type === 'bank' ? 'Account Number' : 
                   type === 'wallet' ? 'Wallet Number/ID' : 
                   type === 'crypto' ? 'Wallet Address' : 
                   type === 'instapay' ? 'InstaPay Account Number' :
                   type === 'pesonet' ? 'PESONet Account Number' :
                   type === 'remittance' ? 'Remittance Reference' :
                   'Account Details'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={
                      type === 'bank' ? 'Enter account number...' :
                      type === 'wallet' ? 'Enter wallet number/ID...' :
                      type === 'crypto' ? 'Enter wallet address...' : 'Enter details...'
                    }
                    className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    {type === 'bank' ? <CreditCard className="h-5 w-5 text-white/50" /> :
                     type === 'wallet' ? <Smartphone className="h-5 w-5 text-white/50" /> :
                     type === 'crypto' ? <Key className="h-5 w-5 text-white/50" /> :
                     type === 'instapay' ? <Send className="h-5 w-5 text-white/50" /> :
                     type === 'pesonet' ? <Globe className="h-5 w-5 text-white/50" /> :
                     type === 'remittance' ? <Repeat className="h-5 w-5 text-white/50" /> :
                     <FileText className="h-5 w-5 text-white/50" />}
                  </div>
                </div>
              </div>
              
              {type === 'wallet' && (
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1.5">
                    E-Wallet Provider
                  </label>
                  <div className="relative">
                    <select
                      value={eWalletProvider}
                      onChange={(e) => setEWalletProvider(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      <option value="">Select provider</option>
                      <option value="gcash">GCash</option>
                      <option value="paymaya">PayMaya</option>
                      <option value="grabpay">GrabPay</option>
                      <option value="shopeepay">ShopeePay</option>
                      <option value="coins">Coins.ph</option>
                      <option value="other">Other</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <ChevronDown className="h-5 w-5 text-white/70" />
                    </div>
                  </div>
                </div>
              )}
              
              {type === 'wallet' && (
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1.5">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={eWalletMobile}
                      onChange={(e) => setEWalletMobile(e.target.value)}
                      placeholder="Enter mobile number linked to wallet"
                      className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Smartphone className="h-5 w-5 text-white/50" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="features" className="mt-4">
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-lg mb-4">
                <h4 className="text-sm font-medium text-white mb-3">Philippine Banking Features</h4>
                
                <div className="flex items-center mb-3">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={instapayEnabled}
                      onChange={(e) => setInstapayEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-blue-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500">
                      <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all peer-checked:left-6"></div>
                    </div>
                    <span className="ml-3 text-sm text-white/90">InstaPay Enabled</span>
                  </label>
                </div>
                
                <div className="flex items-center mb-3">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={pesonetEnabled}
                      onChange={(e) => setPesonetEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-blue-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500">
                      <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all peer-checked:left-6"></div>
                    </div>
                    <span className="ml-3 text-sm text-white/90">PESONet Enabled</span>
                  </label>
                </div>
                
                <div className="flex items-center mb-3">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={qrPhEnabled}
                      onChange={(e) => setQrPhEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-blue-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500">
                      <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all peer-checked:left-6"></div>
                    </div>
                    <span className="ml-3 text-sm text-white/90">QR Ph Enabled</span>
                  </label>
                </div>
              </div>
              
              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-3">Transaction Limits</h4>
                
                <div className="mb-3">
                  <label className="block text-sm text-white/90 mb-1.5">
                    Daily Transfer Limit (PHP)
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={dailyLimit}
                      onChange={(e) => setDailyLimit(e.target.value)}
                      placeholder="e.g., 50000"
                      className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <DollarSign className="h-5 w-5 text-white/50" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-white/90 mb-1.5">
                    Per Transaction Limit (PHP)
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={perTransactionLimit}
                      onChange={(e) => setPerTransactionLimit(e.target.value)}
                      placeholder="e.g., 10000"
                      className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <DollarSign className="h-5 w-5 text-white/50" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="verification" className="mt-4">
            <div className="bg-white/5 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-3">Verification Information</h4>
              <p className="text-sm text-white/70 mb-4">
                All payment methods require verification before use. Once you submit this form,
                our team will review your payment method and verify it according to our security protocols.
              </p>
              
              <div className="flex items-center p-3 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 shrink-0" />
                <p className="text-sm text-yellow-300">
                  Verification will start immediately after submission. You'll be able to use this payment method
                  once verification is complete.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <div className="flex space-x-3 pt-5 mt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 border border-white/20 rounded-lg text-white font-medium hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addPaymentMethodMutation.isPending}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white font-medium flex justify-center items-center shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              {addPaymentMethodMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Add Method'
              )}
            </button>
          </div>
        </form>
      </Tabs>
    </motion.div>
  );
};

export default function MobilePaymentMethods() {
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch user payment methods
  const { data: userPaymentMethods, isLoading: isLoadingUserMethods } = useQuery({
    queryKey: ['/api/user/payment-methods'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/user/payment-methods', 'GET');
        return response?.methods || [];
      } catch (error) {
        console.error("Error fetching user payment methods:", error);
        return [];
      }
    }
  });
  
  // Fetch available payment methods (admin managed)
  const { data: availablePaymentMethods, isLoading: isLoadingAvailableMethods } = useQuery({
    queryKey: ['/api/payment-methods'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/payment-methods', 'GET');
        return response?.methods || [];
      } catch (error) {
        console.error("Error fetching available payment methods:", error);
        return [];
      }
    }
  });
  
  // Set a payment method as default
  const setDefaultMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        return await apiRequest(`/api/user/payment-methods/${id}/default`, 'POST');
      } catch (error) {
        console.error("Error setting default payment method:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/payment-methods'] });
      toast({
        title: "Default updated",
        description: "Your default payment method has been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update default payment method",
        variant: "destructive",
      });
    }
  });
  
  // Delete a payment method
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        return await apiRequest(`/api/user/payment-methods/${id}`, 'DELETE');
      } catch (error) {
        console.error("Error deleting payment method:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/payment-methods'] });
      toast({
        title: "Payment method deleted",
        description: "The payment method has been removed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete payment method",
        variant: "destructive",
      });
    }
  });
  
  const handleSetDefault = (id: number) => {
    setDefaultMutation.mutate(id);
  };
  
  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };
  
  return (
    <div className="space-y-4 pb-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-white">Banking Management</h2>
        {!showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center text-white bg-blue-600/80 rounded-lg px-3 py-1 text-sm"
          >
            <PlusCircle className="h-4 w-4 mr-1.5" />
            <span>Add</span>
          </button>
        )}
      </div>
      
      {isLoadingUserMethods || isLoadingAvailableMethods ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <>
          <AnimatePresence>
            {showAddForm && (
              <AddPaymentMethodForm 
                onCancel={() => setShowAddForm(false)} 
                availablePaymentMethods={availablePaymentMethods || []}
              />
            )}
          </AnimatePresence>
          
          {(!userPaymentMethods || userPaymentMethods.length === 0) && !showAddForm ? (
            <div className="text-center py-8">
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-6">
                <Wallet className="h-12 w-12 mx-auto text-blue-400 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Payment Methods</h3>
                <p className="text-white/60 mb-4">
                  Add your payment methods for withdrawals and transfers.
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center mx-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {userPaymentMethods?.map((method: UserPaymentMethod) => (
                  <PaymentMethodCard
                    key={method.id}
                    method={method}
                    onSetDefault={handleSetDefault}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
              
              {!showAddForm && userPaymentMethods && userPaymentMethods.length > 0 && (
                <motion.div 
                  className="border border-dashed border-white/20 rounded-xl p-4 flex items-center justify-center mt-4"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="h-5 w-5 text-white/50 mr-2" />
                  <span className="text-white/50 font-medium">Add New Payment Method</span>
                </motion.div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}