import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

// UI components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Icons
import { 
  Loader2, 
  Check, 
  Shield, 
  Wallet, 
  TrendingUp,
  User,
  LockKeyhole,
  AtSign,
  ArrowRight,
  ArrowLeft
} from "lucide-react";

// Casino logo
import casinoLogo from "../assets/Logo teammarc.png";

// Types for the casino API verification response
interface CasinoVerificationResponse {
  success: boolean;
  message: string;
  topManager?: string;
  immediateManager?: string;
  userType?: string;
  clientId?: number;
}

// Username verification schema
const usernameVerificationSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  userType: z.enum(["player", "agent"]).default("player")
});

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  userType: z.enum(["player", "agent"]).default("player")
});

// Registration form schema with casino info
const registerSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  email: z.string().email({ message: "Please enter a valid email" }), // Email is now required
  userType: z.enum(["player", "agent"]).default("player"),
  // Read-only casino information fields (not actually sent in the request, but displayed)
  topManager: z.string().optional(),
  immediateManager: z.string().optional(),
  casinoUserType: z.string().optional(),
  clientId: z.number().optional() // Casino client ID
});

type UsernameVerificationFormValues = z.infer<typeof usernameVerificationSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("verification");
  const [verifiedUsername, setVerifiedUsername] = useState<string>("");
  const [verifiedUserType, setVerifiedUserType] = useState<"player" | "agent">("player");
  const [casinoVerificationData, setCasinoVerificationData] = useState<CasinoVerificationResponse | null>(null);
  const { toast } = useToast();
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const [shouldRender, setShouldRender] = useState(true);

  // Use useEffect for navigation to avoid setState during render
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
      setShouldRender(false);
    } else {
      setShouldRender(true);
    }
  }, [user, navigate]);

  // Username verification form
  const verificationForm = useForm<UsernameVerificationFormValues>({
    resolver: zodResolver(usernameVerificationSchema),
    defaultValues: {
      username: "",
      userType: "player"
    }
  });

  // Verify username mutation
  const verifyUsernameMutation = useMutation({
    mutationFn: async (data: UsernameVerificationFormValues) => {
      const res = await apiRequest("POST", API_ENDPOINTS.AUTH.VERIFY_USERNAME, data);
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message || "Username verification failed");
      return responseData as CasinoVerificationResponse;
    },
    onSuccess: (data) => {
      // Store the verified username and type
      setVerifiedUsername(verificationForm.getValues("username"));
      setVerifiedUserType(verificationForm.getValues("userType") as "player" | "agent");
      
      // Store the full casino verification data
      setCasinoVerificationData(data);
      
      // Show success message
      toast({
        title: "Username verified",
        description: data.message || "Your username is eligible for this platform",
        variant: "default",
      });
      
      // Switch to login tab by default
      setActiveTab("login");
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onVerifySubmit = (data: UsernameVerificationFormValues) => {
    verifyUsernameMutation.mutate(data);
  };

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: verifiedUsername,
      password: "",
      userType: verifiedUserType
    }
  });

  // Registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: verifiedUsername,
      password: "",
      email: "",
      userType: verifiedUserType
    }
  });

  // Update forms when verified details change
  useEffect(() => {
    if (verifiedUsername) {
      // Set common values for both forms
      loginForm.setValue("username", verifiedUsername);
      loginForm.setValue("userType", verifiedUserType);
      registerForm.setValue("username", verifiedUsername);
      registerForm.setValue("userType", verifiedUserType);
      
      // If casino data is available, populate the registration form
      if (casinoVerificationData) {
        if (casinoVerificationData.topManager) {
          registerForm.setValue("topManager", casinoVerificationData.topManager);
        }
        if (casinoVerificationData.immediateManager) {
          registerForm.setValue("immediateManager", casinoVerificationData.immediateManager);
        }
        if (casinoVerificationData.userType) {
          registerForm.setValue("casinoUserType", casinoVerificationData.userType);
        }
        if (casinoVerificationData.clientId) {
          registerForm.setValue("clientId", casinoVerificationData.clientId);
          console.log("Setting clientId in registration form:", casinoVerificationData.clientId);
        }
      }
    }
  }, [verifiedUsername, verifiedUserType, casinoVerificationData, loginForm, registerForm]);

  const onLoginSubmit = (data: LoginFormValues) => {
    console.log("Submitting login with session-based auth:", data.username);
    // Include credentials option to ensure cookies are sent/received
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    // Debug log to see what values are being submitted
    console.log("Submitting registration form with data:", JSON.stringify(data, null, 2));
    // Include credentials option to ensure cookies are sent/received
    registerMutation.mutate(data);
  };
  
  const goBackToVerification = () => {
    setVerifiedUsername("");
    setVerifiedUserType("player");
    setActiveTab("verification");
  };

  // Don't render anything if user is logged in
  if (!shouldRender) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      {/* Simple minimal header */}
      <header className="fixed top-0 w-full h-14 sm:h-16 bg-black border-b border-gray-800 shadow-sm flex items-center justify-between px-4 z-20">
        <Link href="/">
          <div className="flex items-center space-x-2">
            <img src={casinoLogo} alt="747 Casino Logo" className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="font-medium text-base sm:text-lg text-lime-400">747 Casino E-Wallet</span>
          </div>
        </Link>
        
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-white hover:text-lime-400">
            Back
          </Button>
        </Link>
      </header>
      
      {/* Auth Container - centered in the page */}
      <div className="w-full max-w-md mx-auto px-4 py-16 sm:py-20">
        {/* Auth Card with Dark Theme */}
        <Card className="w-full border border-gray-800 bg-dark-card shadow-lg">
          <CardHeader className="bg-dark-DEFAULT rounded-t-lg p-4 sm:p-6 border-b border-gray-800">
            <div className="flex justify-center mb-2">
              <img src={casinoLogo} alt="747 Casino Logo" className="w-14 h-14 sm:w-16 sm:h-16" />
            </div>
            <CardTitle className="text-center text-lg sm:text-xl text-white">
              Account Access
            </CardTitle>
            <CardDescription className="text-center text-sm text-gray-300 font-medium">
              Manage your casino payments <span className="text-lime-400">securely</span>
            </CardDescription>
          </CardHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-3 sm:px-6 pt-2">
              <TabsList className="grid w-full grid-cols-3 mb-2 h-10 sm:h-11 bg-dark-light border border-gray-700">
                <TabsTrigger 
                  value="verification" 
                  disabled={!!verifiedUsername}
                  className={`text-xs sm:text-sm ${verifiedUsername ? "text-gray-500" : "data-[state=active]:bg-dark-darker data-[state=active]:text-lime-400 data-[state=active]:border-t-2 data-[state=active]:border-lime-400"}`}
                >
                  Verify
                </TabsTrigger>
                <TabsTrigger 
                  value="login" 
                  disabled={!verifiedUsername}
                  className={`text-xs sm:text-sm ${!verifiedUsername ? "text-gray-500" : "data-[state=active]:bg-dark-darker data-[state=active]:text-lime-400 data-[state=active]:border-t-2 data-[state=active]:border-lime-400"}`}
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  disabled={!verifiedUsername}
                  className={`text-xs sm:text-sm ${!verifiedUsername ? "text-gray-500" : "data-[state=active]:bg-dark-darker data-[state=active]:text-lime-400 data-[state=active]:border-t-2 data-[state=active]:border-lime-400"}`}
                >
                  Register
                </TabsTrigger>
              </TabsList>
            </div>
            
            <CardContent className="p-3 sm:p-4 md:p-6 bg-dark-DEFAULT">
              <TabsContent value="verification">
                <div className="space-y-3 sm:space-y-4">
                  <Form {...verificationForm}>
                    <form onSubmit={verificationForm.handleSubmit(onVerifySubmit)} className="space-y-3 sm:space-y-4">
                      <FormField
                        control={verificationForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5 sm:space-y-2">
                            <FormLabel className="flex items-center text-sm text-gray-300">
                              <User className="h-3.5 w-3.5 mr-2 text-lime-400" />
                              Username
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your 747 Casino username" 
                                {...field} 
                                className="h-9 sm:h-10 bg-dark-light text-white border-gray-700 focus:border-lime-500/50 focus:ring-0 text-sm"
                              />
                            </FormControl>
                            <FormMessage className="text-red-500 text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={verificationForm.control}
                        name="userType"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5 sm:space-y-2">
                            <FormLabel className="text-sm text-gray-300">Account Type</FormLabel>
                            <div className="flex space-x-3 sm:space-x-4">
                              <Button 
                                type="button" 
                                variant={field.value === "player" ? "default" : "outline"}
                                onClick={() => verificationForm.setValue("userType", "player")}
                                className={`flex-1 h-9 sm:h-10 text-xs sm:text-sm ${field.value === "player" ? "bg-lime-500 text-black" : "bg-dark-light text-gray-400 border-gray-700 hover:text-lime-400 hover:border-lime-500/30"}`}
                              >
                                Player
                              </Button>
                              <Button 
                                type="button" 
                                variant={field.value === "agent" ? "default" : "outline"}
                                onClick={() => verificationForm.setValue("userType", "agent")}
                                className={`flex-1 h-9 sm:h-10 text-xs sm:text-sm ${field.value === "agent" ? "bg-lime-500 text-black" : "bg-dark-light text-gray-400 border-gray-700 hover:text-lime-400 hover:border-lime-500/30"}`}
                              >
                                Agent
                              </Button>
                            </div>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full h-9 sm:h-10 mt-4 sm:mt-6 bg-dark-darker text-lime-400 border border-lime-500/30 hover:bg-lime-500 hover:text-black text-sm shadow-lg" 
                        disabled={verifyUsernameMutation.isPending}
                      >
                        {verifyUsernameMutation.isPending ? (
                          <>
                            <div className="animate-spin mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"></div>
                            Verifying...
                          </>
                        ) : (
                          "Verify Username"
                        )}
                      </Button>
                      
                      {verifyUsernameMutation.isError && (
                        <div className="text-red-400 text-xs sm:text-sm mt-2 p-2 bg-red-900/20 rounded border border-red-900/30">
                          {verifyUsernameMutation.error?.message || "Verification failed. Please check your username."}
                        </div>
                      )}
                    </form>
                  </Form>
                </div>
              </TabsContent>

              <TabsContent value="login">
                <div className="space-y-3 sm:space-y-4">
                  {verifiedUsername && (
                    <Alert className="mb-3 sm:mb-4 bg-dark-light border border-gray-700">
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 text-lime-400" />
                      <AlertDescription className="text-white text-xs sm:text-sm">
                        Username verified successfully. You can now <span className="text-lime-400">login</span> or <span className="text-lime-400">create a new account</span>.
                      </AlertDescription>
                    </Alert>
                  )}
                
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-3 sm:space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5 sm:space-y-2">
                            <FormLabel className="flex items-center text-sm text-gray-300">
                              <User className="h-3.5 w-3.5 mr-2 text-lime-400" />
                              Username
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your 747 casino username" 
                                {...field} 
                                disabled
                                className="h-9 sm:h-10 bg-dark-light text-gray-400 border-gray-700 text-sm"
                              />
                            </FormControl>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5 sm:space-y-2">
                            <FormLabel className="flex items-center text-sm text-gray-300">
                              <LockKeyhole className="h-3.5 w-3.5 mr-2 text-lime-400" />
                              Password
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Enter your password" 
                                {...field}
                                className="h-9 sm:h-10 bg-dark-light text-white border-gray-700 focus:border-lime-500/50 focus:ring-0 text-sm" 
                              />
                            </FormControl>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="userType"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5 sm:space-y-2">
                            <FormLabel className="text-sm text-gray-300">Account Type</FormLabel>
                            <div className="flex space-x-3 sm:space-x-4">
                              <Button 
                                type="button" 
                                variant={field.value === "player" ? "default" : "outline"}
                                disabled
                                className={`flex-1 h-9 sm:h-10 text-xs sm:text-sm ${field.value === "player" ? "bg-lime-500 text-black" : "bg-dark-light text-gray-400 border-gray-700"}`}
                              >
                                Player
                              </Button>
                              <Button 
                                type="button" 
                                variant={field.value === "agent" ? "default" : "outline"}
                                disabled
                                className={`flex-1 h-9 sm:h-10 text-xs sm:text-sm ${field.value === "agent" ? "bg-lime-500 text-black" : "bg-dark-light text-gray-400 border-gray-700"}`}
                              >
                                Agent
                              </Button>
                            </div>
                            <FormDescription className="text-center text-xs sm:text-sm text-gray-400">
                              {field.value === "player" ? "Player Account" : "Agent Account"}
                            </FormDescription>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full h-9 sm:h-10 mt-4 sm:mt-6 bg-dark-darker text-lime-400 border border-lime-500/30 hover:bg-lime-500 hover:text-black text-sm shadow-lg" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <div className="animate-spin mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"></div>
                            Logging in...
                          </>
                        ) : (
                          "Login"
                        )}
                      </Button>
                      
                      {loginMutation.isError && (
                        <div className="text-red-400 text-xs sm:text-sm mt-2 p-2 bg-red-900/20 rounded border border-red-900/30">
                          {loginMutation.error?.message || "Login failed. Please check your credentials."}
                        </div>
                      )}
                    </form>
                  </Form>
                </div>
              </TabsContent>

              <TabsContent value="register">
                <div className="space-y-3 sm:space-y-4">
                  {casinoVerificationData && (
                    <Alert className="mb-3 sm:mb-4 bg-dark-light border border-gray-700">
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 text-lime-400" />
                      <AlertDescription className="text-white text-xs sm:text-sm">
                        Your casino account details have been <span className="text-lime-400">verified</span> and will be linked to your new e-wallet account.
                      </AlertDescription>
                    </Alert>
                  )}
                
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3 sm:space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5 sm:space-y-2">
                            <FormLabel className="flex items-center text-sm text-gray-300">
                              <User className="h-3.5 w-3.5 mr-2 text-lime-400" />
                              Username
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Your existing 747 casino username" 
                                {...field} 
                                disabled
                                className="h-9 sm:h-10 bg-dark-light text-gray-400 border-gray-700 text-sm"
                              />
                            </FormControl>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5 sm:space-y-2">
                            <FormLabel className="flex items-center text-sm text-gray-300">
                              <LockKeyhole className="h-3.5 w-3.5 mr-2 text-lime-400" />
                              Password
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Create a secure password" 
                                {...field}
                                className="h-9 sm:h-10 bg-dark-light text-white border-gray-700 focus:border-lime-500/50 focus:ring-0 text-sm" 
                              />
                            </FormControl>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />

                      {/* Hidden fields - not visible to users but included in form submission */}
                      <FormField
                        control={registerForm.control}
                        name="clientId"
                        render={({ field }) => (
                          <input type="hidden" {...field} />
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="topManager"
                        render={({ field }) => (
                          <input type="hidden" {...field} />
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="immediateManager"
                        render={({ field }) => (
                          <input type="hidden" {...field} />
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="casinoUserType"
                        render={({ field }) => (
                          <input type="hidden" {...field} />
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5 sm:space-y-2">
                            <FormLabel className="flex items-center text-sm text-gray-300">
                              <AtSign className="h-3.5 w-3.5 mr-2 text-lime-400" />
                              Email
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder="Enter your email address" 
                                {...field}
                                className="h-9 sm:h-10 bg-dark-light text-white border-gray-700 focus:border-lime-500/50 focus:ring-0 text-sm" 
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-gray-400">
                              Required for account verification and transaction notifications
                            </FormDescription>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                      
                      {/* Casino Account Details */}
                      {casinoVerificationData && (
                        <div className="mt-3 sm:mt-4 p-3 bg-dark-light rounded-lg border border-gray-700">
                          <h4 className="text-xs sm:text-sm font-medium text-white mb-2">Casino Account Details</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                            {casinoVerificationData.userType && (
                              <div>
                                <span className="text-gray-400">Account Type:</span>
                                <Badge className="ml-2 bg-dark-darker text-lime-400 border border-lime-500/30 text-xs">
                                  {casinoVerificationData.userType}
                                </Badge>
                              </div>
                            )}
                            {casinoVerificationData.topManager && (
                              <div>
                                <span className="text-gray-400">Top Manager:</span>
                                <span className="ml-2 font-medium text-white">{casinoVerificationData.topManager}</span>
                              </div>
                            )}
                            {casinoVerificationData.immediateManager && (
                              <div>
                                <span className="text-gray-400">Manager:</span>
                                <span className="ml-2 font-medium text-white">{casinoVerificationData.immediateManager}</span>
                              </div>
                            )}
                            {casinoVerificationData.clientId && (
                              <div>
                                <span className="text-gray-400">Client ID:</span>
                                <span className="ml-2 font-medium text-white">{casinoVerificationData.clientId}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <Button 
                        type="submit" 
                        className="w-full h-9 sm:h-10 mt-4 sm:mt-6 bg-dark-darker text-lime-400 border border-lime-500/30 hover:bg-lime-500 hover:text-black text-sm shadow-lg" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <div className="animate-spin mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"></div>
                            Creating Account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                      
                      {registerMutation.isError && (
                        <div className="text-red-400 text-xs sm:text-sm mt-2 p-2 bg-red-900/20 rounded border border-red-900/30">
                          {registerMutation.error?.message || "Registration failed. Please try again."}
                        </div>
                      )}
                    </form>
                  </Form>
                </div>
              </TabsContent>
            </CardContent>
            
            <CardFooter className="flex flex-col items-center p-4 sm:p-6 pb-6 bg-dark-light border-t border-gray-800 rounded-b-lg">
              {verifiedUsername && (
                <>
                  {activeTab === "login" && (
                    <p className="text-xs sm:text-sm text-gray-400">
                      Don't have an account?{" "}
                      <button
                        onClick={() => setActiveTab("register")}
                        className="text-lime-400 hover:text-lime-300 underline transition-colors"
                      >
                        Register here
                      </button>
                    </p>
                  )}
                  
                  {activeTab === "register" && (
                    <p className="text-xs sm:text-sm text-gray-400">
                      Already have an account?{" "}
                      <button
                        onClick={() => setActiveTab("login")}
                        className="text-lime-400 hover:text-lime-300 underline transition-colors"
                      >
                        Log in instead
                      </button>
                    </p>
                  )}
                  
                  <div className="w-full mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700">
                    <Button
                      onClick={goBackToVerification}
                      variant="outline"
                      className="w-full h-9 sm:h-10 text-xs sm:text-sm text-gray-400 bg-dark-darker border border-gray-700 hover:border-lime-500/30 hover:text-lime-400 transition-all duration-200"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 text-gray-500" />
                      Verify Different Username
                    </Button>
                  </div>
                </>
              )}
            </CardFooter>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}