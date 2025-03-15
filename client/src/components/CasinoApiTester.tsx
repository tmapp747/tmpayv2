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
    <Card className="w-full shadow-lg bg-zinc-800/50 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-white">747 Casino API Tester</CardTitle>
        <CardDescription>Test various Casino API endpoints</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="getUserDetails">User Details</TabsTrigger>
            <TabsTrigger value="getBalance">Balance</TabsTrigger>
            <TabsTrigger value="transfer">Transfer</TabsTrigger>
            <TabsTrigger value="sendMessage">Message</TabsTrigger>
            <TabsTrigger value="getHierarchy">Hierarchy</TabsTrigger>
          </TabsList>
          
          <TabsContent value="getUserDetails" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter casino username"
              />
            </div>
            
            <Button onClick={handleGetUserDetails} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Get User Details'}
            </Button>
          </TabsContent>
          
          <TabsContent value="getBalance" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter casino username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="casinoClientId">Client ID</Label>
              <Input
                id="casinoClientId"
                name="casinoClientId"
                type="number"
                value={formData.casinoClientId}
                onChange={handleInputChange}
                placeholder="Enter client ID"
              />
            </div>
            
            <Button onClick={handleGetBalance} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Get Balance'}
            </Button>
          </TabsContent>
          
          <TabsContent value="transfer" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fromUsername">From Username</Label>
              <Input
                id="fromUsername"
                name="fromUsername"
                value={formData.fromUsername}
                onChange={handleInputChange}
                placeholder="Enter sender username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="toUsername">To Username</Label>
              <Input
                id="toUsername"
                name="toUsername"
                value={formData.toUsername}
                onChange={handleInputChange}
                placeholder="Enter recipient username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter transfer amount"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                placeholder="Enter currency (default: php)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="comment">Comment</Label>
              <Input
                id="comment"
                name="comment"
                value={formData.comment}
                onChange={handleInputChange}
                placeholder="Enter transfer comment"
              />
            </div>
            
            <Button onClick={handleTransfer} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Transfer Funds'}
            </Button>
          </TabsContent>
          
          <TabsContent value="sendMessage" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter recipient username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Enter message subject"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Input
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Enter message content"
              />
            </div>
            
            <Button onClick={handleSendMessage} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Send Message'}
            </Button>
          </TabsContent>
          
          <TabsContent value="getHierarchy" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter username"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                id="isAgent"
                name="isAgent"
                type="checkbox"
                checked={formData.isAgent}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <Label htmlFor="isAgent">Is Agent</Label>
            </div>
            
            <Button onClick={handleGetHierarchy} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Get Hierarchy'}
            </Button>
          </TabsContent>
        </Tabs>
        
        {result && (
          <>
            <Separator className="my-4" />
            <div className="mt-4">
              <h3 className="text-md font-medium text-white mb-2">API Response:</h3>
              <div className="bg-black/50 p-4 rounded-md overflow-auto max-h-60">
                <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-gray-400">
          {user?.casinoUsername 
            ? `Using authenticated user: ${user.casinoUsername}` 
            : 'No authenticated casino user'}
        </div>
      </CardFooter>
    </Card>
  );
}

export default CasinoApiTester;