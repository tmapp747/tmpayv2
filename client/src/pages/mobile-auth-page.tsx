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
  confirmPassword: z.string()
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
      confirmPassword: ''
    }
  });

  // Update form values when verified username changes
  useEffect(() => {
    if (verifiedUsername) {
      loginForm.setValue('username', verifiedUsername);
      registerForm.setValue('username', verifiedUsername);
    }
  }, [verifiedUsername]);

  // Username verification mutation
  const verifyUsernameMutation = useMutation({
    mutationFn: async (data: UsernameVerificationFormValues) => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/verify-username', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to verify username');
        }
        
        return await response.json();
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (data) => {
      setVerifiedUsername(usernameForm.getValues().username);
      setVerificationResponse(data);
      
      if (data.accountExists) {
        setCurrentStep('login');
      } else {
        setCurrentStep('register');
      }
    },
    onError: (error: Error) => {
      console.error('Verification error:', error);
    }
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Login failed');
        }
        
        return await response.json();
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      navigate('/mobile');
    },
    onError: (error: Error) => {
      console.error('Login error:', error);
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormValues) => {
      setIsLoading(true);
      try {
        // Add casino data from verification if available
        const registerData = {
          ...data,
          casinoUsername: verificationResponse?.casinoUsername || undefined,
          clientId: verificationResponse?.clientId || undefined,
          topManager: verificationResponse?.topManager || undefined,
          immediateManager: verificationResponse?.immediateManager || undefined,
          userType: verificationResponse?.userType || undefined
        };
        
        console.log('Registration data:', JSON.stringify(registerData));
        
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(registerData)
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
          throw new Error(responseData.message || 'Registration failed');
        }
        
        return responseData;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      navigate('/mobile');
    },
    onError: (error: Error) => {
      console.error('Registration error:', error);
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
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          
          <div className="text-xl font-semibold tracking-wide">
            {currentStep === 'username' ? 'Sign In' : 
             currentStep === 'login' ? 'Welcome Back' : 'Create Account'}
          </div>
          
          <div className="w-10">
            {/* Spacer for alignment */}
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
                <h1 className="text-2xl font-semibold mb-2">Welcome</h1>
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
                <h1 className="text-2xl font-semibold mb-2">Welcome Back</h1>
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
                <h1 className="text-2xl font-semibold mb-2">Create Account</h1>
                <p className="text-white/70">Choose a password for your new account</p>
              </div>
              
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-4 flex items-center">
                    <div className="flex-1 opacity-70">
                      {verifiedUsername}
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-400" />
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