import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusCircle, CreditCard, Trash2, Check, 
  Wallet, Building, Plus, X, Star
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
      className="bg-white/5 backdrop-blur-md rounded-xl p-3 mt-3"
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            method.type === 'bank' ? 'bg-gradient-to-br from-blue-500 to-purple-500' :
            method.type === 'wallet' ? 'bg-gradient-to-br from-green-500 to-teal-500' :
            method.type === 'crypto' ? 'bg-gradient-to-br from-orange-500 to-yellow-500' :
            'bg-gradient-to-br from-gray-500 to-slate-500'
          }`}>
            {method.type === 'bank' && <Building className="h-5 w-5 text-white" />}
            {method.type === 'wallet' && <Wallet className="h-5 w-5 text-white" />}
            {method.type === 'crypto' && <CreditCard className="h-5 w-5 text-white" />}
            {(method.type !== 'bank' && method.type !== 'wallet' && method.type !== 'crypto') && 
             <CreditCard className="h-5 w-5 text-white" />}
          </div>
          <div>
            <h3 className="font-medium text-white">{method.name}</h3>
            <p className="text-xs text-gray-400">{method.details}</p>
          </div>
        </div>
        <div className="flex items-center">
          {method.isDefault ? (
            <div className="bg-blue-500 rounded-full p-1 mr-2">
              <Star className="h-4 w-4 text-white" />
            </div>
          ) : (
            <button 
              onClick={() => onSetDefault(method.id)} 
              className="text-blue-400 mr-2 hover:text-blue-300"
            >
              <Star className="h-4 w-4" />
            </button>
          )}
          <button 
            onClick={() => onDelete(method.id)} 
            className="text-red-400 hover:text-red-300"
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
      className="bg-white/10 backdrop-blur-md rounded-xl p-4 mt-3"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Add Payment Method</h3>
        <button onClick={onCancel} className="text-white/70">
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Method Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bank">Bank Account</option>
              <option value="wallet">E-Wallet</option>
              <option value="crypto">Crypto Wallet</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Payment Method</label>
            <select
              value={methodId || ''}
              onChange={(e) => setMethodId(parseInt(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Name / Alias</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Personal Bank Account"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              {type === 'bank' ? 'Account Number' : 
               type === 'wallet' ? 'Wallet Number/ID' : 
               type === 'crypto' ? 'Wallet Address' : 'Details'}
            </label>
            <input
              type="text"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={
                type === 'bank' ? 'Enter account number...' :
                type === 'wallet' ? 'Enter wallet number/ID...' :
                type === 'crypto' ? 'Enter wallet address...' : 'Enter details...'
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 border border-white/20 rounded-lg text-white font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addPaymentMethodMutation.isPending}
              className="flex-1 py-2 bg-blue-600 rounded-lg text-white font-medium flex justify-center items-center"
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
        <h2 className="text-lg font-medium text-white">Payment Methods</h2>
        {!showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center text-white"
          >
            <PlusCircle className="h-5 w-5 mr-1" />
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