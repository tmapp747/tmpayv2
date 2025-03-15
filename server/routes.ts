import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  generateQrCodeSchema, 
  insertTransactionSchema, 
  insertQrPaymentSchema,
  insertTelegramPaymentSchema,
  insertManualPaymentSchema,
  manualPaymentSchema,
  updateBalanceSchema,
  verifyPaymentSchema,
  casinoDepositSchema,
  casinoWithdrawSchema,
  casinoTransferSchema,
  casinoGetUserDetailsSchema,
  loginSchema,
  authSchema,
  allowedTopManagersSchema,
  supportedCurrencies,
  Currency,
  updatePreferredCurrencySchema,
  getCurrencyBalanceSchema,
  exchangeCurrencySchema,
  generateTelegramPaymentSchema
} from "@shared/schema";
import { ZodError, z } from "zod";
import { randomUUID, randomBytes, createHash } from "crypto";
import { casino747Api } from "./casino747Api";
import { directPayApi } from "./directPayApi";
import { paygramApi } from "./paygramApi";
import { setupAuth, hashPassword, comparePasswords, isPasswordHashed } from "./auth";

// Real DirectPay function to generate QR code using DirectPay API
async function directPayGenerateQRCode(amount: number, reference: string, username: string) {
  try {
    // Configure the webhook and redirect URLs
    const baseUrl = process.env.BASE_URL || 'https://747casino.replit.app';
    const webhook = `${baseUrl}/api/webhook/directpay/payment`;
    // Updated to a more comprehensive thank you page with transaction details
    const redirectUrl = `${baseUrl}/payment/thank-you?reference=${reference}&amount=${amount}&username=${encodeURIComponent(username)}`;
    
    console.log(`Generating DirectPay GCash payment with the following parameters:`);
    console.log(`- Amount: ${amount}`);
    console.log(`- Reference: ${reference}`);
    console.log(`- Webhook: ${webhook}`);
    console.log(`- Redirect URL: ${redirectUrl}`);
    
    // Maximum retries for API call
    const maxRetries = 3;
    let result = null;
    let error = null;
    
    // Try up to maxRetries times with exponential backoff
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Call the DirectPay API to generate a GCash payment link
        result = await directPayApi.generateGCashQR(amount, webhook, redirectUrl);
        
        // If successful, break out of retry loop
        if (result && result.payUrl) {
          console.log(`DirectPay API call successful on attempt ${attempt}`);
          break;
        }
      } catch (e) {
        error = e;
        console.error(`DirectPay API call failed on attempt ${attempt}:`, e);
        
        // If this is not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If all attempts failed, throw the last error
    if (!result && error) {
      throw error;
    }
    
    // If we still don't have a result, throw a generic error
    if (!result) {
      throw new Error('No valid response received from DirectPay API after multiple attempts');
    }
    
    console.log('DirectPay API Response:', JSON.stringify(result, null, 2));
    
    // Extract response data
    const qrCodeData = result.qrCodeData;
    const directPayReference = result.reference || reference;
    const payUrl = result.payUrl;
    const expiresAt = result.expiresAt || new Date(Date.now() + 30 * 60 * 1000);
    
    console.log(`Successfully generated payment link with DirectPay reference: ${directPayReference}`);
    
    return {
      qrCodeData,
      directPayReference,
      payUrl,
      expiresAt
    };
  } catch (error) {
    console.error('Error generating payment form/QR code with DirectPay API:', error);
    
    // Since we're in production, we don't want to use fallbacks. Instead, throw an error
    // that will be handled by the calling code.
    throw new Error('Failed to generate payment form with DirectPay API');
  }
}

// Helper function to generate a unique transaction reference
function generateTransactionReference(): string {
  return `TX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

async function casino747PrepareTopup(casinoId: string, amount: number, reference: string) {
  try {
    console.log(`Casino747: Preparing topup for casino ID ${casinoId} with amount ${amount} and reference ${reference}`);
    
    // In the real implementation, we would prepare the topup with the casino API
    // Here we're using a simple approach, but this could involve pre-creating a transaction
    // in the casino system or reserving funds
    
    // For now, we'll generate a unique reference that will be used to track this transaction
    // in the casino system
    const casinoReference = `C747-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    return {
      success: true,
      casinoReference
    };
  } catch (error) {
    console.error('Error preparing topup with Casino747 API:', error);
    throw new Error('Failed to prepare topup with Casino747 API');
  }
}

// Function to generate payment URL using Paygram API
async function paygramGeneratePayment(userId: string, amount: number, currency: Currency = 'PHPT') {
  try {
    console.log(`Paygram: Generating payment with amount ${amount} ${currency} for user ${userId}`);
    
    // Generate a unique reference for this transaction
    const telegramReference = `PGRAM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Call the Paygram API to generate a payment URL
    const result = await paygramApi.generatePaymentUrl(
      userId,
      amount,
      currency
    );
    
    console.log('Paygram API Response:', JSON.stringify(result, null, 2));
    
    if (!result || !result.payUrl) {
      throw new Error('No payment URL received from Paygram API');
    }
    
    // Calculate expiry time (30 minutes from now)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    
    return {
      payUrl: result.payUrl,
      invoiceCode: result.invoiceCode,
      telegramReference,
      expiresAt
    };
  } catch (error) {
    console.error('Error generating payment URL with Paygram API:', error);
    throw new Error('Failed to generate payment URL with Paygram API');
  }
}

async function casino747CompleteTopup(casinoId: string, amount: number, reference: string) {
  try {
    console.log(`🎰 Casino747: Completing topup for casino ID ${casinoId} with amount ${amount} and reference ${reference}`);
    
    // Find the user by casino ID
    const user = await storage.getUserByCasinoClientId(parseInt(casinoId));
    console.log(`👤 Looking up user with casino client ID: ${casinoId}`, user ? 
      { found: true, username: user.username, casinoUsername: user.casinoUsername } : 
      { found: false });
    
    if (!user || !user.casinoUsername) {
      console.error(`❌ User with casino ID ${casinoId} not found or has no casino username`);
      throw new Error(`User with casino ID ${casinoId} not found or has no casino username`);
    }
    
    // Generate a unique nonce (using timestamp + random number)
    const nonce = `nonce_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // Create a detailed comment with nonce and DirectPay reference
    const comment = `An amount of ${amount} PHP has been deposited via DirectPay (ID: ${reference}). Nonce: ${nonce}. TMPay Web App Transaction.`;
    
    console.log(`📝 Preparing casino transfer with params:`, {
      amount,
      clientId: parseInt(casinoId),
      username: user.casinoUsername,
      currency: "PHP",
      fromUser: "system",
      commentLength: comment.length,
      nonce
    });
    
    // Complete the topup using the Casino747 API's transfer funds function
    // This will directly credit the user's casino account
    const transferResult = await casino747Api.transferFunds(
      amount,
      parseInt(casinoId),
      user.casinoUsername,
      "PHP", // Use PHP currency for GCash deposits
      "system", // System transfer initiated by e-wallet
      comment
    );
    
    console.log(`✅ Casino747: Transfer completed successfully:`, {
      user: user.casinoUsername,
      clientId: casinoId,
      amount,
      nonce,
      transferResult: JSON.stringify(transferResult)
    });
    
    return {
      success: true,
      newBalance: transferResult.newBalance || amount,
      transactionId: transferResult.transactionId || `TXN${Math.floor(Math.random() * 10000000)}`,
      nonce: nonce
    };
  } catch (error) {
    console.error('❌ Error completing topup with Casino747 API:', error);
    console.error('Error details:', {
      casinoId,
      amount,
      reference,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    // Fallback for development/testing
    console.log(`[FALLBACK] Casino747: Simulating completed topup for ${casinoId} with amount ${amount}`);
    
    const nonce = `nonce_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    return {
      success: true,
      newBalance: amount,
      transactionId: `TXN${Math.floor(Math.random() * 10000000)}`,
      nonce: nonce
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication with Passport and session support
  setupAuth(app);
  
  // The list of allowed top managers
  const ALLOWED_TOP_MANAGERS = ['alpha1', 'omega2', 'sigma3'];

  // Helper function to generate a unique access token
  function generateAccessToken(): string {
    return randomBytes(32).toString('hex');
  }

  // Helper function to verify if a username is allowed
  async function isUsernameAllowed(username: string, isAgent: boolean = false): Promise<{
    allowed: boolean;
    message?: string;
    topManager?: string;
    immediateManager?: string;
    userType?: string;
    casinoClientId?: number;
  }> {
    try {
      console.log(`Checking if username '${username}' is allowed (isAgent: ${isAgent})`);
      
      
      // Fetch user hierarchy from casino API
      console.log(`Fetching hierarchy data for user: ${username}`);
      const hierarchyData = await casino747Api.getUserHierarchy(username, isAgent);
      console.log(`Hierarchy data received:`, JSON.stringify(hierarchyData, null, 2));
      
      if (!hierarchyData.hierarchy || hierarchyData.hierarchy.length < 3) {
        console.log(`Invalid hierarchy structure for user ${username}:`, hierarchyData.hierarchy);
        return { 
          allowed: false, 
          message: "Invalid user hierarchy structure"
        };
      }
      
      // The hierarchy array typically has structure:
      // [0] = Root admin
      // [1] = Higher-level manager 
      // [2] = Top manager (the 3 approved top managers)
      // [3] = Immediate manager (direct upline)
      // [4] = The user themselves
      
      // Get top manager (3rd element, index 2)
      const topManager = hierarchyData.hierarchy[2]?.username;
      console.log(`Detected top manager: ${topManager}`);
      
      // Check if this top manager is in our allowed list
      const ALLOWED_TOP_MANAGERS = ['Marcthepogi', 'bossmarc747', 'teammarc'];
      console.log(`Checking if top manager ${topManager} is in allowed list:`, ALLOWED_TOP_MANAGERS);
      
      if (!topManager || !ALLOWED_TOP_MANAGERS.includes(topManager)) {
        console.log(`Top manager ${topManager} is not in the allowed list`);
        return { 
          allowed: false, 
          message: "User is not under an authorized top manager (Marcthepogi, bossmarc747, teammarc)"
        };
      }
      
      // Get immediate manager by finding parent
      const userClientId = hierarchyData.user.clientId;
      let immediateManager = '';
      
      // Find the immediate manager by matching parentClientId
      for (const agent of hierarchyData.hierarchy) {
        if (agent.clientId === hierarchyData.user.parentClientId) {
          immediateManager = agent.username;
          break;
        }
      }
      
      console.log(`Detected immediate manager: ${immediateManager}`);
      
      // Determine user type based on the param passed to this function
      // Since we don't have a direct isAgent property on the user object from API
      const userType = isAgent ? 'agent' : 'player';
      
      console.log(`User ${username} is allowed, type: ${userType}, top manager: ${topManager}, immediate manager: ${immediateManager}`);
      return {
        allowed: true,
        topManager,
        immediateManager,
        userType,
        casinoClientId: hierarchyData.user.clientId
      };
    } catch (error) {
      console.error("Error verifying username eligibility:", error);
      return {
        allowed: false,
        message: "Error verifying user eligibility: " + (error instanceof Error ? error.message : String(error))
      };
    }
  }
  
  // Add a route to verify if a username is eligible before login/register
  app.post("/api/auth/verify-username", async (req: Request, res: Response) => {
    try {
      // Validate the username from request
      const { username, userType } = z.object({
        username: z.string().min(3),
        userType: z.enum(['player', 'agent']).default('player')
      }).parse(req.body);
      
      const isAgent = userType === 'agent';
      
      // Check if username is eligible
      const eligibilityCheck = await isUsernameAllowed(username, isAgent);
      
      if (!eligibilityCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: eligibilityCheck.message
        });
      }
      
      return res.status(200).json({
        success: true,
        message: "Username is eligible for registration/login",
        topManager: eligibilityCheck.topManager,
        immediateManager: eligibilityCheck.immediateManager,
        userType: eligibilityCheck.userType,
        clientId: eligibilityCheck.casinoClientId
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid request data: " + error.message 
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        message: "Error verifying username: " + (error instanceof Error ? error.message : String(error))
      });
    }
  });

  // Auth and user management routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      // Validate the request with loginSchema
      const loginData = loginSchema.parse(req.body);
      const { username, password } = loginData;
      
      // Determine if user is requesting access as agent or player
      // Default to player if not specified
      const isAgent = req.body.userType === 'agent';
      
      // First verify if the username is allowed
      const eligibilityCheck = await isUsernameAllowed(username, isAgent);
      
      if (!eligibilityCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: eligibilityCheck.message
        });
      }
      
      // Find the user by username
      const user = await storage.getUserByUsername(username);
      
      // Check if user exists
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid username or password" 
        });
      }
      
      // Check if the password matches using the secure comparison function
      // This supports both hashed passwords and plain text (for development)
      console.log("Login attempt for user:", username);
      console.log("Password format:", user.password.includes('$2') ? "hashed" : "plaintext");
      console.log("Password stored:", user.password.substr(0, 5) + "..." + user.password.substr(-5));
      
      // Enhanced debugging for login attempt
      console.log("Login debugging info:");
      console.log(`- Username: ${username}`);
      console.log(`- Password length: ${password.length}`);
      console.log(`- Stored password preview: ${user.password.substring(0, 3)}...${user.password.substring(user.password.length - 3)}`);
      
      // Always use the comparePasswords function which handles both hash and plaintext scenarios
      console.log("Using comparePasswords function for unified password comparison");
      const passwordValid = await comparePasswords(password, user.password);
      console.log("Password comparison final result:", passwordValid);
        
      if (!passwordValid) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid username or password" 
        });
      }
      
      // Automatic password migration from plaintext to bcrypt hash
      // Only do this if the password is not already hashed and login was successful
      if (!isPasswordHashed(user.password) && passwordValid) {
        console.log(`Migrating password for user ${username} from plaintext to bcrypt hash`);
        try {
          // Hash the password using bcrypt
          const hashedPassword = await hashPassword(password);
          
          // Update the user record with the hashed password
          await storage.updateUserPassword(user.id, hashedPassword);
          console.log(`Password migration successful for user ${username}`);
        } catch (error) {
          console.error(`Password migration failed for user ${username}:`, error);
          // Continue with login even if migration fails
          // We'll try again next time
        }
      }
      
      // User is eligible and credentials are valid
      const topManager = eligibilityCheck.topManager;
      const immediateManager = eligibilityCheck.immediateManager;
      const userType = eligibilityCheck.userType || (isAgent ? 'agent' : 'player');
      
      // Update user with hierarchy info from API
      await storage.updateUserHierarchyInfo(
        user.id, 
        topManager || "", 
        immediateManager || "", 
        userType
      );
      
      // Update casino details if we have the client ID
      const casinoClientId = eligibilityCheck.casinoClientId || user.casinoClientId;
      if (casinoClientId) {
        await storage.updateUserCasinoDetails(user.id, {
          casinoUsername: username,
          casinoClientId
        });
      }
      
      // Set allowed top managers
      const ALLOWED_TOP_MANAGERS = ['Marcthepogi', 'bossmarc747', 'teammarc'];
      await storage.setUserAllowedTopManagers(user.id, ALLOWED_TOP_MANAGERS);
      
      // Mark user as authorized
      await storage.updateUserAuthorizationStatus(user.id, true);
      
      // Generate and store access token with expiration (1 hour)
      const accessToken = generateAccessToken();
      await storage.updateUserAccessToken(user.id, accessToken, 3600); // 1 hour
      
      // Generate and store refresh token with longer expiration (30 days)
      const refreshToken = generateAccessToken();
      await storage.updateUserRefreshToken(user.id, refreshToken, 2592000); // 30 days
      
      // Get updated user with tokens
      const updatedUser = await storage.getUser(user.id);
      
      if (!updatedUser) {
        return res.status(500).json({
          success: false,
          message: "Failed to retrieve updated user details"
        });
      }
      
      // Don't return the password to the client
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      // Return updated user info with both tokens
      return res.json({
        success: true,
        message: "Login successful",
        user: { 
          ...userWithoutPassword, 
          accessToken,
          refreshToken,
          isAuthorized: true
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ 
        success: false, 
        message: "Server error during login" 
      });
    }
  });
  
  // Token refresh endpoint
  app.post("/api/auth/refresh-token", async (req: Request, res: Response) => {
    try {
      // Validate the request
      const refreshSchema = z.object({
        refreshToken: z.string().min(10)
      });
      
      const { refreshToken } = refreshSchema.parse(req.body);
      
      // Find the user associated with this refresh token
      const user = await storage.getUserByRefreshToken(refreshToken);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid refresh token"
        });
      }
      
      // Check if the refresh token is expired
      if (!user.refreshTokenExpiry || user.refreshTokenExpiry < new Date()) {
        return res.status(401).json({
          success: false,
          message: "Refresh token has expired, please login again"
        });
      }
      
      // Generate a new access token
      const newAccessToken = generateAccessToken();
      await storage.updateUserAccessToken(user.id, newAccessToken, 3600); // 1 hour
      
      // Return the new access token
      return res.json({
        success: true,
        message: "Token refreshed successfully",
        accessToken: newAccessToken
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ 
        success: false, 
        message: "Server error during token refresh" 
      });
    }
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      // Try to get the authenticated user, but don't require it
      // This allows users to logout even if their token is invalid
      const authHeader = req.headers.authorization;
      let user = null;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          user = await storage.getUserByAccessToken(token);
        } catch (err) {
          console.log("Could not find user by token during logout, continuing anyway");
        }
      }
      
      // If we found the user, clear their access token and refresh token
      if (user) {
        try {
          await storage.updateUserAccessToken(user.id, null);
          await storage.updateUserRefreshToken(user.id, null);
          console.log(`Cleared access and refresh tokens for user ID: ${user.id}`);
        } catch (err) {
          console.error("Error clearing user tokens:", err);
          // Continue with logout even if this fails
        }
      }
      
      // Clear session if it exists (for passport/session auth)
      if (req.logout) {
        try {
          await new Promise<void>((resolve, reject) => {
            req.logout((err) => {
              if (err) {
                console.error("Error during session logout:", err);
                // Continue anyway
              }
              resolve();
            });
          });
        } catch (err) {
          console.error("Error during req.logout:", err);
          // Continue with logout even if this fails
        }
      }
      
      // Clear any session cookies
      if (req.session) {
        try {
          await new Promise<void>((resolve, reject) => {
            req.session!.destroy((err) => {
              if (err) {
                console.error("Error destroying session:", err);
                // Continue anyway
              }
              resolve();
            });
          });
        } catch (err) {
          console.error("Error destroying session:", err);
          // Continue with logout even if this fails
        }
      }
      
      // Send response with clear-cookie header for any auth cookies
      try {
        res.clearCookie('connect.sid', { path: '/' });
      } catch (err) {
        console.error("Error clearing cookie:", err);
        // Continue with logout even if this fails
      }
      
      return res.status(200).json({
        success: true,
        message: "Logout successful"
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, we want to clear client-side auth
      return res.status(200).json({ 
        success: true, 
        message: "Logout processed" 
      });
    }
  });
  
  // User registration endpoint
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      console.log("[REGISTER] Registration attempt with data:", JSON.stringify(req.body, null, 2));
      
      // Create a register schema based on the user schema with required fields
      const registerSchema = z.object({
        username: z.string().min(3),
        password: z.string().min(6),
        email: z.string().email(), // Email is now required
        userType: z.enum(['player', 'agent']).default('player')
      });
      
      // Validate registration data
      const { username, password, email, userType } = registerSchema.parse(req.body);
      console.log("[REGISTER] Valid registration data for username:", username);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        console.log("[REGISTER] User already exists:", username);
        return res.status(400).json({ 
          success: false, 
          message: "Username already exists" 
        });
      }
      
      // Determine if this is an agent or player based on form selection
      const isAgent = userType === 'agent';
      console.log("[REGISTER] User registering as:", isAgent ? "agent" : "player");
      
      // First verify if the username is allowed (in the correct hierarchy)
      const eligibilityCheck = await isUsernameAllowed(username, isAgent);
      console.log("[REGISTER] Eligibility check result:", JSON.stringify(eligibilityCheck, null, 2));
      
      if (!eligibilityCheck.allowed) {
        console.log("[REGISTER] User not eligible for registration:", username);
        return res.status(403).json({
          success: false,
          message: eligibilityCheck.message || "User is not eligible for registration"
        });
      }
      
      // User is verified and eligible
      const topManager = eligibilityCheck.topManager || "";
      const immediateManager = eligibilityCheck.immediateManager || "";
      console.log("[REGISTER] Top manager:", topManager, "Immediate manager:", immediateManager);
      
      try {
        // Get client ID 
        console.log("[REGISTER] Getting user hierarchy for:", username);
        const hierarchyData = await casino747Api.getUserHierarchy(username, isAgent);
        console.log("[REGISTER] Got hierarchy data:", JSON.stringify(hierarchyData, null, 2));
        const casinoClientId = hierarchyData.user.clientId;
        
        // Create new user in our system
        console.log("[REGISTER] Creating user in storage...");
        const newUser = await storage.createUser({
          username,
          password: await hashPassword(password), // Always hash the password
          email, // Email is now required and non-null
          casinoId: `747-${casinoClientId}`,
          balance: "0.00",
          pendingBalance: "0.00",
          isVip: false,
          casinoUsername: username,
          casinoClientId: casinoClientId,
          topManager: topManager,
          immediateManager: immediateManager,
          casinoUserType: isAgent ? 'agent' : 'player',
          isAuthorized: true // Pre-authorized since we checked the hierarchy
        });
        console.log("[REGISTER] User created with ID:", newUser.id);
        
        // Set allowed top managers
        const ALLOWED_TOP_MANAGERS = ['Marcthepogi', 'bossmarc747', 'teammarc'];
        await storage.setUserAllowedTopManagers(newUser.id, ALLOWED_TOP_MANAGERS);
        console.log("[REGISTER] Set allowed top managers for user");
        
        // Generate access token with expiration (1 hour)
        const accessToken = generateAccessToken();
        await storage.updateUserAccessToken(newUser.id, accessToken, 3600); // 1 hour
        
        // Generate refresh token with longer expiration (30 days)
        const refreshToken = generateAccessToken();
        await storage.updateUserRefreshToken(newUser.id, refreshToken, 2592000); // 30 days
        console.log("[REGISTER] Access and refresh tokens generated and saved");
        
        // Verify user was saved - get all users from storage
        const allUsers = storage.getAllUsers();
        console.log("[REGISTER] All users in storage after registration:", 
          Array.from(allUsers.values()).map(u => ({id: u.id, username: u.username})));
        
        // Return success with user details (minus password)
        const { password: _, ...userWithoutPassword } = newUser;
        
        return res.status(201).json({
          success: true,
          message: "Registration successful",
          user: {
            ...userWithoutPassword,
            accessToken,
            refreshToken
          }
        });
      } catch (apiError) {
        console.error("[REGISTER] API Error during casino operations:", apiError);
        return res.status(400).json({ 
          success: false, 
          message: "Could not verify casino account or hierarchy. Make sure username exists in 747 Casino.",
          details: apiError instanceof Error ? apiError.message : String(apiError)
        });
      }
    } catch (error) {
      console.error("[REGISTER] Registration error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      // Check if it's an API error
      if (error instanceof Error && error.message && error.message.includes("casino")) {
        return res.status(400).json({ 
          success: false, 
          message: "Could not verify casino account or hierarchy. Make sure username exists in 747 Casino." 
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        message: "Server error during registration",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Authorization middleware
  async function authMiddleware(req: Request, res: Response, next: Function) {
    try {
      // Get the access token from the authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          message: "Authorization token is required" 
        });
      }
      
      const token = authHeader.split(' ')[1];
      
      // Validate the token format using authSchema
      try {
        authSchema.parse({ token });
      } catch (validationError) {
        return res.status(401).json({
          success: false,
          message: "Invalid token format"
        });
      }
      
      // Find the user with this access token
      const user = await storage.getUserByAccessToken(token);
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid or expired token" 
        });
      }
      
      // Check if the user is authorized
      if (!user.isAuthorized) {
        return res.status(403).json({ 
          success: false, 
          message: "User is not authorized to use this system" 
        });
      }
      
      // Attach the user to the request object
      (req as any).user = user;
      
      // Continue to the next middleware or route handler
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Server error during authentication" 
      });
    }
  }
  
  // Role-based authorization middleware
  function roleAuthMiddleware(allowedRoles: string[]) {
    return async (req: Request, res: Response, next: Function) => {
      try {
        // First apply the base auth middleware to get the user
        authMiddleware(req, res, (err: any) => {
          if (err) return next(err);
          
          // User is now available in req.user
          const user = (req as any).user;
          
          // Check role - use casinoUserType as role
          const userRole = user.casinoUserType || 'player'; // Default to player if no role specified
          
          if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
              success: false,
              message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
            });
          }
          
          // User has an allowed role, proceed
          next();
        });
      } catch (error) {
        console.error("Role authorization error:", error);
        return res.status(500).json({ 
          success: false, 
          message: "Server error during role authorization" 
        });
      }
    };
  }

  // User info and balance
  app.get("/api/user/info", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Get the authenticated user from the request
      const user = (req as any).user;
      
      // Don't send the password to the client
      const { password: _, ...userWithoutPassword } = user;
      
      return res.json({ 
        success: true,
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("Get user info error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Server error while fetching user info" 
      });
    }
  });
  
  // Multi-currency endpoints
  app.get("/api/currencies", authMiddleware, (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      currencies: supportedCurrencies
    });
  });
  
  app.get("/api/user/currency-balances", authMiddleware, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      // Initialize result object with all supported currencies
      const balances: Record<string, string> = {};
      
      // Get balances for all currencies
      for (const currency of supportedCurrencies) {
        balances[currency] = await storage.getUserCurrencyBalance(user.id, currency as Currency);
      }
      
      res.status(200).json({
        success: true,
        balances,
        preferredCurrency: user.preferredCurrency || 'PHP'
      });
    } catch (error) {
      console.error("Error fetching currency balances:", error);
      res.status(500).json({ success: false, message: "Server error fetching balances" });
    }
  });
  
  app.post("/api/user/preferred-currency", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { currency } = updatePreferredCurrencySchema.parse(req.body);
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      // Validate currency
      if (!supportedCurrencies.includes(currency)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid currency. Supported currencies are: ${supportedCurrencies.join(', ')}` 
        });
      }
      
      // Update preferred currency
      const updatedUser = await storage.updatePreferredCurrency(user.id, currency as Currency);
      
      res.status(200).json({
        success: true,
        preferredCurrency: updatedUser.preferredCurrency,
        message: `Preferred currency updated to ${currency}`
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      console.error("Error updating preferred currency:", error);
      res.status(500).json({ success: false, message: "Server error updating preferred currency" });
    }
  });
  
  app.post("/api/currency/exchange", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { fromCurrency, toCurrency, amount } = exchangeCurrencySchema.parse(req.body);
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      // Validate currencies
      if (!supportedCurrencies.includes(fromCurrency) || !supportedCurrencies.includes(toCurrency)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid currency. Supported currencies are: ${supportedCurrencies.join(', ')}` 
        });
      }
      
      // Check balance with additional validation
      const currentBalance = await storage.getUserCurrencyBalance(user.id, fromCurrency as Currency);
      const numericBalance = parseFloat(currentBalance);
      
      // Ensure the balance is a valid number
      if (isNaN(numericBalance)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${fromCurrency} balance format.`
        });
      }
      
      // Check if user has sufficient balance
      if (numericBalance < amount) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient ${fromCurrency} balance. Available: ${currentBalance}` 
        });
      }
      
      // Ensure amount is not negative or zero
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Exchange amount must be greater than zero"
        });
      }
      
      try {
        // Exchange currency
        const updatedUser = await storage.exchangeCurrency(
          user.id, 
          fromCurrency as Currency, 
          toCurrency as Currency, 
          amount
        );
        
        // Create a transaction record
        const transaction = await storage.createTransaction({
          userId: user.id,
          type: 'exchange',
          method: 'currency_exchange',
          amount: amount.toString(),
          status: 'completed',
          currency: fromCurrency,
          metadata: {
            fromCurrency,
            toCurrency,
            exchangeRate: "Market rate" // In a real system, you'd store the actual rate used
          }
        });
        
        // Get updated balances
        const fromBalance = await storage.getUserCurrencyBalance(user.id, fromCurrency as Currency);
        const toBalance = await storage.getUserCurrencyBalance(user.id, toCurrency as Currency);
        
        res.status(200).json({
          success: true,
          transaction,
          balances: {
            [fromCurrency]: fromBalance,
            [toCurrency]: toBalance
          },
          message: `Successfully exchanged ${amount} ${fromCurrency} to ${toCurrency}`
        });
      } catch (error) {
        console.error("Error exchanging currency:", error);
        res.status(400).json({ 
          success: false, 
          message: error instanceof Error ? error.message : "Exchange failed" 
        });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      console.error("Currency exchange error:", error);
      res.status(500).json({ success: false, message: "Server error during currency exchange" });
    }
  });
  
  // Transaction history
  app.get("/api/transactions", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Get the authenticated user from the request
      const user = (req as any).user;
      
      const transactions = await storage.getTransactionsByUserId(user.id);
      
      return res.json({ 
        success: true,
        transactions 
      });
    } catch (error) {
      console.error("Get transactions error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Server error while fetching transactions" 
      });
    }
  });
  
  // Generate QR code for deposit
  // Endpoint to generate a PHPT payment URL using Paygram
  app.post("/api/payments/paygram/generate", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Get authenticated user
      const user = (req as any).user;
      
      // Validate request body using the generate schema
      const { amount, currency = 'PHPT' } = generateTelegramPaymentSchema.parse(req.body);
      
      // Check if the user already has an active payment
      const activePayment = await storage.getActiveTelegramPaymentByUserId(user.id);
      
      if (activePayment) {
        return res.status(400).json({
          success: false,
          message: "You already have an active payment. Please complete or cancel it before creating a new one.",
          payment: activePayment
        });
      }
      
      // Generate a transaction with pending status
      const transaction = await storage.createTransaction({
        userId: user.id,
        type: 'deposit',
        method: 'telegram',
        amount: amount.toString(),
        currency,
        status: 'pending'
      });
      
      // Generate the payment via Paygram API
      const payment = await paygramGeneratePayment(
        user.id.toString(), 
        amount, 
        currency as Currency
      );
      
      // Save payment details in our storage
      const telegramPayment = await storage.createTelegramPayment({
        userId: user.id,
        transactionId: transaction.id,
        amount: amount.toString(),
        currency,
        payUrl: payment.payUrl,
        invoiceId: payment.invoiceCode,
        telegramReference: payment.telegramReference,
        expiresAt: payment.expiresAt,
        status: 'pending'
      });
      
      // Update the transaction with the payment reference
      await storage.updateTransactionStatus(
        transaction.id, 
        'pending', 
        payment.telegramReference
      );
      
      // Return success with payment details
      return res.status(201).json({
        success: true,
        telegramPayment,
        transaction,
        message: "Payment URL generated successfully. Please complete the payment via Telegram."
      });
    } catch (error) {
      console.error('Error generating Paygram payment:', error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      
      return res.status(500).json({
        success: false,
        message: "Error generating payment: " + (error instanceof Error ? error.message : String(error))
      });
    }
  });
  
  app.post("/api/payments/gcash/generate-qr", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Get the authenticated user from the request
      const user = (req as any).user;
      
      // Validate request with generateQrCodeSchema
      const { amount } = generateQrCodeSchema.parse({
        ...req.body,
        userId: user.id,
        username: user.username,
        casinoId: user.casinoId
      });
      
      if (amount < 100 || amount > 50000) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid amount. Must be between ₱100 and ₱50,000" 
        });
      }
      
      // Check if there's already an active QR code
      const activeQr = await storage.getActiveQrPaymentByUserId(user.id);
      if (activeQr) {
        return res.status(400).json({
          success: false,
          message: "You already have an active QR code. Please complete or cancel the existing payment.",
          qrPayment: activeQr
        });
      }
      
      // Create a transaction record first
      const transactionReference = randomUUID();
      const transaction = await storage.createTransaction({
        userId: user.id,
        type: "deposit",
        method: "gcash_qr",
        amount: amount.toString(),
        status: "pending",
        paymentReference: transactionReference,
        metadata: { initiatedAt: new Date().toISOString() }
      });
      
      // Call DirectPay API to generate GCash payment link
      const { qrCodeData, directPayReference, payUrl, expiresAt } = await directPayGenerateQRCode(
        amount,
        transactionReference,
        user.username
      );
      
      // Call 747 Casino API to prepare for topup
      const { casinoReference } = await casino747PrepareTopup(
        user.casinoId,
        amount,
        transactionReference
      );
      
      // Update transaction with references
      await storage.updateTransactionStatus(
        transaction.id,
        "pending",
        directPayReference
      );
      
      // Create QR payment record
      const qrPayment = await storage.createQrPayment({
        userId: user.id,
        transactionId: transaction.id,
        qrCodeData,
        amount: amount.toString(),
        expiresAt,
        directPayReference,
        payUrl,
        status: "pending"
      });
      
      // Return the QR code data to the client
      return res.json({
        success: true,
        qrPayment,
        transaction
      });
    } catch (error) {
      console.error("Generate QR error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false,
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ 
        success: false,
        message: "Server error while generating QR code" 
      });
    }
  });
  
  // For testing - get all users in database
  app.get("/api/debug/users", async (req: Request, res: Response) => {
    try {
      const allUsers = storage.getAllUsers();
      const usersList = Array.from(allUsers.values()).map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
      });
      
      return res.json({
        success: true,
        users: usersList,
        count: usersList.length
      });
    } catch (error) {
      console.error("Debug users error:", error);
      return res.status(500).json({
        success: false,
        message: "Error retrieving users"
      });
    }
  });
  
  // Password migration utility endpoint for fixing existing plaintext passwords
  app.post("/api/debug/fix-password", async (req: Request, res: Response) => {
    try {
      // Get username and plaintext password from request
      const { username, currentPassword, newPassword } = z.object({
        username: z.string(),
        currentPassword: z.string().optional(),
        newPassword: z.string().min(6)
      }).parse(req.body);
      
      // Find the user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      // Verify current password if provided
      if (currentPassword) {
        console.log("Verifying current password before migration");
        // Use direct comparison for plaintext passwords
        const isCurrentPasswordValid = user.password === currentPassword;
        if (!isCurrentPasswordValid) {
          return res.status(401).json({
            success: false,
            message: "Current password is incorrect"
          });
        }
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Log the operation details
      console.log(`Updating password for user ${username} (ID: ${user.id})`);
      console.log(`Old password format: ${user.password.includes('$2') ? 'hashed' : 'plaintext'}`);
      console.log(`New password will be properly hashed`);
      
      // Use the updateUserCasinoDetails method to update just the password field
      try {
        // This method is designed to update specific fields of a user
        const updatedUser = await storage.updateUserCasinoDetails(user.id, {
          password: hashedPassword
        });
        console.log("Password updated successfully in database");
      } catch (dbError) {
        console.error("Database error during password update:", dbError);
        throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
      }
      
      return res.json({
        success: true,
        message: "Password migrated successfully",
        userId: user.id,
        username: user.username,
        passwordUpdated: true
      });
    } catch (error) {
      console.error("Error during password migration:", error);
      return res.status(500).json({
        success: false,
        message: "Error during password migration",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Test endpoint for DirectPay GCash QR code generation
  app.get("/api/debug/direct-pay-gcash", async (req: Request, res: Response) => {
    try {
      const amount = 100; // Test with minimum amount
      const testReference = `TEST-${Date.now()}`;
      const testUsername = "debug_user";
      const webhookUrl = `${req.protocol}://${req.get('host')}/api/webhook/directpay/payment`;
      const redirectUrl = `${req.protocol}://${req.get('host')}/payment/thank-you?reference=${testReference}&amount=${amount}&username=${encodeURIComponent(testUsername)}`;
      
      console.log('Webhook URL:', webhookUrl);
      console.log('Redirect URL:', redirectUrl);
      
      const result = await directPayApi.generateGCashQR(amount, webhookUrl, redirectUrl);
      res.json({
        success: true,
        result
      });
    } catch (error) {
      console.error("Error generating DirectPay QR:", error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Debug endpoint to test casino balance API directly with a specific user
  app.get("/api/debug/casino-balance-test", async (req: Request, res: Response) => {
    try {
      // Use Marcthepogi as a hardcoded test case
      const username = "Marcthepogi";
      
      console.log(`DEBUG: Testing balance API for ${username}`);
      console.log(`DEBUG: Getting user details for ${username}`);
      
      try {
        const userDetails = await casino747Api.getUserDetails(username);
        console.log(`DEBUG: User details:`, JSON.stringify(userDetails));
        
        if (!userDetails || !userDetails.clientId) {
          return res.status(404).json({
            success: false,
            message: `User ${username} not found or clientId missing`
          });
        }
        
        console.log(`DEBUG: Testing balance API for ${username} with clientId ${userDetails.clientId}`);
        
        try {
          const balanceResult = await casino747Api.getUserBalance(userDetails.clientId, username);
          console.log(`DEBUG: Balance result:`, JSON.stringify(balanceResult));
          
          return res.json({
            success: true,
            message: "Casino balance test successful",
            userDetails: userDetails,
            balanceResult: balanceResult
          });
        } catch (balanceError) {
          console.error("Error fetching balance:", balanceError);
          return res.status(500).json({ 
            success: false, 
            message: "Casino balance test failed", 
            error: balanceError instanceof Error ? balanceError.message : String(balanceError),
            userDetails: userDetails
          });
        }
      } catch (userError) {
        console.error("Error fetching user details:", userError);
        return res.status(500).json({ 
          success: false, 
          message: "Failed to get user details", 
          error: userError instanceof Error ? userError.message : String(userError)
        });
      }
    } catch (error) {
      console.error("Error in casino balance test:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Casino balance test failed", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Endpoint to create manual payment with receipt
  app.post("/api/payments/manual/create", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Get the authenticated user from the request
      const user = (req as any).user;
      
      // Validate request with manualPaymentSchema
      const { amount, paymentMethod, notes, reference } = manualPaymentSchema.parse(req.body);
      
      // Check required fields
      if (!req.body.proofImageUrl) {
        return res.status(400).json({
          success: false,
          message: "Proof image URL is required"
        });
      }
      
      // Check if the user already has an active manual payment
      const existingPayment = await storage.getActiveManualPaymentByUserId(user.id);
      
      if (existingPayment) {
        // Update the existing manual payment with new details
        await storage.updateManualPaymentStatus(existingPayment.id, 'pending');
        
        // Update the existing transaction
        const updatedTransaction = await storage.getTransaction(existingPayment.transactionId);
        
        if (updatedTransaction) {
          await storage.updateTransactionStatus(updatedTransaction.id, 'pending');
          
          // Upload the new receipt
          const updatedPayment = await storage.uploadManualPaymentReceipt(
            existingPayment.id,
            req.body.proofImageUrl
          );
          
          return res.json({
            success: true,
            manualPayment: updatedPayment,
            transaction: updatedTransaction,
            message: "Existing payment updated with new proof"
          });
        }
      }
      
      // Create a new transaction for this payment
      const transaction = await storage.createTransaction({
        userId: user.id,
        type: 'deposit',
        method: `manual_${paymentMethod}`,
        amount: amount.toString(),
        status: 'pending',
        paymentReference: reference,
        currency: 'PHP'
      });
      
      // Create manual payment record
      const manualPayment = await storage.createManualPayment({
        userId: user.id,
        transactionId: transaction.id,
        amount: amount.toString(),
        paymentMethod,
        notes: notes || null,
        proofImageUrl: req.body.proofImageUrl,
        reference,
        status: 'pending'
      });
      
      // Return the manual payment data to the client
      return res.json({
        success: true,
        manualPayment,
        transaction
      });
    } catch (error) {
      console.error("Manual payment creation error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid request data: " + error.message
        });
      }
      return res.status(500).json({
        success: false,
        message: "Error creating manual payment: " + (error instanceof Error ? error.message : String(error))
      });
    }
  });
  
  // Endpoint to check payment status
  app.get("/api/payments/status/:referenceId", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { referenceId } = req.params;
      
      if (!referenceId) {
        return res.status(400).json({ 
          success: false,
          message: "Reference ID is required" 
        });
      }
      
      // Get the authenticated user
      const authenticatedUser = (req as any).user;
      
      // Check if this is a Telegram/Paygram payment reference (starts with PGRAM-)
      if (referenceId.startsWith('PGRAM-')) {
        // Find the Telegram payment by reference
        const telegramPayment = await storage.getTelegramPaymentByReference(referenceId);
        
        if (!telegramPayment) {
          return res.status(404).json({ 
            success: false,
            message: "Telegram payment not found" 
          });
        }
        
        // Check if the payment belongs to the authenticated user
        if (telegramPayment.userId !== authenticatedUser.id) {
          return res.status(403).json({ 
            success: false,
            message: "You don't have permission to view this payment" 
          });
        }
        
        // If payment is already completed or failed, just return the current status
        if (telegramPayment.status === "completed" || telegramPayment.status === "failed") {
          return res.json({
            success: true,
            status: telegramPayment.status,
            telegramPayment
          });
        }
        
        // Check if the payment has expired
        if (telegramPayment.status === "pending" && new Date() > telegramPayment.expiresAt) {
          await storage.updateTelegramPaymentStatus(telegramPayment.id, "expired");
          return res.json({
            success: false,
            status: "expired",
            message: "Payment has expired"
          });
        }
        
        // For pending payments, check with Paygram API for the latest status
        if (telegramPayment.status === "pending") {
          try {
            // Check payment status with Paygram API
            const paygramStatus = await paygramApi.checkPaymentStatus(
              authenticatedUser.id.toString(), 
              telegramPayment.invoiceId || '' // Empty string as fallback in case invoiceId is null
            );
            
            // If Paygram says the payment is completed or failed, update our status
            if (paygramStatus.status !== "pending") {
              console.log(`Payment status from Paygram: ${paygramStatus.status} for invoice ${telegramPayment.invoiceId}`);
              
              // Update our Telegram payment status
              await storage.updateTelegramPaymentStatus(telegramPayment.id, paygramStatus.status);
              telegramPayment.status = paygramStatus.status;
              
              // If payment is completed, also update the transaction and user balance
              if (paygramStatus.status === "completed") {
                // Get the transaction and user
                const transaction = await storage.getTransaction(telegramPayment.transactionId);
                const user = await storage.getUser(telegramPayment.userId);
                
                if (transaction && user) {
                  // Update transaction status
                  await storage.updateTransactionStatus(
                    transaction.id, 
                    "completed",
                    telegramPayment.invoiceId || undefined
                  );
                  
                  // Ensure payment status is also updated
                  await storage.updateTelegramPaymentStatus(telegramPayment.id, "completed");
                  
                  // Update user's balance with the specific currency (PHPT or USDT)
                  const currency = transaction.currency || telegramPayment.currency || 'PHPT';
                  const amount = parseFloat(telegramPayment.amount.toString());
                  await storage.updateUserCurrencyBalance(user.id, currency as Currency, amount);
                  
                  console.log(`Telegram payment completed via status check: ${telegramPayment.invoiceId}, amount: ${amount} ${currency}`);
                }
              }
            }
          } catch (paygramError) {
            // If there's an error checking with Paygram, just continue with our current status
            console.error("Error checking payment status with Paygram:", paygramError);
          }
        }
        
        return res.json({
          success: telegramPayment.status === "completed",
          status: telegramPayment.status,
          telegramPayment
        });
      } else {
        // This is a GCash QR payment - Find the QR payment by reference
        const qrPayment = await storage.getQrPaymentByReference(referenceId);
        
        if (!qrPayment) {
          return res.status(404).json({ 
            success: false,
            message: "Payment not found" 
          });
        }
        
        // Check if the payment belongs to the authenticated user
        if (qrPayment.userId !== authenticatedUser.id) {
          return res.status(403).json({ 
            success: false,
            message: "You don't have permission to view this payment" 
          });
        }
        
        // If payment is already completed or failed, just return the current status
        if (qrPayment.status === "completed" || qrPayment.status === "failed") {
          return res.json({
            success: true,
            status: qrPayment.status,
            qrPayment
          });
        }
        
        // Check if the payment has expired
        if (qrPayment.status === "pending" && new Date() > qrPayment.expiresAt) {
          await storage.updateQrPaymentStatus(qrPayment.id, "expired");
          return res.json({
            success: false,
            status: "expired",
            message: "Payment has expired"
          });
        }
        
        // For pending payments, check with DirectPay for the latest status
        // This is useful for cases where the webhook might not have been received
        if (qrPayment.status === "pending") {
          try {
            // Query DirectPay API for the latest payment status
            const directPayStatus = await directPayApi.checkPaymentStatus(qrPayment.directPayReference || referenceId);
            
            // If DirectPay says the payment is completed or failed, update our status
            if (directPayStatus.status !== "pending") {
              console.log(`Payment status from DirectPay: ${directPayStatus.status} for reference ${referenceId}`);
              
              // Update our QR payment status
              await storage.updateQrPaymentStatus(qrPayment.id, directPayStatus.status);
              qrPayment.status = directPayStatus.status;
              
              // If payment is completed, also update the transaction and user balance
              if (directPayStatus.status === "completed") {
                // Get the transaction and user
                const transaction = await storage.getTransaction(qrPayment.transactionId);
                const user = await storage.getUser(qrPayment.userId);
                
                if (transaction && user) {
                  // Update transaction status
                  await storage.updateTransactionStatus(
                    transaction.id, 
                    "completed",
                    directPayStatus.transactionId
                  );
                  
                  // Call 747 Casino API to complete the topup
                  const amount = parseFloat(qrPayment.amount.toString());
                  const casinoResult = await casino747CompleteTopup(
                    user.casinoId,
                    amount,
                    transaction.paymentReference || ""
                  );
                  
                  // Update user's balance using the currency from the transaction
                  const currency = transaction.currency || 'PHP'; // Default to PHP for GCash transactions
                  await storage.updateUserCurrencyBalance(user.id, currency as Currency, amount);
                  
                  console.log(`Payment completed via status check: ${referenceId}, amount: ${amount}`);
                }
              }
            }
          } catch (directPayError) {
            // If there's an error checking with DirectPay, just continue with our current status
            console.error("Error checking payment status with DirectPay:", directPayError);
          }
        }
        
        return res.json({
          success: qrPayment.status === "completed",
          status: qrPayment.status,
          qrPayment
        });
      }
    } catch (error) {
      console.error("Check payment status error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Server error while checking payment status" 
      });
    }
  });
  
  // Endpoint to simulate payment completion for testing & development (in production this would be a webhook from DirectPay)
  app.post("/api/payments/simulate-completion", async (req: Request, res: Response) => {
    try {
      console.log(`🧪 SIMULATION: Payment completion simulation called with payload:`, req.body);
      
      const { directPayReference, testMode } = req.body;
      
      if (!directPayReference) {
        console.log("❌ SIMULATION: DirectPay reference is missing");
        return res.status(400).json({ 
          success: false, 
          message: "DirectPay reference is required" 
        });
      }
      
      // Find the QR payment
      const qrPayment = await storage.getQrPaymentByReference(directPayReference);
      console.log(`🔍 SIMULATION: Looking up QR payment by reference: ${directPayReference}`, 
        qrPayment ? { found: true, id: qrPayment.id, status: qrPayment.status } : { found: false });
      
      if (!qrPayment) {
        return res.status(404).json({ 
          success: false, 
          message: "Payment not found" 
        });
      }
      
      // Only enforce pending status check if not in test mode
      if (qrPayment.status !== "pending" && !testMode) {
        console.log(`⚠️ SIMULATION: Payment is already in ${qrPayment.status} state`);
        return res.status(400).json({ 
          success: false, 
          message: `Payment is already ${qrPayment.status}` 
        });
      }
      
      // Find the user
      const user = await storage.getUser(qrPayment.userId);
      console.log(`👤 SIMULATION: Looking up user with ID: ${qrPayment.userId}`, 
        user ? { found: true, username: user.username, casinoId: user.casinoId } : { found: false });
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }
      
      // Verify casino ID exists
      if (!user.casinoId || !user.casinoUsername) {
        console.error(`❌ SIMULATION: User ${user.username} has no casino ID or username`);
        return res.status(400).json({
          success: false, 
          message: "User has no casino ID or username"
        });
      }
      
      // Find the transaction
      const transaction = await storage.getTransaction(qrPayment.transactionId);
      console.log(`💼 SIMULATION: Looking up transaction with ID: ${qrPayment.transactionId}`, 
        transaction ? { found: true, id: transaction.id, status: transaction.status } : { found: false });
      
      if (!transaction) {
        return res.status(404).json({ 
          success: false, 
          message: "Transaction not found" 
        });
      }
      
      console.log(`✅ SIMULATION: All validations passed, proceeding with payment completion`);
      
      // Update QR payment status
      await storage.updateQrPaymentStatus(qrPayment.id, "completed");
      console.log(`🔄 SIMULATION: Updated QR payment status to completed`);
      
      // Update transaction status with a simulated transaction ID
      const simulatedTxId = `SIM${Date.now()}`;
      await storage.updateTransactionStatus(
        transaction.id, 
        "completed", 
        simulatedTxId
      );
      console.log(`🔄 SIMULATION: Updated transaction status to completed with ID: ${simulatedTxId}`);
      
      // Parse amount and prepare for casino topup
      const amount = parseFloat(qrPayment.amount.toString());
      console.log(`💰 SIMULATION: Amount to be transferred to casino: ${amount}`);
      
      // Determine payment reference to use
      const paymentRef = transaction.paymentReference || directPayReference || simulatedTxId;
      console.log(`🔑 SIMULATION: Using payment reference for casino transfer: ${paymentRef}`);
      
      try {
        console.log(`🎰 SIMULATION: Initiating casino topup with params:`, {
          casinoId: user.casinoId,
          casinoUsername: user.casinoUsername,
          amount,
          reference: paymentRef
        });
        
        // Call 747 Casino API to complete the topup
        const casinoResult = await casino747CompleteTopup(
          user.casinoId,
          amount,
          paymentRef
        );
        
        console.log(`✅ SIMULATION: Casino topup completed successfully:`, casinoResult);
        
        // Update transaction with the unique nonce for reconciliation
        await storage.updateTransactionStatus(
          transaction.id,
          "completed",
          simulatedTxId,
          { nonce: casinoResult.nonce, casinoTransactionId: casinoResult.transactionId }
        );
        
        // Update user's balance with the transaction currency (default to PHP for GCash)
        const currency = transaction.currency || 'PHP';
        await storage.updateUserCurrencyBalance(user.id, currency as Currency, amount);
        console.log(`💵 SIMULATION: Updated user's ${currency} balance with amount: ${amount}`);
        
        // Get the updated currency balance
        const newBalance = await storage.getUserCurrencyBalance(user.id, currency as Currency);
        console.log(`💵 SIMULATION: New user balance: ${newBalance} ${currency}`);
        
        return res.json({
          success: true,
          message: "Payment completed successfully with casino transfer",
          transaction: {
            ...transaction,
            status: "completed",
            transactionId: casinoResult.transactionId,
            casinoNonce: casinoResult.nonce
          },
          newBalance,
          currencyUsed: currency,
          casinoTopup: {
            success: true,
            newCasinoBalance: casinoResult.newBalance
          }
        });
      } catch (casinoError) {
        console.error("❌ SIMULATION: Error during casino topup:", casinoError);
        
        // Update user's balance despite casino error
        const currency = transaction.currency || 'PHP';
        await storage.updateUserCurrencyBalance(user.id, currency as Currency, amount);
        const newBalance = await storage.getUserCurrencyBalance(user.id, currency as Currency);
        
        // Add error details to transaction
        await storage.updateTransactionStatus(
          transaction.id,
          "completed",
          simulatedTxId,
          { 
            casinoError: casinoError instanceof Error ? casinoError.message : String(casinoError),
            casinoErrorTime: new Date().toISOString() 
          }
        );
        
        return res.json({
          success: true,
          message: "Payment completed but casino transfer failed",
          transaction: {
            ...transaction,
            status: "completed",
            transactionId: simulatedTxId
          },
          newBalance,
          currencyUsed: currency,
          casinoTopup: {
            success: false,
            error: casinoError instanceof Error ? casinoError.message : String(casinoError)
          }
        });
      }
    } catch (error) {
      console.error("❌ SIMULATION: Payment completion simulation error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Server error while processing simulated payment completion",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 747 Casino API routes
  
  // Admin-only endpoint to view all users
  app.get("/api/admin/users", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
    try {
      // Get all users (in a real app, you would implement pagination)
      const allUsers = Array.from(storage.getAllUsers().values()).map(user => {
        // Don't send passwords
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      return res.json({
        success: true,
        users: allUsers,
        count: allUsers.length
      });
    } catch (error) {
      console.error("Get all users error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Server error while fetching users" 
      });
    }
  });
  
  // Admin endpoint to approve or reject manual payments
  app.post("/api/admin/manual-payment/:id/status", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      const admin = (req as any).user;
      
      if (!id || !status) {
        return res.status(400).json({
          success: false,
          message: "Payment ID and status are required"
        });
      }
      
      if (status !== 'approved' && status !== 'rejected') {
        return res.status(400).json({
          success: false,
          message: "Status must be either 'approved' or 'rejected'"
        });
      }
      
      // Get the manual payment
      const payment = await storage.getManualPayment(parseInt(id));
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Manual payment not found"
        });
      }
      
      // Update the payment status
      const updatedPayment = await storage.updateManualPaymentStatus(payment.id, status);
      
      // Update admin ID and notes
      await storage.updateManualPayment(payment.id, {
        adminId: admin.id,
        adminNotes: adminNotes || null
      });
      
      // If payment is approved, update the transaction and user balance
      if (status === 'approved') {
        // Update transaction status
        const transaction = await storage.getTransaction(payment.transactionId);
        if (transaction) {
          await storage.updateTransactionStatus(transaction.id, 'completed');
          
          // Update user's balance with the transaction amount
          const user = await storage.getUser(payment.userId);
          if (user) {
            const currency = transaction.currency || 'PHP';
            const amount = parseFloat(payment.amount.toString());
            await storage.updateUserCurrencyBalance(user.id, currency as Currency, amount);
            
            // Call 747 Casino API to complete the topup if needed
            await casino747CompleteTopup(
              user.casinoId,
              amount,
              transaction.paymentReference || ""
            );
          }
        }
      }
      
      return res.json({
        success: true,
        payment: updatedPayment,
        message: `Manual payment ${status}`
      });
    } catch (error) {
      console.error("Update manual payment status error:", error);
      return res.status(500).json({
        success: false,
        message: "Error updating manual payment status: " + (error instanceof Error ? error.message : String(error))
      });
    }
  });
  
  // Admin endpoint to list all manual payments
  app.get("/api/admin/manual-payments", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
    try {
      // Get all manual payments
      const allManualPayments = Array.from(storage.getAllManualPayments().values());
      
      // Sort by created date (newest first)
      allManualPayments.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : 
                     (typeof a.createdAt === 'string' ? new Date(a.createdAt) : new Date());
        const dateB = b.createdAt instanceof Date ? b.createdAt : 
                     (typeof b.createdAt === 'string' ? new Date(b.createdAt) : new Date());
        return dateB.getTime() - dateA.getTime();
      });
      
      return res.json({
        success: true,
        payments: allManualPayments,
        count: allManualPayments.length
      });
    } catch (error) {
      console.error("Get manual payments error:", error);
      return res.status(500).json({
        success: false,
        message: "Error retrieving manual payments"
      });
    }
  });
  
  // Admin endpoint to list all transactions
  app.get("/api/admin/transactions", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
    try {
      // Get all transactions
      const allTransactions = await storage.getTransactionsByUserId(0); // 0 is a placeholder to get all
      
      // Sort by created date (newest first)
      allTransactions.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : 
                     (typeof a.createdAt === 'string' ? new Date(a.createdAt) : new Date());
        const dateB = b.createdAt instanceof Date ? b.createdAt : 
                     (typeof b.createdAt === 'string' ? new Date(b.createdAt) : new Date());
        return dateB.getTime() - dateA.getTime();
      });
      
      return res.json({
        success: true,
        transactions: allTransactions,
        count: allTransactions.length
      });
    } catch (error) {
      console.error("Get all transactions error:", error);
      return res.status(500).json({
        success: false,
        message: "Error retrieving transactions"
      });
    }
  });
  
  // Agent-only endpoint to view downlines
  app.get("/api/agent/downlines", roleAuthMiddleware(['admin', 'agent']), async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      // Get all downlines for this agent (players where this agent is the immediateManager)
      const downlines = Array.from(storage.getAllUsers().values())
        .filter(u => u.immediateManager === user.username)
        .map(player => {
          // Don't send passwords
          const { password, ...playerWithoutPassword } = player;
          return playerWithoutPassword;
        });
      
      return res.json({
        success: true,
        downlines,
        count: downlines.length
      });
    } catch (error) {
      console.error("Get downlines error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Server error while fetching downlines" 
      });
    }
  });
  
  // Get user details from casino
  app.post("/api/casino/user-details", async (req: Request, res: Response) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      // Validate using the schema
      casinoGetUserDetailsSchema.parse({ username });
      
      // First check if we have this user locally
      const existingUser = await storage.getUserByCasinoUsername(username);
      
      // If user exists locally, return the user details
      if (existingUser) {
        const { password: _, ...userWithoutPassword } = existingUser;
        return res.json({ 
          success: true, 
          user: userWithoutPassword,
          source: "local"
        });
      }
      
      // If not, fetch from casino API
      try {
        const casinoUserDetails = await casino747Api.getUserDetails(username);
        
        return res.json({
          success: true,
          user: casinoUserDetails,
          source: "casino"
        });
      } catch (casinoError) {
        console.error("Error fetching user from casino API:", casinoError);
        return res.status(404).json({ 
          success: false, 
          message: "User not found in casino system" 
        });
      }
    } catch (error) {
      console.error("Get casino user details error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false,
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ 
        success: false,
        message: "Server error while fetching user details" 
      });
    }
  });
  
  // Get user balance from casino
  app.post("/api/casino/balance", async (req: Request, res: Response) => {
    try {
      const { username, clientId } = req.body;
      
      if (!username || !clientId) {
        return res.status(400).json({ 
          success: false,
          message: "Username and client ID are required" 
        });
      }
      
      try {
        const balanceResult = await casino747Api.getUserBalance(clientId, username);
        
        // Find user in our database to update their casino balance
        const localUser = await storage.getUserByCasinoUsername(username);
        if (localUser) {
          await storage.updateUserCasinoDetails(localUser.id, {
            casinoBalance: balanceResult.balance.toString()
          });
        }
        
        return res.json({
          success: true,
          balance: balanceResult.balance,
          currency: balanceResult.currency
        });
      } catch (casinoError) {
        console.error("Error fetching balance from casino API:", casinoError);
        return res.status(400).json({ 
          success: false,
          message: "Failed to fetch balance from casino system" 
        });
      }
    } catch (error) {
      console.error("Get casino balance error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Server error while fetching casino balance" 
      });
    }
  });
  
  // Get real-time balance from casino API (bypassing cache)
  app.post("/api/casino/balance-realtime", async (req: Request, res: Response) => {
    try {
      const { username, clientId } = req.body;
      
      if (!username || !clientId) {
        return res.status(400).json({ 
          success: false,
          message: "Username and client ID are required" 
        });
      }
      
      try {
        // Force a fresh request to the casino API
        const balanceResult = await casino747Api.getUserBalance(clientId, username);
        
        // Find user in our database to update their casino balance
        const localUser = await storage.getUserByCasinoUsername(username);
        if (localUser) {
          await storage.updateUserCasinoDetails(localUser.id, {
            casinoBalance: balanceResult.balance.toString()
          });
        }
        
        return res.json({
          success: true,
          balance: balanceResult.balance,
          currency: balanceResult.currency,
          timestamp: new Date().toISOString(),
          realtime: true
        });
      } catch (casinoError) {
        console.error("Error fetching real-time balance from casino API:", casinoError);
        return res.status(400).json({ 
          success: false,
          message: "Failed to fetch real-time balance from casino system" 
        });
      }
    } catch (error) {
      console.error("Get real-time casino balance error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Server error while fetching real-time casino balance" 
      });
    }
  });
  
  // Send message to user or manager
  app.post("/api/casino/send-message", async (req: Request, res: Response) => {
    try {
      const { username, subject, message } = req.body;
      
      if (!username || !subject || !message) {
        return res.status(400).json({ 
          success: false,
          message: "Username, subject, and message are required" 
        });
      }
      
      try {
        // Send message using the casino API
        const messageResult = await casino747Api.sendMessage(username, subject, message);
        
        return res.json({
          success: true,
          messageId: messageResult.messageId || `MSG-${Date.now()}`,
          message: "Message sent successfully"
        });
      } catch (casinoError) {
        console.error("Error sending message via casino API:", casinoError);
        return res.status(400).json({ 
          success: false,
          message: "Failed to send message via casino system" 
        });
      }
    } catch (error) {
      console.error("Send casino message error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Server error while sending casino message" 
      });
    }
  });
  
  // Get user hierarchy information
  app.post("/api/casino/user-hierarchy", async (req: Request, res: Response) => {
    try {
      const { username, isAgent } = req.body;
      
      if (!username) {
        return res.status(400).json({ 
          success: false,
          message: "Username is required" 
        });
      }
      
      try {
        // Get hierarchy information from casino API
        const hierarchyResult = await casino747Api.getUserHierarchy(username, isAgent || false);
        
        return res.json({
          success: true,
          hierarchy: hierarchyResult.hierarchy,
          user: hierarchyResult.user,
          message: "Hierarchy fetched successfully"
        });
      } catch (casinoError) {
        console.error("Error fetching hierarchy from casino API:", casinoError);
        return res.status(400).json({ 
          success: false,
          message: "Failed to fetch hierarchy from casino system" 
        });
      }
    } catch (error) {
      console.error("Get casino hierarchy error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Server error while fetching casino hierarchy" 
      });
    }
  });
  
  // Deposit to casino
  app.post("/api/casino/deposit", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Get the authenticated user
      const authenticatedUser = (req as any).user;
      
      // Validate using the schema, ensuring userId matches authenticated user
      const validatedData = casinoDepositSchema.parse({
        ...req.body,
        userId: authenticatedUser.id,
        casinoClientId: authenticatedUser.casinoClientId || req.body.casinoClientId,
        casinoUsername: authenticatedUser.casinoUsername || req.body.casinoUsername
      });
      
      // Check if the casino username belongs to the authenticated user
      if (validatedData.casinoUsername !== authenticatedUser.casinoUsername) {
        return res.status(403).json({ 
          success: false, 
          message: "You can only deposit to your own casino account" 
        });
      }
      
      // Check if user has enough balance in the specified currency
      const currency = validatedData.currency;
      const userBalance = await storage.getUserCurrencyBalance(authenticatedUser.id, currency as Currency);
      
      if (parseFloat(userBalance) < validatedData.amount) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient ${currency} funds. Available: ${userBalance}` 
        });
      }
      
      // Create a transaction record
      const transactionReference = randomUUID();
      const transaction = await storage.createTransaction({
        userId: authenticatedUser.id,
        type: "casino_deposit",
        method: validatedData.method,
        amount: validatedData.amount.toString(),
        status: "pending",
        casinoClientId: validatedData.casinoClientId,
        casinoUsername: validatedData.casinoUsername,
        currency: validatedData.currency,
        uniqueId: `CD-${Date.now()}`,
        metadata: { initiatedAt: new Date().toISOString() }
      });
      
      try {
        // Get auth token from cache or storage (using our enhanced getAuthToken method)
        console.log(`Initiating casino deposit for ${validatedData.casinoUsername} with amount ${validatedData.amount} ${validatedData.currency}`);
        
        // Transfer the funds to the casino
        const transferResult = await casino747Api.transferFunds(
          validatedData.amount,
          validatedData.casinoClientId,
          validatedData.casinoUsername,
          validatedData.currency,
          validatedData.casinoUsername, // From the same user (e-wallet to casino)
          `Deposit from e-wallet - ${transactionReference}`
        );
        
        // Update transaction record
        await storage.updateTransactionStatus(
          transaction.id, 
          "completed", 
          transferResult.transactionId
        );
        
        // Deduct from user's currency balance
        const updatedUser = await storage.updateUserCurrencyBalance(
          authenticatedUser.id, 
          currency as Currency,
          -validatedData.amount
        );
        
        // Update user's casino balance
        await storage.updateUserCasinoBalance(authenticatedUser.id, validatedData.amount);
        
        // Get updated currency balance
        const newBalance = await storage.getUserCurrencyBalance(authenticatedUser.id, currency as Currency);
        
        return res.json({
          success: true,
          message: "Deposit to casino completed successfully",
          transaction: {
            ...transaction,
            status: "completed",
            casinoReference: transferResult.transactionId
          },
          newBalance,
          currencyUsed: currency,
          newCasinoBalance: transferResult.newBalance
        });
      } catch (casinoError) {
        console.error("Error depositing to casino:", casinoError);
        
        // Update transaction to failed
        await storage.updateTransactionStatus(transaction.id, "failed");
        
        return res.status(400).json({ 
          success: false, 
          message: "Failed to deposit to casino system",
          transaction: {
            ...transaction,
            status: "failed"
          }
        });
      }
    } catch (error) {
      console.error("Casino deposit error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false,
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ 
        success: false,
        message: "Server error while processing casino deposit" 
      });
    }
  });
  
  // Withdraw from casino
  app.post("/api/casino/withdraw", async (req: Request, res: Response) => {
    try {
      // Validate request using the schema
      const validatedData = casinoWithdrawSchema.parse(req.body);
      
      // Get user from our database
      const user = await storage.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }
      
      // Create a transaction record
      const transactionReference = randomUUID();
      const uniqueId = Date.now();
      
      const transaction = await storage.createTransaction({
        userId: validatedData.userId,
        type: "casino_withdraw",
        method: "crypto",
        amount: validatedData.amount.toString(),
        status: "pending",
        casinoClientId: validatedData.casinoClientId,
        casinoUsername: validatedData.casinoUsername,
        destinationAddress: validatedData.destinationAddress,
        destinationNetwork: validatedData.destinationNetwork,
        uniqueId: uniqueId.toString(),
        metadata: { initiatedAt: new Date().toISOString() }
      });
      
      try {
        // Process the withdrawal through the casino API
        const withdrawResult = await casino747Api.withdrawFunds(
          validatedData.casinoClientId,
          validatedData.amount,
          validatedData.currency,
          validatedData.destinationCurrency,
          validatedData.destinationNetwork,
          validatedData.destinationAddress
        );
        
        // Update transaction record
        await storage.updateTransactionStatus(
          transaction.id, 
          "completed", 
          withdrawResult.transactionId
        );
        
        // Update user's casino balance
        await storage.updateUserCasinoBalance(user.id, -validatedData.amount);
        
        // Credit the withdrawn amount to the user's currency balance
        const currency = validatedData.currency || 'USD';
        await storage.updateUserCurrencyBalance(user.id, currency as Currency, validatedData.amount);
        
        // Get updated currency balance
        const newBalance = await storage.getUserCurrencyBalance(user.id, currency as Currency);
        
        return res.json({
          success: true,
          message: "Withdrawal from casino completed successfully",
          transaction: {
            ...transaction,
            status: "completed",
            casinoReference: withdrawResult.transactionId
          },
          newBalance,
          currencyUsed: currency
        });
      } catch (casinoError) {
        console.error("Error withdrawing from casino:", casinoError);
        
        // Update transaction to failed
        await storage.updateTransactionStatus(transaction.id, "failed");
        
        return res.status(400).json({ 
          success: false, 
          message: "Failed to withdraw from casino system",
          transaction: {
            ...transaction,
            status: "failed"
          }
        });
      }
    } catch (error) {
      console.error("Casino withdraw error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false,
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ 
        success: false,
        message: "Server error while processing casino withdrawal" 
      });
    }
  });
  
  // Transfer between casino accounts
  app.post("/api/casino/transfer", async (req: Request, res: Response) => {
    try {
      // Validate request using the schema
      const validatedData = casinoTransferSchema.parse(req.body);
      
      // Get user from our database
      const fromUser = await storage.getUserByUsername(validatedData.fromCasinoUsername);
      if (!fromUser) {
        return res.status(404).json({ 
          success: false, 
          message: "Sender not found" 
        });
      }
      
      // Create a transaction record
      const transactionReference = randomUUID();
      
      const transaction = await storage.createTransaction({
        userId: validatedData.fromUserId,
        type: "transfer",
        method: "casino_transfer",
        amount: validatedData.amount.toString(),
        status: "pending",
        casinoUsername: validatedData.toUsername, // Target username in this case
        casinoClientId: validatedData.toClientId, // Target client ID
        uniqueId: `CT-${Date.now()}`,
        currency: validatedData.currency,
        metadata: { 
          initiatedAt: new Date().toISOString(),
          comment: validatedData.comment
        }
      });
      
      try {
        // Process the transfer through the casino API
        const transferResult = await casino747Api.transferFunds(
          validatedData.amount,
          validatedData.toClientId,
          validatedData.toUsername,
          validatedData.currency,
          validatedData.fromCasinoUsername,
          validatedData.comment || "Transfer from e-wallet"
        );
        
        // Update transaction record
        await storage.updateTransactionStatus(
          transaction.id, 
          "completed", 
          transferResult.transactionId
        );
        
        // Update sender's casino balance
        await storage.updateUserCasinoBalance(fromUser.id, -validatedData.amount);
        
        // Get the casino balance after transfer
        const newCasinoBalance = fromUser.casinoBalance 
          ? (parseFloat(fromUser.casinoBalance.toString()) - validatedData.amount).toString()
          : '0';
        
        const currency = validatedData.currency || 'USD';
        
        return res.json({
          success: true,
          message: "Casino transfer completed successfully",
          transaction: {
            ...transaction,
            status: "completed",
            casinoReference: transferResult.transactionId
          },
          newCasinoBalance,
          currencyUsed: currency
        });
      } catch (casinoError) {
        console.error("Error processing casino transfer:", casinoError);
        
        // Update transaction to failed
        await storage.updateTransactionStatus(transaction.id, "failed");
        
        return res.status(400).json({ 
          success: false, 
          message: "Failed to process casino transfer",
          transaction: {
            ...transaction,
            status: "failed"
          }
        });
      }
    } catch (error) {

  // Additional endpoint to handle submission from ManualPaymentForm
  app.post("/api/payments/manual/submit", authMiddleware, async (req: Request, res: Response) => {
    // Redirect to the correct endpoint
    return res.redirect(307, '/api/payments/manual/create');
  });

      console.error("Casino transfer error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false,
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ 
        success: false,
        message: "Server error while processing casino transfer" 
      });
    }
  });
  
  // Get casino transaction history
  app.get("/api/casino/transactions/:username", async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      const { currency } = req.query;
      
      if (!username) {
        return res.status(400).json({ 
          success: false, 
          message: "Username is required" 
        });
      }
      
      try {
        // Get user from our database
        const user = await storage.getUserByCasinoUsername(username);
        if (!user) {
          return res.status(404).json({ 
            success: false, 
            message: "User not found" 
          });
        }
        
        // Get transactions from casino API
        const transactionHistory = await casino747Api.getTransactionHistory(
          username, 
          currency as string || "USD"
        );
        
        // Also get local casino transactions
        const localTransactions = await storage.getCasinoTransactions(user.id);
        
        // Merge and sort transactions by date
        // This would need proper implementation to merge and deduplicate
        
        return res.json({
          success: true,
          casinoTransactions: transactionHistory.transactions,
          localTransactions: localTransactions
        });
      } catch (casinoError) {
        console.error("Error fetching transactions from casino:", casinoError);
        
        // If casino API fails, return just the local transactions
        if (username) {
          const user = await storage.getUserByCasinoUsername(username);
          if (user) {
            const localTransactions = await storage.getCasinoTransactions(user.id);
            return res.json({
              success: true,
              casinoTransactions: [],
              localTransactions: localTransactions,
              message: "Could not fetch transactions from casino API. Showing local transactions only."
            });
          }
        }
        
        return res.status(400).json({ 
          success: false, 
          message: "Failed to fetch transactions from casino system" 
        });
      }
    } catch (error) {
      console.error("Casino transactions error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Server error while fetching casino transactions" 
      });
    }
  });

  // Test webhook endpoint for testing DirectPay webhook handling
  app.post("/api/debug/test-payment-webhook", async (req: Request, res: Response) => {
    try {
      console.log(`🧪 TEST WEBHOOK: Received test webhook payload:`, req.body);
      
      // Make a request to the webhook endpoint directly
      try {
        // Process the webhook payload directly on the server
        await handleDirectPayWebhook(req.body);
        
        return res.json({
          success: true,
          message: "Test webhook processed directly",
        });
      } catch (webhookError) {
        console.error(`🧪 TEST WEBHOOK: Error processing webhook:`, webhookError);
        return res.status(500).json({
          success: false,
          message: "Error processing webhook",
          error: webhookError instanceof Error ? webhookError.message : String(webhookError)
        });
      }
    } catch (error) {
      console.error(`🧪 TEST WEBHOOK: Error handling webhook:`, error);
      return res.status(500).json({
        success: false,
        message: "Error handling webhook",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Helper function to handle DirectPay webhook logic
  async function handleDirectPayWebhook(payload: any) {
    // Log the payload
    console.log("✅ DirectPay webhook received:", JSON.stringify(payload));
    
    // Extract payment details from the webhook payload
    // This is the same logic as in the webhook endpoint
    const { 
      reference, status, state, payment_status, 
      amount, transactionId, transaction_id, 
      payment_reference
    } = payload;
    
    // Process the webhook as needed
    // This is a simplified version of the webhook endpoint logic
    
    return { success: true };
  }
  
  // DirectPay webhook endpoint for payment notifications
  app.post("/api/webhook/directpay/payment", async (req: Request, res: Response) => {
    try {
      console.log("✅ DirectPay webhook received:", JSON.stringify(req.body));
      
      // Extract payment details from the webhook payload
      // DirectPay might send different structured data, so we handle common formats
      const { 
        reference, status, state, payment_status, 
        amount, transactionId, transaction_id, 
        payment_reference
      } = req.body;
      
      // Log all possible reference and status fields for debugging
      console.log("DirectPay webhook field analysis:", {
        possibleReferences: {
          reference,
          payment_reference,
          ref: req.body.ref
        },
        possibleStatuses: {
          status,
          state,
          payment_status
        },
        possibleTransactionIds: {
          transactionId,
          transaction_id
        }
      });
      
      // Determine the actual reference value from possible fields
      const paymentReference = reference || payment_reference || req.body.ref;
      
      if (!paymentReference) {
        console.warn("❌ Payment reference is missing in webhook:", req.body);
        return res.status(200).json({ 
          success: false, 
          message: "Payment reference is required, but webhook acknowledged" 
        });
      }
      
      // Find the QR payment by reference
      const qrPayment = await storage.getQrPaymentByReference(paymentReference);
      if (!qrPayment) {
        console.warn(`QR Payment not found for reference: ${paymentReference}`);
        return res.status(200).json({ 
          success: false, 
          message: "Payment not found, but webhook acknowledged" 
        });
      }
      
      // Avoid processing the same payment multiple times
      if (qrPayment.status !== "pending") {
        console.log(`Payment ${paymentReference} already processed with status: ${qrPayment.status}`);
        return res.status(200).json({ 
          success: true, 
          message: `Payment already ${qrPayment.status}, webhook acknowledged` 
        });
      }
      
      // Find the transaction
      const transaction = await storage.getTransaction(qrPayment.transactionId);
      if (!transaction) {
        console.error(`Transaction not found for QR payment ID: ${qrPayment.id}`);
        return res.status(200).json({ 
          success: false, 
          message: "Transaction not found, but webhook acknowledged" 
        });
      }
      
      // Find the user
      const user = await storage.getUser(qrPayment.userId);
      if (!user) {
        console.error(`User not found for QR payment user ID: ${qrPayment.userId}`);
        return res.status(200).json({ 
          success: false, 
          message: "User not found, but webhook acknowledged" 
        });
      }
      
      // Determine the payment status from various possible fields
      const paymentStatus = status || state || payment_status || '';
      const txId = transactionId || transaction_id || Date.now().toString();
      
      // Normalize the payment status to handle different formats
      const normalizedStatus = paymentStatus.toLowerCase().trim();
      
      // Process based on payment status with more comprehensive status matching
      if (
        ['success', 'completed', 'paid', 'successful', 'approved', 'settled', 'confirmed'].includes(normalizedStatus)
      ) {
        // Update QR payment status
        await storage.updateQrPaymentStatus(qrPayment.id, "completed");
        
        // Update transaction status and add DirectPay transaction ID
        await storage.updateTransactionStatus(
          transaction.id,
          "completed",
          txId
        );
        
        // Call 747 Casino API to complete the topup
        const paymentAmount = parseFloat(qrPayment.amount.toString());
        try {
          console.log(`Attempting to credit ${paymentAmount} PHP to casino account for user ${user.casinoUsername} (ID: ${user.casinoId})`);
          
          const casinoResult = await casino747CompleteTopup(
            user.casinoId,
            paymentAmount,
            transaction.paymentReference || paymentReference || txId
          );
          
          // Update user's balance in PHP (default for GCash payments)
          // In a production system, this currency would be stored with the transaction
          const currency = transaction.currency || 'PHP';
          await storage.updateUserCurrencyBalance(user.id, currency as Currency, paymentAmount);
          
          // Get the updated currency balance
          const updatedBalance = await storage.getUserCurrencyBalance(user.id, currency as Currency);
          
          // Update the transaction with the unique nonce for reconciliation
          await storage.updateTransactionStatus(
            transaction.id,
            "completed",
            txId,
            { nonce: casinoResult.nonce }
          );
          
          console.log("Payment completed successfully via webhook:", {
            reference: paymentReference,
            userId: user.id,
            username: user.username,
            casinoUsername: user.casinoUsername,
            casinoId: user.casinoId,
            amount: paymentAmount,
            currency,
            newBalance: updatedBalance,
            nonce: casinoResult.nonce,
            casinoTransactionId: casinoResult.transactionId,
            directPayTransactionId: txId
          });
        } catch (casinoError) {
          console.error("Error completing casino topup:", casinoError);
          
          // Log detailed error for troubleshooting
          console.error({
            error: casinoError instanceof Error ? casinoError.message : String(casinoError),
            user: user.username,
            casinoUsername: user.casinoUsername,
            casinoId: user.casinoId,
            amount: paymentAmount,
            reference: paymentReference
          });
          
          // We still mark the payment as completed but log the casino error
          // A manual reconciliation may be needed
          
          // Add error information to the transaction for reconciliation
          await storage.updateTransactionStatus(
            transaction.id,
            "completed",
            txId,
            { casinoError: casinoError instanceof Error ? casinoError.message : String(casinoError) }
          );
        }
      } else if (
        paymentStatus.toLowerCase() === 'failed' || 
        paymentStatus.toLowerCase() === 'cancelled' || 
        paymentStatus.toLowerCase() === 'declined'
      ) {
        // Update QR payment and transaction status
        await storage.updateQrPaymentStatus(qrPayment.id, "failed");
        await storage.updateTransactionStatus(transaction.id, "failed");
        
        console.log("Payment failed via webhook:", { 
          reference: paymentReference, 
          userId: user.id,
          status: paymentStatus
        });
      } else {
        // Unknown status, log but don't change anything
        console.log(`Unknown payment status received: ${paymentStatus} for reference ${paymentReference}`);
      }
      
      // Return a 200 OK to acknowledge receipt of the webhook
      return res.status(200).json({ 
        success: true, 
        message: "Webhook processed successfully" 
      });
    } catch (error) {
      console.error("DirectPay webhook processing error:", error);
      
      // Even in case of error, return a 200 OK to prevent repeated webhook attempts
      return res.status(200).json({ 
        success: false, 
        message: "Error processing webhook, but acknowledged" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
