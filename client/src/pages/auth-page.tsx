import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Check, X, Info } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
// Let's use a simple emoji instead since the logo is not directly accessible
const logo = "💼";

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
  email: z.string().email({ message: "Please enter a valid email" }).optional(),
  userType: z.enum(["player", "agent"]).default("player"),
  // Read-only casino information fields (not actually sent in the request, but displayed)
  topManager: z.string().optional(),
  immediateManager: z.string().optional(),
  casinoUserType: z.string().optional()
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
      navigate("/");
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
      loginForm.setValue("username", verifiedUsername);
      loginForm.setValue("userType", verifiedUserType);
      registerForm.setValue("username", verifiedUsername);
      registerForm.setValue("userType", verifiedUserType);
    }
  }, [verifiedUsername, verifiedUserType, loginForm, registerForm]);

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
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
    <div className="min-h-screen flex">
      {/* Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center text-center">
            <div className="text-4xl mb-4">{logo}</div>
            <h1 className="text-2xl font-bold">747 Casino E-Wallet</h1>
            <p className="text-muted-foreground">Manage your casino payments seamlessly</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="verification" disabled={!!verifiedUsername}>Verify</TabsTrigger>
              <TabsTrigger value="login" disabled={!verifiedUsername}>Login</TabsTrigger>
              <TabsTrigger value="register" disabled={!verifiedUsername}>Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="verification">
              <Card>
                <CardHeader>
                  <CardTitle>Verify Casino Username</CardTitle>
                  <CardDescription>
                    First, verify if your 747 Casino account is eligible to use this platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...verificationForm}>
                    <form onSubmit={verificationForm.handleSubmit(onVerifySubmit)} className="space-y-4">
                      <FormField
                        control={verificationForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your 747 Casino username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={verificationForm.control}
                        name="userType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Type</FormLabel>
                            <div className="flex space-x-4">
                              <Button 
                                type="button" 
                                variant={field.value === "player" ? "default" : "outline"}
                                onClick={() => verificationForm.setValue("userType", "player")}
                                className="flex-1"
                              >
                                Player
                              </Button>
                              <Button 
                                type="button" 
                                variant={field.value === "agent" ? "default" : "outline"}
                                onClick={() => verificationForm.setValue("userType", "agent")}
                                className="flex-1"
                              >
                                Agent
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full mt-6" disabled={verifyUsernameMutation.isPending}>
                        {verifyUsernameMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Verify Username"
                        )}
                      </Button>
                      
                      {verifyUsernameMutation.isError && (
                        <div className="text-destructive text-sm mt-2">
                          {verifyUsernameMutation.error?.message || "Verification failed. Please check your username."}
                        </div>
                      )}
                      
                      <div className="mt-4 text-xs text-muted-foreground">
                        <p className="mb-2">To use this e-wallet platform, you must be a player or agent under:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li><strong className="text-primary">Marcthepogi</strong></li>
                          <li><strong className="text-primary">bossmarc747</strong></li>
                          <li><strong className="text-primary">teammarc</strong></li>
                        </ul>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Account Login</CardTitle>
                  <CardDescription>
                    Enter your casino credentials to access your e-wallet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your 747 casino username" 
                                {...field} 
                                disabled
                                className="bg-muted/50"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="userType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Type</FormLabel>
                            <div className="flex space-x-4">
                              <Button 
                                type="button" 
                                variant={field.value === "player" ? "default" : "outline"}
                                disabled
                                className={`flex-1 ${field.value !== "player" ? "opacity-50" : ""}`}
                              >
                                Player
                              </Button>
                              <Button 
                                type="button" 
                                variant={field.value === "agent" ? "default" : "outline"}
                                disabled
                                className={`flex-1 ${field.value !== "agent" ? "opacity-50" : ""}`}
                              >
                                Agent
                              </Button>
                            </div>
                            <FormDescription className="text-center">
                              {field.value === "player" ? "Player Account" : "Agent Account"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full mt-6" disabled={loginMutation.isPending}>
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : (
                          "Login"
                        )}
                      </Button>
                      
                      {loginMutation.isError && (
                        <div className="text-destructive text-sm mt-2">
                          {loginMutation.error?.message || "Login failed. Please check your credentials."}
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 items-center">
                  <p className="text-xs text-muted-foreground">
                    Don't have an account?{" "}
                    <button
                      onClick={() => setActiveTab("register")}
                      className="text-primary underline"
                    >
                      Register here
                    </button>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Not your username?{" "}
                    <button
                      onClick={goBackToVerification}
                      className="text-primary underline"
                    >
                      Change username
                    </button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Register your 747 Casino account with our e-wallet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Your existing 747 casino username" 
                                {...field} 
                                disabled
                                className="bg-muted/50"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Create a secure password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your email address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="userType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Type</FormLabel>
                            <div className="flex space-x-4">
                              <Button 
                                type="button" 
                                variant={field.value === "player" ? "default" : "outline"}
                                disabled
                                className={`flex-1 ${field.value !== "player" ? "opacity-50" : ""}`}
                              >
                                Player
                              </Button>
                              <Button 
                                type="button" 
                                variant={field.value === "agent" ? "default" : "outline"}
                                disabled
                                className={`flex-1 ${field.value !== "agent" ? "opacity-50" : ""}`}
                              >
                                Agent
                              </Button>
                            </div>
                            <FormDescription className="text-center">
                              {field.value === "player" ? "Player Account" : "Agent Account"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full mt-6" disabled={registerMutation.isPending}>
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registering...
                          </>
                        ) : (
                          "Register"
                        )}
                      </Button>

                      {registerMutation.isError && (
                        <div className="text-destructive text-sm mt-2">
                          {registerMutation.error?.message || "Registration failed. Please try again."}
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 items-center">
                  <p className="text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      onClick={() => setActiveTab("login")}
                      className="text-primary underline"
                    >
                      Login here
                    </button>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Not your username?{" "}
                    <button
                      onClick={goBackToVerification}
                      className="text-primary underline"
                    >
                      Change username
                    </button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/10 flex-col items-center justify-center p-12">
        <div className="max-w-xl space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold">Welcome to 747 Casino E-Wallet</h2>
            <p className="text-muted-foreground">
              The secure way to manage your casino funds and transactions
            </p>
          </div>

          <div className="grid gap-4">
            <div className="bg-background rounded-lg p-4 shadow">
              <h3 className="font-medium">✅ Instant Deposits</h3>
              <p className="text-sm text-muted-foreground">Top up your casino balance instantly via GCash QR payments</p>
            </div>
            
            <div className="bg-background rounded-lg p-4 shadow">
              <h3 className="font-medium">✅ Secure Withdrawals</h3>
              <p className="text-sm text-muted-foreground">Withdraw your winnings directly to your e-wallet</p>
            </div>
            
            <div className="bg-background rounded-lg p-4 shadow">
              <h3 className="font-medium">✅ Transaction History</h3>
              <p className="text-sm text-muted-foreground">Track all your deposits, withdrawals, and transfers</p>
            </div>

            <div className="bg-background rounded-lg p-4 shadow">
              <h3 className="font-medium">✅ Agent Management</h3>
              <p className="text-sm text-muted-foreground">Agents can view and manage their downlines</p>
            </div>
          </div>

          <div className="flex justify-center">
            <p className="text-sm text-center max-w-sm text-muted-foreground">
              This platform is exclusively for players and agents under 
              <strong className="font-bold text-primary"> Marcthepogi</strong>, 
              <strong className="font-bold text-primary"> bossmarc747</strong>, and 
              <strong className="font-bold text-primary"> teammarc</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}