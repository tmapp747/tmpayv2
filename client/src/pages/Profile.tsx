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
import { User, ShieldCheck, Lock, Mail, Phone, Cog, ExternalLink } from "lucide-react";

const Profile = () => {
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-primary rounded-xl shadow-lg overflow-hidden mb-6 border border-secondary/30">
        <div className="p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="flex flex-col items-center">
            <Avatar className="h-24 w-24 bg-secondary/20">
              <AvatarFallback className="text-secondary text-2xl">
                {user?.username?.substring(0, 2).toUpperCase() || "747"}
              </AvatarFallback>
            </Avatar>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 text-xs border-secondary/30 text-secondary hover:bg-secondary/10"
            >
              VIP Member
            </Button>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-white">
              {isLoading ? "Loading..." : user?.username || "User"}
            </h2>
            <p className="text-gray-300">Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</p>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-dark/30 p-3 rounded-lg">
                <p className="text-gray-300 text-sm">Current Balance</p>
                <p className="text-white font-bold text-lg">
                  {isLoading ? "Loading..." : formatCurrency(user?.balance || 0)}
                </p>
              </div>
              <div className="bg-dark/30 p-3 rounded-lg">
                <p className="text-gray-300 text-sm">Casino ID</p>
                <p className="text-white font-bold text-lg">
                  {isLoading ? "Loading..." : user?.casinoId || "Not linked"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="grid grid-cols-3 bg-primary border border-secondary/30">
          <TabsTrigger value="profile" className="data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary">
            <Cog className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card className="border-secondary/30">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      defaultValue={user?.username || ""}
                      className="bg-dark/50 border-gray-600 text-white"
                      disabled
                    />
                    <p className="text-xs text-gray-400 mt-1">Username cannot be changed</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user?.email || ""}
                      className="bg-dark/50 border-gray-600 text-white"
                    />
                  </div>
                </div>
                
                <Separator className="bg-gray-700" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="casinoId">Casino ID</Label>
                    <div className="flex">
                      <Input
                        id="casinoId"
                        defaultValue={user?.casinoId || ""}
                        className="bg-dark/50 border-gray-600 text-white rounded-r-none"
                        disabled
                      />
                      <Button 
                        variant="outline" 
                        className="border-gray-600 border-l-0 rounded-l-none text-secondary"
                        onClick={handleLinkToCasino}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Your phone number"
                      className="bg-dark/50 border-gray-600 text-white"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    className="bg-secondary hover:bg-secondary/90 text-white"
                    onClick={handleSaveChanges}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card className="border-secondary/30">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      className="bg-dark/50 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        className="bg-dark/50 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        className="bg-dark/50 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-gray-700" />
                
                <div className="bg-secondary/10 p-4 rounded-lg border border-secondary/20">
                  <div className="flex items-start">
                    <Lock className="text-secondary mt-1 mr-3 h-5 w-5" />
                    <div>
                      <h3 className="text-white font-medium">Two-Factor Authentication</h3>
                      <p className="text-gray-300 text-sm mt-1">
                        Add an extra layer of security to your account by enabling two-factor authentication.
                      </p>
                      <Button className="mt-3 bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/30">
                        Enable 2FA
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    className="bg-secondary hover:bg-secondary/90 text-white"
                    onClick={handleChangePassword}
                  >
                    Update Password
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card className="border-secondary/30">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between bg-dark/30 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Mail className="text-gray-300 mr-3 h-5 w-5" />
                      <div>
                        <h3 className="text-white font-medium">Email Notifications</h3>
                        <p className="text-gray-300 text-sm">Receive email updates about your account activity</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="email-notifications"
                        className="h-4 w-4 rounded border-gray-300"
                        defaultChecked
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-dark/30 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Phone className="text-gray-300 mr-3 h-5 w-5" />
                      <div>
                        <h3 className="text-white font-medium">SMS Notifications</h3>
                        <p className="text-gray-300 text-sm">Receive SMS alerts for important account updates</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="sms-notifications"
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-gray-700" />
                
                <div className="flex items-center justify-between bg-dark/30 p-4 rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">Language Preference</h3>
                    <p className="text-gray-300 text-sm">Select your preferred language</p>
                  </div>
                  <div>
                    <select className="bg-dark border border-gray-600 text-white rounded p-2 text-sm">
                      <option value="en">English</option>
                      <option value="zh">Chinese</option>
                      <option value="es">Spanish</option>
                      <option value="tl">Tagalog</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    className="bg-secondary hover:bg-secondary/90 text-white"
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
    </div>
  );
};

export default Profile;
