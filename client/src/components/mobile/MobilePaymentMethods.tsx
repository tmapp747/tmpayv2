import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusCircle, CreditCard, Trash2, Check, 
  Wallet, Building, Plus, X, Star,
  ChevronDown, Edit3, Smartphone, Key, FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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
  additionalInfo: string | null;
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
  return (
    <motion.div 
      className="bg-white/5 backdrop-blur-md rounded-xl p-4 mt-3 shadow-md"
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
            method.type === 'bank' ? 'bg-gradient-to-br from-blue-500 to-purple-500' :
            method.type === 'wallet' ? 'bg-gradient-to-br from-green-500 to-teal-500' :
            method.type === 'crypto' ? 'bg-gradient-to-br from-orange-500 to-yellow-500' :
            'bg-gradient-to-br from-gray-500 to-slate-500'
          }`}>
            {method.type === 'bank' && <Building className="h-6 w-6 text-white" />}
            {method.type === 'wallet' && <Wallet className="h-6 w-6 text-white" />}
            {method.type === 'crypto' && <CreditCard className="h-6 w-6 text-white" />}
            {(method.type !== 'bank' && method.type !== 'wallet' && method.type !== 'crypto') && 
             <CreditCard className="h-6 w-6 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col h-14 justify-between">
              <div>
                <h3 className="font-medium text-white truncate">{method.name}</h3>
                <p className="text-sm text-gray-400 truncate">{method.details}</p>
              </div>
              <div className="mt-1">
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full inline-block">
                  {method.type === 'bank' ? 'Bank Account' :
                   method.type === 'wallet' ? 'E-Wallet' :
                   method.type === 'crypto' ? 'Crypto Wallet' : 'Other'}
                </span>
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
              onClick={() => onSetDefault(method.id)} 
              className="text-blue-400 hover:text-blue-300 bg-blue-950/50 p-1.5 rounded-full"
            >
              <Star className="h-4 w-4" />
            </button>
          )}
          <button 
            onClick={() => onDelete(method.id)} 
            className="text-red-400 hover:text-red-300 bg-red-950/50 p-1.5 rounded-full"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

interface AddPaymentMethodFormProps {
  onCancel: () => void;
  availablePaymentMethods: PaymentMethod[];
}

const AddPaymentMethodForm: React.FC<AddPaymentMethodFormProps> = ({ onCancel, availablePaymentMethods }) => {
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [type, setType] = useState('bank');
  const [methodId, setMethodId] = useState<number | null>(null);
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
    if (!name || !type || !details || !methodId) {
      toast({
        title: "Missing information",
        description: "Please fill out all fields",
        variant: "destructive",
      });
      return;
    }

    addPaymentMethodMutation.mutate({
      name,
      type,
      details,
      paymentMethodId: methodId,
      isDefault: false
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 backdrop-blur-md rounded-xl p-5 mt-3 shadow-lg"
    >
      <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3">
        <h3 className="text-lg font-medium text-white">Add Banking Method</h3>
        <button 
          onClick={onCancel} 
          className="text-white/70 hover:text-white transition-colors bg-white/5 rounded-full p-1.5"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
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
                <option value="other">Other</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <ChevronDown className="h-5 w-5 text-white/70" />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1.5">Payment Provider</label>
            <div className="relative">
              <select
                value={methodId || ''}
                onChange={(e) => setMethodId(parseInt(e.target.value))}
                className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Select a payment method</option>
                {availablePaymentMethods
                  .filter(method => method.type === type && method.isActive)
                  .map(method => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
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
              {type === 'bank' ? 'Account Number' : 
               type === 'wallet' ? 'Wallet Number/ID' : 
               type === 'crypto' ? 'Wallet Address' : 'Details'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
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
                 <FileText className="h-5 w-5 text-white/50" />}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-3">
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