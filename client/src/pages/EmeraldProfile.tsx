import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { User, ShieldCheck, Lock, Mail, Phone, Cog, ExternalLink, CreditCard, BarChart } from "lucide-react";
import { motion } from "framer-motion";

const EmeraldProfile = () => {
  const [tab, setTab] = useState("profile");
  const { toast } = useToast();
  
  const { data, isLoading } = useQuery({
    queryKey: ['/api/user/info'],
  });
  
  const user = data?.user;
  
  const handleSaveChanges = () => {
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    });
  };
  
  const handleChangePassword = () => {
    toast({
      title: "Password updated",
      description: "Your password has been changed successfully.",
    });
  };
  
  const handleLinkToCasino = () => {
    window.open("https://747casino.com/account", "_blank");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header Card - Emerald Theme */}
      <div className="rounded-xl shadow-lg overflow-hidden mb-6 border border-emerald-700/30 relative"
        style={{
          background: 'linear-gradient(145deg, rgba(4, 120, 87, 0.9), rgba(5, 150, 105, 0.8))',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2), 0 10px 10px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Background glow effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-300/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-teal-300/10 rounded-full blur-3xl"></div>
        
        <div className="p-6 flex flex-col md:flex-row gap-6 items-center md:items-start relative z-10">
          <div className="flex flex-col items-center">
            <Avatar className="h-24 w-24 bg-white/10 ring-4 ring-emerald-300/30">
              <AvatarFallback className="text-white text-2xl bg-emerald-800"
                style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}
              >
                {user?.username?.substring(0, 2).toUpperCase() || "747"}
              </AvatarFallback>
            </Avatar>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 text-xs border-emerald-300/30 text-white bg-emerald-800/40 hover:bg-emerald-800/60"
              style={{ backdropFilter: 'blur(4px)' }}
            >
              VIP Member
            </Button>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-white"
              style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}
            >
              {isLoading ? "Loading..." : user?.username || "User"}
            </h2>
            <p className="text-emerald-100/80">Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</p>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/20"
                style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.2)' }}
              >
                <div className="flex items-center mb-1">
                  <CreditCard className="h-3.5 w-3.5 mr-1.5 text-emerald-200" />
                  <p className="text-emerald-100/90 text-sm">Current Balance</p>
                </div>
                <p className="text-white font-bold text-lg"
                  style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}
                >
                  {isLoading ? "Loading..." : formatCurrency(user?.balance || 0)}
                </p>
              </div>
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/20"
                style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.2)' }}
              >
                <div className="flex items-center mb-1">
                  <BarChart className="h-3.5 w-3.5 mr-1.5 text-emerald-200" />
                  <p className="text-emerald-100/90 text-sm">Casino ID</p>
                </div>
                <p className="text-white font-bold text-lg"
                  style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}
                >
                  {isLoading ? "Loading..." : user?.casinoId || "Not linked"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs - Emerald Theme */}
      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="grid grid-cols-3 bg-emerald-900/70 border border-emerald-700/40 p-1"
          style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.05)' }}
        >
          <TabsTrigger 
            value="profile" 
            className="data-[state=active]:bg-emerald-600/60 data-[state=active]:text-white text-emerald-100/70"
            style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="data-[state=active]:bg-emerald-600/60 data-[state=active]:text-white text-emerald-100/70"
            style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="data-[state=active]:bg-emerald-600/60 data-[state=active]:text-white text-emerald-100/70"
            style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}
          >
            <Cog className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        {/* Profile Tab - Emerald Theme */}
        <TabsContent value="profile">
          <Card className="border-emerald-700/30 bg-emerald-900/30 backdrop-blur-sm shadow-xl"
            style={{ boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1), 0 6px 12px rgba(0, 0, 0, 0.1)' }}
          >
            <CardHeader className="border-b border-emerald-700/30 bg-emerald-900/40">
              <CardTitle className="text-emerald-100"
                style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}
              >
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username" className="text-emerald-200 mb-1.5">Username</Label>
                    <Input
                      id="username"
                      defaultValue={user?.username || ""}
                      className="bg-emerald-900/60 border-emerald-700/50 text-white focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50"
                      style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}
                      disabled
                    />
                    <p className="text-xs text-emerald-300/70 mt-1">Username cannot be changed</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-emerald-200 mb-1.5">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user?.email || ""}
                      className="bg-emerald-900/60 border-emerald-700/50 text-white focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50"
                      style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}
                    />
                  </div>
                </div>
                
                <Separator className="bg-emerald-700/30" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="casinoId" className="text-emerald-200 mb-1.5">Casino ID</Label>
                    <div className="flex">
                      <Input
                        id="casinoId"
                        defaultValue={user?.casinoId || ""}
                        className="bg-emerald-900/60 border-emerald-700/50 text-white rounded-r-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50"
                        style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}
                        disabled
                      />
                      <Button 
                        variant="outline" 
                        className="border-emerald-700/50 border-l-0 rounded-l-none text-emerald-300 hover:bg-emerald-800/60"
                        onClick={handleLinkToCasino}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="phone" className="text-emerald-200 mb-1.5">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Your phone number"
                      className="bg-emerald-900/60 border-emerald-700/50 text-white focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50"
                      style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
                    style={{ 
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                    }}
                    onClick={handleSaveChanges}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Tab - Emerald Theme */}
        <TabsContent value="security">
          <Card className="border-emerald-700/30 bg-emerald-900/30 backdrop-blur-sm shadow-xl"
            style={{ boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1), 0 6px 12px rgba(0, 0, 0, 0.1)' }}
          >
            <CardHeader className="border-b border-emerald-700/30 bg-emerald-900/40">
              <CardTitle className="text-emerald-100"
                style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}
              >
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="current-password" className="text-emerald-200 mb-1.5">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      className="bg-emerald-900/60 border-emerald-700/50 text-white focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50"
                      style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="new-password" className="text-emerald-200 mb-1.5">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        className="bg-emerald-900/60 border-emerald-700/50 text-white focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50"
                        style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="confirm-password" className="text-emerald-200 mb-1.5">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        className="bg-emerald-900/60 border-emerald-700/50 text-white focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50"
                        style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-emerald-700/30" />
                
                <div className="bg-emerald-700/20 p-4 rounded-lg border border-emerald-400/20 backdrop-blur-sm"
                  style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
                >
                  <div className="flex items-start">
                    <Lock className="text-emerald-400 mt-1 mr-3 h-5 w-5" 
                      style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }}
                    />
                    <div>
                      <h3 className="text-white font-medium"
                        style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}
                      >
                        Two-Factor Authentication
                      </h3>
                      <p className="text-emerald-200/80 text-sm mt-1">
                        Add an extra layer of security to your account by enabling two-factor authentication.
                      </p>
                      <Button 
                        className="mt-3 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-100 border border-emerald-500/30"
                        style={{ boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)' }}
                      >
                        Enable 2FA
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
                    style={{ 
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                    }}
                    onClick={handleChangePassword}
                  >
                    Update Password
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Settings Tab - Emerald Theme */}
        <TabsContent value="settings">
          <Card className="border-emerald-700/30 bg-emerald-900/30 backdrop-blur-sm shadow-xl"
            style={{ boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1), 0 6px 12px rgba(0, 0, 0, 0.1)' }}
          >
            <CardHeader className="border-b border-emerald-700/30 bg-emerald-900/40">
              <CardTitle className="text-emerald-100"
                style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}
              >
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between bg-emerald-800/30 p-4 rounded-lg border border-emerald-700/40"
                    style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
                  >
                    <div className="flex items-center">
                      <Mail className="text-emerald-300 mr-3 h-5 w-5" 
                        style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }}
                      />
                      <div>
                        <h3 className="text-white font-medium"
                          style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}
                        >
                          Email Notifications
                        </h3>
                        <p className="text-emerald-200/80 text-sm">Receive email updates about your account activity</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="email-notifications"
                        className="h-4 w-4 rounded border-emerald-700 checked:bg-emerald-500"
                        defaultChecked
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-emerald-800/30 p-4 rounded-lg border border-emerald-700/40"
                    style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
                  >
                    <div className="flex items-center">
                      <Phone className="text-emerald-300 mr-3 h-5 w-5" 
                        style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }}
                      />
                      <div>
                        <h3 className="text-white font-medium"
                          style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}
                        >
                          SMS Notifications
                        </h3>
                        <p className="text-emerald-200/80 text-sm">Receive SMS alerts for important account updates</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="sms-notifications"
                        className="h-4 w-4 rounded border-emerald-700 checked:bg-emerald-500"
                      />
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-emerald-700/30" />
                
                <div className="flex items-center justify-between bg-emerald-800/30 p-4 rounded-lg border border-emerald-700/40"
                  style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
                >
                  <div>
                    <h3 className="text-white font-medium"
                      style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}
                    >
                      Language Preference
                    </h3>
                    <p className="text-emerald-200/80 text-sm">Select your preferred language</p>
                  </div>
                  <div>
                    <select 
                      className="bg-emerald-900/70 border border-emerald-700/50 text-white rounded p-2 text-sm focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50"
                      style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}
                    >
                      <option value="en">English</option>
                      <option value="zh">Chinese</option>
                      <option value="es">Spanish</option>
                      <option value="tl">Tagalog</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
                    style={{ 
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                    }}
                    onClick={() => {
                      toast({
                        title: "Settings saved",
                        description: "Your account settings have been updated.",
                      });
                    }}
                  >
                    Save Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default EmeraldProfile;