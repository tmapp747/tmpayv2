import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, 
  ChevronDown, 
  Edit3, 
  CreditCard, 
  Smartphone, 
  BadgeCheck, 
  Key, 
  Send, 
  Globe, 
  Repeat, 
  FileText, 
  DollarSign, 
  Menu, 
  Check, 
  PlusCircle, 
  Wallet, 
  Plus,
  Trash2,
  Star 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { UserPaymentMethod } from '@/types/api';

interface AddPaymentMethodFormProps {
  onCancel: () => void;
  availablePaymentMethods: any[];
}

interface PaymentMethodCardProps {
  method: UserPaymentMethod;
  onSetDefault: (id: number) => void;
  onDelete: (id: number) => void;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({ method, onSetDefault, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const getIconForType = (type: string) => {
    switch (type) {
      case 'bank':
        return <CreditCard className="h-6 w-6 text-blue-400" />;
      case 'wallet':
        return <Smartphone className="h-6 w-6 text-green-400" />;
      case 'crypto':
        return <Key className="h-6 w-6 text-purple-400" />;
      case 'instapay':
        return <Send className="h-6 w-6 text-orange-400" />;
      case 'pesonet':
        return <Globe className="h-6 w-6 text-teal-400" />;
      case 'remittance':
        return <Repeat className="h-6 w-6 text-pink-400" />;
      default:
        return <FileText className="h-6 w-6 text-gray-400" />;
    }
  };
  
  const formatAccountNumber = (number: string) => {
    if (!number) return '';
    if (number.length <= 4) return number;
    return '••• ' + number.slice(-4);
  };
  
  const renderDetailsBasedOnType = () => {
    switch (method.type) {
      case 'bank':
        return (
          <div>
            <p className="text-xs text-white/60 mt-1">
              {method.bankName || 'Bank'} • {formatAccountNumber(method.accountNumber)}
            </p>
          </div>
        );
      case 'wallet':
        return (
          <div>
            <p className="text-xs text-white/60 mt-1">
              {method.eWalletProvider || 'Wallet'} • {formatAccountNumber(method.accountNumber)}
            </p>
          </div>
        );
      case 'crypto':
        return (
          <div>
            <p className="text-xs text-white/60 mt-1">
              {method.blockchainNetwork || 'Crypto'} • {formatAccountNumber(method.accountNumber)}
            </p>
          </div>
        );
      default:
        return (
          <div>
            <p className="text-xs text-white/60 mt-1">
              {formatAccountNumber(method.accountNumber)}
            </p>
          </div>
        );
    }
  };
  
  return (
    <motion.div 
      className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 relative"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex">
        <div className="mr-3">
          {getIconForType(method.type)}
        </div>
        <div className="flex-1">
          <div className="flex items-center">
            <h4 className="font-medium text-white">{method.name}</h4>
            {method.isDefault && (
              <div className="ml-2 flex items-center bg-blue-500/20 px-1.5 py-0.5 rounded text-xs text-blue-300">
                <Check className="h-3 w-3 mr-0.5" />
                <span>Default</span>
              </div>
            )}
          </div>
          <p className="text-sm text-white/80">{method.accountName}</p>
          {renderDetailsBasedOnType()}
        </div>
        <div>
          <button 
            onClick={() => setShowMenu(!showMenu)} 
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5 text-white/70" />
          </button>
          
          {showMenu && (
            <div 
              className="absolute top-12 right-4 bg-gray-800 shadow-lg rounded-lg border border-white/10 py-1 z-10 min-w-[150px]"
            >
              {!method.isDefault && (
                <button 
                  onClick={() => {
                    onSetDefault(method.id);
                    setShowMenu(false);
                  }}
                  className="flex items-center px-3 py-2 text-sm w-full text-left hover:bg-white/5 text-white/90"
                >
                  <Star className="h-4 w-4 mr-2 text-yellow-400" />
                  Set as Default
                </button>
              )}
              <button 
                onClick={() => {
                  onDelete(method.id);
                  setShowMenu(false);
                }}
                className="flex items-center px-3 py-2 text-sm w-full text-left hover:bg-white/5 text-white/90"
              >
                <Trash2 className="h-4 w-4 mr-2 text-red-400" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const AddPaymentMethodForm: React.FC<AddPaymentMethodFormProps> = ({ onCancel, availablePaymentMethods }) => {
  const [type, setType] = useState('bank');
  const [name, setName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [eWalletProvider, setEWalletProvider] = useState('');
  const [eWalletMobile, setEWalletMobile] = useState('');
  
  // Philippine-specific fields
  const [instapayEnabled, setInstapayEnabled] = useState(false);
  const [pesonetEnabled, setPesonetEnabled] = useState(false);
  const [qrPhEnabled, setQrPhEnabled] = useState(false);
  const [dailyLimit, setDailyLimit] = useState('');
  const [perTransactionLimit, setPerTransactionLimit] = useState('');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const addPaymentMethodMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/user/payment-methods', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/payment-methods'] });
      toast({
        title: "Payment method added",
        description: "Your new payment method has been added successfully",
      });
      onCancel();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add payment method",
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !accountNumber || !accountName) {
      toast({
        title: "Validation Error",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }
    
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="bg-gradient-to-b from-gray-800/50 to-gray-900/70 backdrop-blur-md rounded-xl p-4 mb-4 border border-white/10 shadow-lg"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-white">Add Payment Method</h3>
        <button onClick={onCancel} className="text-white/70 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Simplified form without tabs */}
      <form onSubmit={handleSubmit} className="mt-4">
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