import React, { useState, useEffect } from 'react';
import { useLocation, useRoute, Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Eye, EyeOff, ArrowLeft, ChevronRight, 
  CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

// Form schemas
const usernameVerificationSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" })
});

const loginSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" })
});

const registerSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
  email: z.string().email({ message: "Please enter a valid email" })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type UsernameVerificationFormValues = z.infer<typeof usernameVerificationSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function MobileAuthPage() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState<'username' | 'login' | 'register'>('username');
  const [verifiedUsername, setVerifiedUsername] = useState('');
  const [verificationResponse, setVerificationResponse] = useState<any>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Username verification form
  const usernameForm = useForm<UsernameVerificationFormValues>({
    resolver: zodResolver(usernameVerificationSchema),
    defaultValues: {
      username: ''
    }
  });

  // Login form 
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      email: ''
    }
  });

  // Update form values when verified username changes
  useEffect(() => {
    if (verifiedUsername) {
      loginForm.setValue('username', verifiedUsername);
      registerForm.setValue('username', verifiedUsername);

      console.log('Setting verified username and casino details');
      
      // Apply casino details from verification response to registration form
      if (verificationResponse) {
        console.log('Verification response details:', verificationResponse);
        
        // We'll pass these values directly in the mutation, don't need to set them as form values
        // since they're not input fields in the form schema
      }
    }
  }, [verifiedUsername, verificationResponse, loginForm, registerForm]);

  // Username verification mutation
  const verifyUsernameMutation = useMutation({
    mutationFn: async (data: UsernameVerificationFormValues) => {
      setIsLoading(true);
      try {
        // Add userType defaulting to "player"
        const requestData = {
          ...data,
          userType: "player" // Mobile flow always uses player type
        };
        
        console.log('Verifying username with data:', JSON.stringify(requestData, null, 2));
        
        const response = await fetch('/api/auth/verify-username', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });
        
        const responseData = await response.json();
        console.log('Username verification response:', JSON.stringify(responseData, null, 2));
        
        if (!response.ok) {
          throw new Error(responseData.message || 'Failed to verify username');
        }
        
        return responseData;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (data) => {
      setVerifiedUsername(usernameForm.getValues().username);
      setVerificationResponse(data);
      
      // Add haptic feedback on successful verification
      const haptic = window.navigator as any;
      if (haptic.vibrate) {
        haptic.vibrate(50);
      }
      
      if (data.accountExists) {
        console.log('Account exists, directing to login');
        setCurrentStep('login');
      } else {
        console.log('New account, directing to registration');
        setCurrentStep('register');
      }
    },
    onError: (error: Error) => {
      console.error('Verification error:', error);
      
      // Vibrate for error (longer pattern)
      const haptic = window.navigator as any;
      if (haptic.vibrate) {
        haptic.vibrate([100, 50, 100]);
      }
    }
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      setIsLoading(true);
      try {
        // Add userType for consistent API
        const loginData = {
          ...data,
          userType: "player" // Mobile flow always uses player type
        };
        
        console.log('Submitting login with session-based auth:', loginData.username);
        
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(loginData),
          credentials: 'include' // Important for session cookies
        });
        
        const responseData = await response.json();
        console.log('Login response status:', response.status);
        
        if (!response.ok) {
          throw new Error(responseData.message || 'Login failed');
        }
        
        return responseData;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (data) => {
      console.log('Login successful, redirecting to mobile dashboard');
      
      // Add haptic feedback on successful login
      const haptic = window.navigator as any;
      if (haptic.vibrate) {
        haptic.vibrate(100);
      }
      
      // Set redirect flag in session storage then redirect
      sessionStorage.setItem("redirectToMobile", "true");
      window.location.href = '/mobile/dashboard';
    },
    onError: (error: Error) => {
      console.error('Login error:', error);
      
      // Vibrate for error (longer pattern)
      const haptic = window.navigator as any;
      if (haptic.vibrate) {
        haptic.vibrate([100, 50, 100]);
      }
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormValues) => {
      setIsLoading(true);
      try {
        // Add casino data from verification if available
        // Use defaults for userType if not explicitly provided
        const registerData = {
          ...data,
          userType: "player", // Mobile flow always uses player type
          casinoUsername: verificationResponse?.casinoUsername || undefined,
          clientId: verificationResponse?.clientId || undefined,
          topManager: verificationResponse?.topManager || undefined,
          immediateManager: verificationResponse?.immediateManager || undefined,
          casinoUserType: verificationResponse?.userType || undefined // Note: casinoUserType not userType
        };
        
        console.log('Registration data:', JSON.stringify(registerData, null, 2));
        
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(registerData),
          credentials: 'include' // Important for session cookies
        });
        
        const responseData = await response.json();
        console.log('Registration response status:', response.status, responseData);
        
        if (!response.ok) {
          throw new Error(responseData.message || 'Registration failed');
        }
        
        return responseData;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (data) => {
      console.log('Registration successful, redirecting to mobile dashboard');
      
      // Add haptic feedback on successful registration
      const haptic = window.navigator as any;
      if (haptic.vibrate) {
        haptic.vibrate(100);
      }
      
      // Set redirect flag in session storage then redirect
      sessionStorage.setItem("redirectToMobile", "true");
      window.location.href = '/mobile/dashboard';
    },
    onError: (error: Error) => {
      console.error('Registration error:', error);
      
      // Vibrate for error (longer pattern)
      const haptic = window.navigator as any;
      if (haptic.vibrate) {
        haptic.vibrate([100, 50, 100]);
      }
    }
  });

  // Form submit handlers
  const onVerifySubmit = (data: UsernameVerificationFormValues) => {
    verifyUsernameMutation.mutate(data);
  };

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001138] to-[#002D87] text-white">
      {/* Top area with logo and back button */}
      <div className="pt-12 px-6 pb-8">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => {
              if (currentStep === 'login' || currentStep === 'register') {
                setCurrentStep('username');
              } else {
                navigate('/');
              }
            }}
            className="w-auto h-10 flex items-center justify-center px-3 rounded-full bg-white/10 backdrop-blur-md"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-white mr-1" />
            <span className="text-sm font-medium">Back</span>
          </button>
          
          <div className="text-xl font-semibold tracking-wide">
            {currentStep === 'username' ? 'Sign In' : 
             currentStep === 'login' ? 'Login' : 'Create Account'}
          </div>
          
          <div className="w-10">
            {/* Spacer for alignment */}
          </div>
        </div>
        
        {/* 747 Logo with enhanced glow effect */}
        <div className="flex justify-center mt-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-yellow-400/30 blur-xl transform scale-110"></div>
            <div className="absolute inset-0 rounded-full bg-white/20 blur-md"></div>
            <img 
              src="/assets/logos/747-logo.png" 
              alt="747 Logo" 
              className="h-16 object-contain relative z-10 drop-shadow-lg"
            />
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="px-6">
        <AnimatePresence mode="wait">
          {currentStep === 'username' && (
            <motion.div
              key="username-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold mb-2">747 E-Loading Wallet</h1>
                <p className="text-white/70">Enter your username to continue</p>
              </div>
              
              <form onSubmit={usernameForm.handleSubmit(onVerifySubmit)} className="space-y-6">
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Username"
                      {...usernameForm.register('username')}
                      className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    {usernameForm.formState.errors.username && (
                      <div className="text-red-400 text-sm mt-1 ml-1">
                        {usernameForm.formState.errors.username.message}
                      </div>
                    )}
                  </div>
                </div>
                
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading || !usernameForm.formState.isValid}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 disabled:text-white/50 rounded-xl py-4 font-medium shadow-lg flex items-center justify-center relative overflow-hidden with-ripple"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Next <ChevronRight className="ml-1 h-5 w-5" />
                    </>
                  )}
                </motion.button>
              </form>
              
              <div className="pt-8 text-center">
                <p className="text-white/60 text-sm">
                  Don't have an account? Enter your username and we'll help you create one.
                </p>
              </div>
            </motion.div>
          )}

          {currentStep === 'login' && (
            <motion.div
              key="login-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold mb-2">747 E-Loading Wallet</h1>
                <p className="text-white/70">Enter your password to sign in</p>
              </div>
              
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-4 flex items-center">
                    <div className="flex-1 opacity-70">
                      {verifiedUsername}
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  
                  <div className="relative">
                    <input
                      type={passwordVisible ? "text" : "password"}
                      placeholder="Password"
                      {...loginForm.register('password')}
                      className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70"
                    >
                      {passwordVisible ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                    {loginForm.formState.errors.password && (
                      <div className="text-red-400 text-sm mt-1 ml-1">
                        {loginForm.formState.errors.password.message}
                      </div>
                    )}
                  </div>
                </div>
                
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading || !loginForm.formState.isValid}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 disabled:text-white/50 rounded-xl py-4 font-medium shadow-lg flex items-center justify-center relative overflow-hidden with-ripple"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Sign In"
                  )}
                </motion.button>
                
                {loginMutation.error && (
                  <div className="bg-red-500/20 border border-red-500/30 text-white rounded-lg p-3 text-sm flex items-start">
                    <XCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{loginMutation.error.message}</span>
                  </div>
                )}
              </form>
            </motion.div>
          )}

          {currentStep === 'register' && (
            <motion.div
              key="register-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold mb-2">747 E-Loading Wallet</h1>
                <p className="text-white/70">Choose a password for your new account</p>
              </div>
              
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-4 flex items-center">
                      <div className="flex-1 opacity-70">
                        {verifiedUsername}
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    
                    {verificationResponse && (
                      <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-3 text-sm text-white/80">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-xs text-white/50 mb-1">Top Manager</div>
                            <div className="font-medium">{verificationResponse.topManager || '-'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-white/50 mb-1">Immediate Manager</div>
                            <div className="font-medium">{verificationResponse.immediateManager || '-'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-white/50 mb-1">User Type</div>
                            <div className="font-medium">{verificationResponse.userType || 'player'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-white/50 mb-1">Client ID</div>
                            <div className="font-medium">{verificationResponse.clientId || '-'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <input
                      type={passwordVisible ? "text" : "password"}
                      placeholder="Create Password"
                      {...registerForm.register('password')}
                      className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70"
                    >
                      {passwordVisible ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                    {registerForm.formState.errors.password && (
                      <div className="text-red-400 text-sm mt-1 ml-1">
                        {registerForm.formState.errors.password.message}
                      </div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <input
                      type={confirmPasswordVisible ? "text" : "password"}
                      placeholder="Confirm Password"
                      {...registerForm.register('confirmPassword')}
                      className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70"
                    >
                      {confirmPasswordVisible ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                    {registerForm.formState.errors.confirmPassword && (
                      <div className="text-red-400 text-sm mt-1 ml-1">
                        {registerForm.formState.errors.confirmPassword.message}
                      </div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Email Address"
                      {...registerForm.register('email')}
                      className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    {registerForm.formState.errors.email && (
                      <div className="text-red-400 text-sm mt-1 ml-1">
                        {registerForm.formState.errors.email.message}
                      </div>
                    )}
                  </div>
                </div>
                
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading || !registerForm.formState.isValid}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 disabled:text-white/50 rounded-xl py-4 font-medium shadow-lg flex items-center justify-center relative overflow-hidden with-ripple"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Create Account"
                  )}
                </motion.button>
                
                {registerMutation.error && (
                  <div className="bg-red-500/20 border border-red-500/30 text-white rounded-lg p-3 text-sm flex items-start">
                    <XCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{registerMutation.error.message}</span>
                  </div>
                )}
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-blue-900/30 to-transparent" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full filter blur-3xl -mr-32 -mb-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full filter blur-3xl -ml-32 -mb-32" />
      </div>
    </div>
  );
}