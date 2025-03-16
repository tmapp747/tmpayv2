import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { casinoApi, userApi } from '@/lib/api';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

// This component is for testing the 747 Casino API integration
export function CasinoApiTester() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('getUserDetails');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    // User Details
    username: '',
    
    // Balance
    casinoClientId: 0,
    
    // Transfer
    amount: 100,
    toUsername: '',
    toClientId: 0,
    fromUsername: '',
    currency: 'php',
    comment: 'Test transfer from e-wallet',
    
    // Message
    subject: 'Test Message',
    message: 'This is a test message from the e-wallet',
    
    // Hierarchy
    isAgent: false
  });
  
  // Load user data when the component mounts or when user changes
  useEffect(() => {
    if (user) {
      // If we have cached user data, use it
      updateFormWithUserData(user);
      
      // Also refresh user data from the server to ensure we have the latest
      fetchUserData();
    }
  }, [user]);
  
  // Function to update form with user data
  const updateFormWithUserData = (userData: any) => {
    if (!userData) return;
    
    setFormData(prevData => ({
      ...prevData,
      username: userData.casinoUsername || prevData.username,
      casinoClientId: userData.casinoClientId || prevData.casinoClientId,
      fromUsername: userData.casinoUsername || prevData.fromUsername,
      isAgent: userData.casinoUserType === 'agent' || prevData.isAgent
    }));
  };
  
  // Function to fetch latest user data from the server
  const fetchUserData = async () => {
    try {
      const response = await userApi.getUserInfo();
      if (response.user) {
        updateFormWithUserData(response.user);
        
        // If we don't have casino details yet, try to fetch from casino API
        if (!response.user.casinoUsername && !response.user.casinoClientId) {
          toast({
            title: "Missing Casino Details",
            description: "Your account doesn't have casino details. Please verify your casino username first.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData({ ...formData, [name]: parseFloat(value) });
    } else if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleGetUserDetails = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await casinoApi.getUserDetails({
        username: formData.username
      });
      
      setResult(response);
      
      // If successful, update the client ID for subsequent operations
      if (response.success && response.casinoUser && response.casinoUser.clientId) {
        setFormData(prev => ({ 
          ...prev, 
          casinoClientId: response.casinoUser.clientId,
          toClientId: response.casinoUser.clientId
        }));
      }
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetBalance = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await casinoApi.getRealTimeBalance({
        casinoUsername: formData.username,
        casinoClientId: formData.casinoClientId
      });
      
      setResult(response);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransfer = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await casinoApi.transfer({
        amount: formData.amount,
        fromUsername: formData.fromUsername,
        toUsername: formData.toUsername,
        comment: formData.comment
      });
      
      setResult(response);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await casinoApi.sendMessage({
        username: formData.username,
        subject: formData.subject,
        message: formData.message
      });
      
      setResult(response);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetHierarchy = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await casinoApi.getUserHierarchy({
        username: formData.username,
        isAgent: formData.isAgent
      });
      
      setResult(response);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full shadow-lg bg-emerald-900/50 border border-emerald-700/40 rounded-lg backdrop-blur-sm">
      <div className="p-6 border-b border-emerald-700/40">
        <h2 className="text-xl font-semibold text-yellow-300 text-shadow-sm mb-1.5">747 Casino API Tester</h2>
        <p className="text-emerald-200 text-sm">Test various Casino API endpoints</p>
      </div>
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-emerald-900/60 border border-emerald-700/40 p-1 backdrop-blur-sm shadow-lg">
            <TabsTrigger 
              value="getUserDetails"
              className="data-[state=active]:bg-emerald-700/40 data-[state=active]:text-yellow-300 data-[state=active]:shadow-md"
            >
              User Details
            </TabsTrigger>
            <TabsTrigger 
              value="getBalance"
              className="data-[state=active]:bg-emerald-700/40 data-[state=active]:text-yellow-300 data-[state=active]:shadow-md"
            >
              Balance
            </TabsTrigger>
            <TabsTrigger 
              value="transfer"
              className="data-[state=active]:bg-emerald-700/40 data-[state=active]:text-yellow-300 data-[state=active]:shadow-md"
            >
              Transfer
            </TabsTrigger>
            <TabsTrigger 
              value="sendMessage"
              className="data-[state=active]:bg-emerald-700/40 data-[state=active]:text-yellow-300 data-[state=active]:shadow-md"
            >
              Message
            </TabsTrigger>
            <TabsTrigger 
              value="getHierarchy"
              className="data-[state=active]:bg-emerald-700/40 data-[state=active]:text-yellow-300 data-[state=active]:shadow-md"
            >
              Hierarchy
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="getUserDetails" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-emerald-200">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter casino username"
                className="bg-emerald-900/40 border-emerald-700/40 text-emerald-100 placeholder:text-emerald-400/50"
              />
            </div>
            
            <Button 
              onClick={handleGetUserDetails} 
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              {isLoading ? 'Loading...' : 'Get User Details'}
            </Button>
          </TabsContent>
          
          <TabsContent value="getBalance" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-emerald-200">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter casino username"
                className="bg-emerald-900/40 border-emerald-700/40 text-emerald-100 placeholder:text-emerald-400/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="casinoClientId" className="text-emerald-200">Client ID</Label>
              <Input
                id="casinoClientId"
                name="casinoClientId"
                type="number"
                value={formData.casinoClientId}
                onChange={handleInputChange}
                placeholder="Enter client ID"
                className="bg-emerald-900/40 border-emerald-700/40 text-emerald-100 placeholder:text-emerald-400/50"
              />
            </div>
            
            <Button 
              onClick={handleGetBalance} 
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              {isLoading ? 'Loading...' : 'Get Balance'}
            </Button>
          </TabsContent>
          
          <TabsContent value="transfer" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fromUsername" className="text-emerald-200">From Username</Label>
              <Input
                id="fromUsername"
                name="fromUsername"
                value={formData.fromUsername}
                onChange={handleInputChange}
                placeholder="Enter sender username"
                className="bg-emerald-900/40 border-emerald-700/40 text-emerald-100 placeholder:text-emerald-400/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="toUsername" className="text-emerald-200">To Username</Label>
              <Input
                id="toUsername"
                name="toUsername"
                value={formData.toUsername}
                onChange={handleInputChange}
                placeholder="Enter recipient username"
                className="bg-emerald-900/40 border-emerald-700/40 text-emerald-100 placeholder:text-emerald-400/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-emerald-200">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter transfer amount"
                className="bg-emerald-900/40 border-emerald-700/40 text-emerald-100 placeholder:text-emerald-400/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-emerald-200">Currency</Label>
              <Input
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                placeholder="Enter currency (default: php)"
                className="bg-emerald-900/40 border-emerald-700/40 text-emerald-100 placeholder:text-emerald-400/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="comment" className="text-emerald-200">Comment</Label>
              <Input
                id="comment"
                name="comment"
                value={formData.comment}
                onChange={handleInputChange}
                placeholder="Enter transfer comment"
                className="bg-emerald-900/40 border-emerald-700/40 text-emerald-100 placeholder:text-emerald-400/50"
              />
            </div>
            
            <Button 
              onClick={handleTransfer} 
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              {isLoading ? 'Loading...' : 'Transfer Funds'}
            </Button>
          </TabsContent>
          
          <TabsContent value="sendMessage" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-emerald-200">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter recipient username"
                className="bg-emerald-900/40 border-emerald-700/40 text-emerald-100 placeholder:text-emerald-400/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-emerald-200">Subject</Label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Enter message subject"
                className="bg-emerald-900/40 border-emerald-700/40 text-emerald-100 placeholder:text-emerald-400/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message" className="text-emerald-200">Message</Label>
              <Input
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Enter message content"
                className="bg-emerald-900/40 border-emerald-700/40 text-emerald-100 placeholder:text-emerald-400/50"
              />
            </div>
            
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              {isLoading ? 'Loading...' : 'Send Message'}
            </Button>
          </TabsContent>
          
          <TabsContent value="getHierarchy" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-emerald-200">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter username"
                className="bg-emerald-900/40 border-emerald-700/40 text-emerald-100 placeholder:text-emerald-400/50"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                id="isAgent"
                name="isAgent"
                type="checkbox"
                checked={formData.isAgent}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-emerald-700 bg-emerald-900/40 text-yellow-400 focus:ring-yellow-500"
              />
              <Label htmlFor="isAgent" className="text-emerald-200">Is Agent</Label>
            </div>
            
            <Button 
              onClick={handleGetHierarchy} 
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              {isLoading ? 'Loading...' : 'Get Hierarchy'}
            </Button>
          </TabsContent>
        </Tabs>
        
        {result && (
          <>
            <div className="my-6 h-px bg-gradient-to-r from-transparent via-emerald-700/40 to-transparent"></div>
            <div className="mt-4">
              <h3 className="text-md font-medium text-yellow-300 mb-3">API Response:</h3>
              <div className="bg-emerald-950/70 border border-emerald-800/60 p-4 rounded-md overflow-auto max-h-60 shadow-inner">
                <pre className="text-xs text-emerald-300 font-mono whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="p-4 border-t border-emerald-700/40 flex justify-between">
        <div className="text-xs text-emerald-300">
          {user?.casinoUsername 
            ? `Using authenticated user: ${user.casinoUsername}` 
            : 'No authenticated casino user'}
        </div>
      </div>
    </div>
  );
}

export default CasinoApiTester;