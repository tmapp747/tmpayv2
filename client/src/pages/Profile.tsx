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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, ShieldCheck, ShieldAlert, Lock, Mail, Phone, Cog, ExternalLink, CreditCard, BarChart } from "lucide-react";
import { motion } from "framer-motion";

const Profile = () => {
  const [tab, setTab] = useState("profile");
  const { toast } = useToast();
  
  const { data, isLoading } = useQuery<{ success: boolean; user: any }>({
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
      {/* Header Card - Enhanced Emerald Theme with Gold */}
      <div className="rounded-xl shadow-lg overflow-hidden mb-6 border border-yellow-500/20 relative"
        style={{
          background: 'linear-gradient(145deg, rgba(4, 120, 87, 0.9), rgba(5, 150, 105, 0.8))',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.25), 0 10px 10px rgba(0, 0, 0, 0.1), 0 0 40px rgba(16, 185, 129, 0.2)'
        }}
      >
        {/* Enhanced background glow effects with gold */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-teal-300/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-20 w-24 h-24 bg-yellow-300/10 rounded-full blur-2xl"></div>
        
        <div className="p-6 flex flex-col md:flex-row gap-6 items-center md:items-start relative z-10">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 via-yellow-300 to-emerald-500 blur-sm opacity-50 animate-pulse"></div>
              <Avatar className="h-24 w-24 bg-white/10 ring-4 ring-yellow-400/30 relative z-10"
                style={{ boxShadow: '0 0 20px rgba(250, 204, 21, 0.3)' }}>
                <AvatarFallback className="text-white text-2xl bg-emerald-800 border-2 border-yellow-500/20"
                  style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}
                >
                  {user?.username?.substring(0, 2).toUpperCase() || "747"}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 text-xs border border-yellow-500/30 text-yellow-300 bg-emerald-900/70 hover:bg-emerald-800/80"
              style={{ 
                backdropFilter: 'blur(4px)',
                boxShadow: '0 2px 10px rgba(250, 204, 21, 0.15)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
              }}
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
              <div className="relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-yellow-400/10 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="relative bg-gradient-to-br from-emerald-900/90 to-black/80 p-3 rounded-lg backdrop-blur-sm border border-yellow-500/20"
                  style={{ 
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 0 15px rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <div className="flex items-center mb-1">
                    <CreditCard className="h-3.5 w-3.5 mr-1.5 text-yellow-300" style={{ filter: 'drop-shadow(0 0 3px rgba(250, 204, 21, 0.5))' }} />
                    <p className="text-emerald-100/90 text-sm">Current Balance</p>
                  </div>
                  <p className="text-yellow-300 font-bold text-lg"
                    style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}
                  >
                    {isLoading ? "Loading..." : formatCurrency(user?.balance || 0)}
                  </p>
                </div>
              </div>
              
              <div className="relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-yellow-400/10 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="relative bg-gradient-to-br from-emerald-900/90 to-black/80 p-3 rounded-lg backdrop-blur-sm border border-yellow-500/20"
                  style={{ 
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 0 15px rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <div className="flex items-center mb-1">
                    <BarChart className="h-3.5 w-3.5 mr-1.5 text-yellow-300" style={{ filter: 'drop-shadow(0 0 3px rgba(250, 204, 21, 0.5))' }} />
                    <p className="text-emerald-100/90 text-sm">Casino ID</p>
                  </div>
                  <p className="text-yellow-300 font-bold text-lg"
                    style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}
                  >
                    {isLoading ? "Loading..." : user?.casinoId || "Not linked"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs - Enhanced Emerald Theme with Gold */}
      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="grid grid-cols-3 bg-gradient-to-r from-emerald-900/80 to-black/75 border border-yellow-500/20 p-1"
          style={{ 
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 0 15px rgba(16, 185, 129, 0.15)',
          }}
        >
          <TabsTrigger 
            value="profile" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-700/80 data-[state=active]:to-emerald-900/90 data-[state=active]:border-yellow-500/30 data-[state=active]:text-yellow-300 text-emerald-100/70 data-[state=active]:border"
            style={{ 
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
              boxShadow: 'data-[state=active]:0 0 10px rgba(16, 185, 129, 0.3)'
            }}
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-700/80 data-[state=active]:to-emerald-900/90 data-[state=active]:border-yellow-500/30 data-[state=active]:text-yellow-300 text-emerald-100/70 data-[state=active]:border"
            style={{ 
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
              boxShadow: 'data-[state=active]:0 0 10px rgba(16, 185, 129, 0.3)'
            }}
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-700/80 data-[state=active]:to-emerald-900/90 data-[state=active]:border-yellow-500/30 data-[state=active]:text-yellow-300 text-emerald-100/70 data-[state=active]:border"
            style={{ 
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
              boxShadow: 'data-[state=active]:0 0 10px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Cog className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card 
            className="border-emerald-700/30 bg-emerald-900/30 backdrop-blur-sm shadow-xl transition-all duration-300 hover:scale-[1.005] hover:border-yellow-500/40"
            style={{ 
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1), 0 6px 12px rgba(0, 0, 0, 0.1)',
              transformStyle: 'preserve-3d',
            }}
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
                    className="relative overflow-hidden group bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white shadow-lg border border-yellow-500/20"
                    style={{ 
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2), 0 0 20px rgba(16, 185, 129, 0.15)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                    }}
                    onClick={handleSaveChanges}
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-yellow-300/0 via-yellow-300/30 to-yellow-300/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                    <span className="relative z-10 flex items-center">
                      <span className="mr-1.5 text-yellow-300" style={{ filter: 'drop-shadow(0 0 2px rgba(250, 204, 21, 0.5))' }}>✓</span>
                      Save Changes
                    </span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card 
            className="border-emerald-700/30 bg-emerald-900/30 backdrop-blur-sm shadow-xl transition-all duration-300 hover:scale-[1.005] hover:border-yellow-500/40"
            style={{ 
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1), 0 6px 12px rgba(0, 0, 0, 0.1)',
              transformStyle: 'preserve-3d',
            }}
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
                      className="bg-emerald-900/60 border-emerald-700/50 text-white focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300"
                      style={{ 
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="new-password" className="text-emerald-200 mb-1.5">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        className="bg-emerald-900/60 border-emerald-700/50 text-white focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300"
                        style={{ 
                          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="confirm-password" className="text-emerald-200 mb-1.5">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        className="bg-emerald-900/60 border-emerald-700/50 text-white focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300"
                        style={{ 
                          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-emerald-700/30" />
                
                <div 
                  className="bg-emerald-800/30 p-5 rounded-lg border border-emerald-700/40 hover:border-yellow-500/40 transition-all duration-300 hover:bg-emerald-800/50 group transform hover:scale-[1.02]"
                  style={{ 
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                  }}
                >
                  <div className="flex items-start">
                    <div className="mr-4 mt-1 bg-yellow-500/10 p-2 rounded-full transition-all duration-300 group-hover:bg-yellow-500/20 group-hover:scale-110">
                      <ShieldAlert className="text-yellow-300 h-6 w-6" 
                        style={{ 
                          filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.3))',
                          transition: 'all 0.3s ease',
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-lg flex items-center"
                        style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}
                      >
                        Two-Factor Authentication
                        <Badge className="ml-2 bg-red-500/80 text-xs font-normal py-0 px-2">Recommended</Badge>
                      </h3>
                      <p className="text-emerald-200/90 text-sm mt-1.5 max-w-md">
                        Add an extra layer of security to your account by enabling two-factor authentication. This prevents unauthorized access even if your password is compromised.
                      </p>
                      <Button 
                        className="mt-4 relative overflow-hidden bg-gradient-to-r from-yellow-500/80 to-yellow-600/80 hover:from-yellow-400/90 hover:to-yellow-500/90 text-emerald-950 border border-yellow-400/60 group-hover:scale-105 transition-transform duration-300"
                        style={{ 
                          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2), 0 0 15px rgba(250, 204, 21, 0.2)',
                        }}
                      >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-yellow-300/0 via-yellow-100/30 to-yellow-300/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                        <span className="relative z-10 flex items-center font-medium">
                          <ShieldAlert className="h-4 w-4 mr-2" />
                          Enable 2FA Protection
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    className="relative overflow-hidden group bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white shadow-lg border border-yellow-500/20"
                    style={{ 
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2), 0 0 20px rgba(16, 185, 129, 0.15)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                    }}
                    onClick={handleChangePassword}
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-yellow-300/0 via-yellow-300/30 to-yellow-300/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                    <span className="relative z-10 flex items-center">
                      <span className="mr-1.5 text-yellow-300" style={{ filter: 'drop-shadow(0 0 2px rgba(250, 204, 21, 0.5))' }}>🔒</span>
                      Update Password
                    </span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card 
            className="border-emerald-700/30 bg-emerald-900/30 backdrop-blur-sm shadow-xl transition-all duration-300 hover:scale-[1.005] hover:border-yellow-500/40"
            style={{ 
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1), 0 6px 12px rgba(0, 0, 0, 0.1)',
              transformStyle: 'preserve-3d',
            }}
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
                  <div 
                    className="flex items-center justify-between bg-emerald-800/30 p-4 rounded-lg border border-emerald-700/40 hover:border-yellow-500/30 hover:bg-emerald-800/50 transition-all duration-300 transform hover:-translate-y-1"
                    style={{ 
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="flex items-center">
                      <Mail className="text-emerald-300 mr-3 h-5 w-5 transition-transform duration-300 group-hover:scale-110" 
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
                  
                  <div 
                    className="flex items-center justify-between bg-emerald-800/30 p-4 rounded-lg border border-emerald-700/40 hover:border-yellow-500/30 hover:bg-emerald-800/50 transition-all duration-300 transform hover:-translate-y-1"
                    style={{ 
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="flex items-center">
                      <Phone className="text-emerald-300 mr-3 h-5 w-5 transition-transform duration-300 group-hover:scale-110" 
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
                
                <div 
                  className="flex items-center justify-between bg-emerald-800/30 p-4 rounded-lg border border-emerald-700/40 hover:border-yellow-500/30 hover:bg-emerald-800/50 transition-all duration-300 transform hover:-translate-y-1"
                  style={{ 
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                  }}
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
                      className="bg-emerald-900/70 border border-emerald-700/50 text-white rounded p-2 text-sm focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300 hover:border-yellow-500/40"
                      style={{ 
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
                        cursor: 'pointer',
                      }}
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
                    className="relative overflow-hidden group bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white shadow-lg border border-yellow-500/20"
                    style={{ 
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2), 0 0 20px rgba(16, 185, 129, 0.15)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                    }}
                    onClick={() => {
                      toast({
                        title: "Settings saved",
                        description: "Your account settings have been updated.",
                      });
                    }}
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-yellow-300/0 via-yellow-300/30 to-yellow-300/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                    <span className="relative z-10 flex items-center">
                      <span className="mr-1.5 text-yellow-300" style={{ filter: 'drop-shadow(0 0 2px rgba(250, 204, 21, 0.5))' }}>⚙️</span>
                      Save Settings
                    </span>
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

export default Profile;
