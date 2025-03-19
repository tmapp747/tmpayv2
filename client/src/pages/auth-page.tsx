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
import { useTheme } from "@/hooks/use-theme";

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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  ArrowLeft,
  UserCheck,
  UserPlus,
  ChevronLeft,
  Info
} from "lucide-react";

// SVG Casino logo
const CasinoLogo = () => (
  <div className="w-12 h-12 overflow-hidden">
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <circle cx="100" cy="100" r="90" fill="#1a2b47" />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#b78628" fontSize="60" fontWeight="bold">747</text>
    </svg>
  </div>
);

// Types for the casino API verification response
interface CasinoVerificationResponse {
  success: boolean;
  message: string;
  topManager?: string;
  immediateManager?: string;
  userType?: string;
  clientId?: number;
  accountExists?: boolean; // Flag indicating if the account already exists in our database
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
  email: z.string().email({ message: "Please enter a valid email" }), 
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
  // Simplified state management - steps instead of tabs
  const [step, setStep] = useState<"welcome" | "verification" | "login" | "register">("welcome");
  const [verifiedUsername, setVerifiedUsername] = useState<string>("");
  const [verifiedUserType, setVerifiedUserType] = useState<"player" | "agent">("player");
  const [casinoVerificationData, setCasinoVerificationData] = useState<CasinoVerificationResponse | null>(null);
  
  const { toast } = useToast();
  const { theme } = useTheme();
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
        description: data.message,
        variant: "default",
      });
      
      // Direct to the appropriate step based on whether the account exists
      if (data.accountExists) {
        console.log("Account already exists, directing to login");
        setStep("login");
      } else {
        console.log("New account, directing to registration");
        setStep("register");
      }
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
        }
      }
    }
  }, [verifiedUsername, verifiedUserType, casinoVerificationData, loginForm, registerForm]);

  const onLoginSubmit = (data: LoginFormValues) => {
    console.log("Submitting login with session-based auth:", data.username);
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    console.log("Submitting registration form with data:", JSON.stringify(data, null, 2));
    registerMutation.mutate(data);
  };
  
  const goBackToVerification = () => {
    setVerifiedUsername("");
    setVerifiedUserType("player");
    setStep("verification");
  };

  // Don't render anything if user is logged in
  if (!shouldRender) {
    return null;
  }

  // Render welcome page with account type selection
  const renderWelcomePage = () => (
    <CardContent className="p-6 space-y-6">
      <div className="flex justify-center space-x-6">
        <Button
          onClick={() => {
            verificationForm.setValue("userType", "player");
            setStep("verification");
          }}
          className="flex-1 h-40 flex flex-col items-center justify-center space-y-4 bg-muted hover:bg-primary/10 border-2 border-border hover:border-primary/30"
        >
          <User className="h-12 w-12 text-primary" />
          <div className="text-center">
            <div className="font-medium mb-1">Player Account</div>
            <div className="text-xs text-muted-foreground">For casino players</div>
          </div>
        </Button>
        <Button
          onClick={() => {
            verificationForm.setValue("userType", "agent");
            setStep("verification");
          }}
          className="flex-1 h-40 flex flex-col items-center justify-center space-y-4 bg-muted hover:bg-primary/10 border-2 border-border hover:border-primary/30"
        >
          <UserCheck className="h-12 w-12 text-primary" />
          <div className="text-center">
            <div className="font-medium mb-1">Agent Account</div>
            <div className="text-xs text-muted-foreground">For casino agents</div>
          </div>
        </Button>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account? Click on the account type above to continue.
        </p>
      </div>
    </CardContent>
  );

  // Render username verification page
  const renderVerificationPage = () => (
    <CardContent className="p-6">
      {verificationForm.getValues("userType") === "player" ? (
        <Alert className="mb-4 bg-primary/10 border border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            Enter your 747 Casino player username to continue
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-4 bg-primary/10 border border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            Enter your 747 Casino agent username to continue
          </AlertDescription>
        </Alert>
      )}

      <Form {...verificationForm}>
        <form onSubmit={verificationForm.handleSubmit(onVerifySubmit)} className="space-y-4">
          <FormField
            control={verificationForm.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={`Enter your 747 Casino ${verificationForm.getValues("userType")} username`} 
                    {...field}
                    className="border-input"
                  />
                </FormControl>
                <FormDescription>
                  This should be the same username you use on the 747 Casino platform
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={verifyUsernameMutation.isPending}
            >
              {verifyUsernameMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>Verify Username</>
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={() => setStep("welcome")}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          
          {verifyUsernameMutation.isError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>
                {verifyUsernameMutation.error?.message || "Verification failed. Please check your username."}
              </AlertDescription>
            </Alert>
          )}
        </form>
      </Form>
    </CardContent>
  );

  // Render login page
  const renderLoginPage = () => (
    <CardContent className="p-6">
      <Alert className="mb-4 bg-primary/10 border border-primary/20">
        <Check className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          Username <span className="font-medium">{verifiedUsername}</span> verified successfully
        </AlertDescription>
      </Alert>

      <Form {...loginForm}>
        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
          <FormField
            control={loginForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="Enter your password" 
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>Sign In</>
              )}
            </Button>
            
            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={goBackToVerification}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={() => setStep("register")}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account
              </Button>
            </div>
          </div>
          
          {loginMutation.isError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>
                {loginMutation.error?.message || "Login failed. Please check your credentials."}
              </AlertDescription>
            </Alert>
          )}
        </form>
      </Form>
    </CardContent>
  );

  // Render registration page
  const renderRegisterPage = () => (
    <CardContent className="p-6">
      <Alert className="mb-4 bg-primary/10 border border-primary/20">
        <Check className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          Create a new account linked to your 747 Casino username
        </AlertDescription>
      </Alert>

      <Form {...registerForm}>
        <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
          <FormField
            control={registerForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Create Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="Create a secure password" 
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  At least 6 characters long
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={registerForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="Enter your email address" 
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Used for account recovery and notifications
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>Create Account</>
              )}
            </Button>
            
            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={goBackToVerification}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={() => setStep("login")}
              >
                Already have an account
              </Button>
            </div>
          </div>
          
          {registerMutation.isError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>
                {registerMutation.error?.message || "Registration failed. Please try again."}
              </AlertDescription>
            </Alert>
          )}
        </form>
      </Form>
    </CardContent>
  );

  return (
    <div className={`min-h-screen flex flex-col ${theme === "dark" ? "dark" : "light"} bg-background text-foreground`}>
      {/* Simple minimal header */}
      <header className="h-16 border-b border-border shadow-sm flex items-center justify-between px-4 md:px-6 z-20 bg-card text-card-foreground">
        <Link href="/">
          <div className="flex items-center space-x-2">
            <CasinoLogo />
            <span className="font-medium text-base sm:text-lg">747 E-Wallet</span>
          </div>
        </Link>
        
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <Link href="/">
            <Button variant="outline" size="sm" className="text-sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
        </div>
      </header>
      
      {/* Auth Container - main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Card className="w-full border shadow-md">
            <CardHeader className="space-y-1 pb-2">
              <div className="flex justify-center mb-2">
                <CasinoLogo />
              </div>
              <CardTitle className="text-center text-xl font-semibold">
                {step === "welcome" && "Welcome to 747 E-Wallet"}
                {step === "verification" && "Verify Your Username"}
                {step === "login" && "Sign In"}
                {step === "register" && "Create an Account"}
              </CardTitle>
              <CardDescription className="text-center text-sm">
                {step === "welcome" && "Manage your casino finances securely"}
                {step === "verification" && "Enter your 747 Casino username to continue"}
                {step === "login" && "Sign in with your verified username"}
                {step === "register" && "Create a new account with your verified casino username"}
              </CardDescription>
            </CardHeader>
            
            {step === "welcome" && renderWelcomePage()}
            {step === "verification" && renderVerificationPage()}
            {step === "login" && renderLoginPage()}
            {step === "register" && renderRegisterPage()}
          </Card>
        </div>
      </div>
    </div>
  );
}