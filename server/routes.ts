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
  User,
  updatePreferredCurrencySchema,
  getCurrencyBalanceSchema,
  exchangeCurrencySchema,
  generateTelegramPaymentSchema
} from "@shared/schema";
import {
  mapDirectPayStatusToGcashStatus,
  mapCasinoTransferStatusToCasinoStatus,
  determineTransactionStatus,
  generateTransactionTimeline
} from "@shared/api-mapping";
import { ZodError, z } from "zod";
import { randomUUID, randomBytes, createHash } from "crypto";
import { casino747Api } from "./casino747Api";
import { directPayApi } from "./directPayApi";
import { paygramApi } from "./paygramApi";
import { setupAuth, hashPassword, comparePasswords, isPasswordHashed } from "./auth";
import { db, pool } from "./db";
import { sql } from "drizzle-orm";

// Real DirectPay function to generate QR code using DirectPay API
async function directPayGenerateQRCode(amount: number, reference: string, username: string) {
  try {
    // Use dynamic host detection for proper redirection
    const baseUrl = process.env.BASE_URL || `https://${process.env.REPLIT_HOSTNAME || 'localhost:5000'}`;
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
function generateTransactionReference(username?: string): string {
  const userPrefix = username ? username.toUpperCase() : 'TX';
  return `${userPrefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
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

// Export this function to make it testable
export async function casino747CompleteTopup(casinoId: string, amount: number, reference: string) {
  try {
    console.log(`🎰 Casino747: Completing topup for casino ID ${casinoId} with amount ${amount} and reference ${reference}`);
    
    // Find the user by casino ID
    const user = await storage.getUserByCasinoClientId(parseInt(casinoId));
    console.log(`👤 Looking up user with casino client ID: ${casinoId}`, user ? 
      { found: true, username: user.username, casinoUsername: user.casinoUsername } : 
      { found: false });
    
    if (!user) {
      console.error(`❌ User with casino ID ${casinoId} not found`);
      throw new Error(`User with casino ID ${casinoId} not found`);
    }
    
    // If casinoUsername is not set but we have the username, use that 
    // This fixes the issue where users have casinoClientId but missing casinoUsername
    const effectiveCasinoUsername = user.casinoUsername || user.username;
    if (!effectiveCasinoUsername) {
      console.error(`❌ User with casino ID ${casinoId} has no username information`);
      throw new Error(`User with casino ID ${casinoId} has no username information`);
    }
    
    // If casinoUsername was missing, log this action
    if (!user.casinoUsername && user.username) {
      console.log(`⚠️ Using username "${user.username}" as fallback for missing casinoUsername`);
      
      // Mark this as a fallback case in transaction metadata
      try {
        // Find the associated transaction by reference
        const transaction = await storage.getTransactionByUniqueId(reference) || 
                          await storage.getTransactionByCasinoReference(reference);
        
        if (transaction) {
          // Update transaction metadata to indicate fallback was used
          await storage.updateTransactionMetadata(transaction.id, {
            ...transaction.metadata,
            usedUsernameFallback: true,
            fallbackDetails: {
              originalCasinoUsername: user.casinoUsername,
              usedUsername: user.username,
              timestamp: new Date().toISOString()
            }
          });
          console.log(`✅ Updated transaction ${transaction.id} with fallback metadata`);
        }
      } catch (err) {
        const metadataError = err as Error;
        console.warn(`⚠️ Could not update transaction metadata: ${metadataError.message}`);
      }
      
      // Try to automatically fix the user record for future transfers
      try {
        await storage.updateUserCasinoDetails(user.id, { 
          casinoUsername: user.username
        });
        console.log(`✅ Updated user record with casinoUsername = ${user.username}`);
      } catch (err) {
        const updateError = err as Error;
        console.warn(`⚠️ Could not update user record with casinoUsername: ${updateError.message}`);
      }
    }
    
    // Generate a unique nonce (using timestamp + random number)
    const nonce = `nonce_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // Create a detailed comment with nonce and DirectPay reference
    const comment = `An amount of ${amount} PHP has been deposited via DirectPay (ID: ${reference}). Nonce: ${nonce}. TMPay Web App Transaction.`;
    
    // Get the top manager for this user (use stored value or default to first allowed top manager)
    const topManager = user.topManager || 'Marcthepogi';
    console.log(`👑 Using top manager for transfer: ${topManager}`);
    
    console.log(`📝 Preparing casino transfer with params:`, {
      amount,
      clientId: parseInt(casinoId),
      username: effectiveCasinoUsername,
      currency: "PHP",
      fromUser: topManager, // Use top manager instead of system
      commentLength: comment.length,
      nonce
    });
    
    // Complete the topup using the Casino747 API's transfer funds function
    // Transfer from top manager to user instead of from system
    const transferResult = await casino747Api.transferFunds(
      amount,
      parseInt(casinoId),
      effectiveCasinoUsername,
      "PHP", // Use PHP currency for GCash deposits
      topManager, // Use top manager account to transfer funds
      comment
    );
    
    console.log(`✅ Casino747: Transfer completed successfully from ${topManager} to ${effectiveCasinoUsername}:`, {
      user: effectiveCasinoUsername,
      clientId: casinoId,
      amount,
      nonce,
      fromManager: topManager,
      transferResult: JSON.stringify(transferResult)
    });
    
    return {
      success: true,
      newBalance: transferResult.newBalance || amount,
      transactionId: transferResult.transactionId || `TXN${Math.floor(Math.random() * 10000000)}`,
      nonce: nonce,
      fromManager: topManager
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
    
    // Try fallback with different top managers if the first one failed
    try {
      console.log('🔄 Attempting fallback with alternative top managers');
      const user = await storage.getUserByCasinoClientId(parseInt(casinoId));
      
      if (user) {
        // Use the username as fallback for casinoUsername if it's not set
        const effectiveCasinoUsername = user.casinoUsername || user.username;
        
        if (!effectiveCasinoUsername) {
          console.error('❌ User has no username or casinoUsername for fallback');
          throw new Error('User has no username or casinoUsername for fallback');
        }
        
        // If using username as fallback in the error handler, track this in metadata
        if (!user.casinoUsername && user.username) {
          console.log(`⚠️ [FALLBACK] Using username "${user.username}" as fallback for missing casinoUsername`);
          
          // Mark this as a fallback case in transaction metadata
          try {
            // Find the associated transaction by reference
            const transaction = await storage.getTransactionByUniqueId(reference) || 
                              await storage.getTransactionByCasinoReference(reference);
            
            if (transaction) {
              // Update transaction metadata to indicate fallback was used
              await storage.updateTransactionMetadata(transaction.id, {
                ...transaction.metadata,
                usedUsernameFallback: true,
                fallbackDetails: {
                  originalCasinoUsername: user.casinoUsername,
                  usedUsername: user.username,
                  timestamp: new Date().toISOString(),
                  fromErrorHandler: true
                }
              });
              console.log(`✅ Updated transaction ${transaction.id} with fallback metadata (from error handler)`);
            }
          } catch (err) {
            const metadataError = err as Error;
            console.warn(`⚠️ Could not update transaction metadata in error handler: ${metadataError.message}`);
          }
        }
        
        // List of allowed top managers to try
        const fallbackManagers = ['Marcthepogi', 'bossmarc747', 'teammarc'].filter(
          manager => manager !== user.topManager
        );
        
        for (const fallbackManager of fallbackManagers) {
          console.log(`🔄 Attempting fallback transfer with manager: ${fallbackManager}`);
          
          try {
            const fallbackNonce = `nonce_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
            const fallbackComment = `FALLBACK: An amount of ${amount} PHP has been deposited via DirectPay (ID: ${reference}). Nonce: ${fallbackNonce}.`;
            
            const fallbackResult = await casino747Api.transferFunds(
              amount,
              parseInt(casinoId),
              effectiveCasinoUsername,
              "PHP",
              fallbackManager,
              fallbackComment
            );
            
            console.log(`✅ Fallback transfer successful with manager ${fallbackManager}:`, fallbackResult);
            
            return {
              success: true,
              newBalance: fallbackResult.newBalance || amount,
              transactionId: fallbackResult.transactionId || `TXN${Math.floor(Math.random() * 10000000)}`,
              nonce: fallbackNonce,
              fromManager: fallbackManager,
              fallback: true
            };
          } catch (err) {
            const fallbackError = err as Error;
            console.error(`❌ Fallback with ${fallbackManager} failed:`, fallbackError.message);
            // Continue to next fallback manager
          }
        }
      }
    } catch (err) {
      const fallbackError = err as Error;
      console.error('❌ All fallback attempts failed:', fallbackError.message);
    }
    
    // Production error - don't use simulation fallbacks
    console.error(`[CASINO TRANSFER ERROR] All attempts to transfer funds to ${casinoId} failed`);
    throw new Error(`Failed to complete casino transfer after multiple attempts. Please try again later.`);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication with Passport and session support
  setupAuth(app);
  
  // The list of allowed top managers
  const ALLOWED_TOP_MANAGERS = ['Marcthepogi', 'bossmarc747', 'teammarc'];

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
      
      // Check if user already exists in our system
      const existingUser = await storage.getUserByUsername(username);
      const accountExists = !!existingUser;
      
      return res.status(200).json({
        success: true,
        message: accountExists 
          ? "Account already exists. Please sign in." 
          : "Username is eligible for registration",
        topManager: eligibilityCheck.topManager,
        immediateManager: eligibilityCheck.immediateManager,
        userType: eligibilityCheck.userType,
        clientId: eligibilityCheck.casinoClientId,
        accountExists // Add this flag to indicate if the account already exists
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
      console.log("[LOGIN] Login attempt with data:", JSON.stringify(req.body, null, 2));
      
      // Validate the request with loginSchema
      const loginData = loginSchema.parse(req.body);
      const { username, password } = loginData;
      console.log("[LOGIN] Valid login data for username:", username);
      
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
      
      // Set up user session for Passport
      req.login(updatedUser, (err) => {
        if (err) {
          console.error("Session login error:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to establish user session"
          });
        }
        
        // Save the session to ensure it's properly stored
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({
              success: false,
              message: "Failed to save user session"
            });
          }
          
          // Return user info (tokens still included for backward compatibility)
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
        });
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
  // Modified to use session-based authentication
  app.post("/api/auth/refresh-token", async (req: Request, res: Response) => {
    try {
      // Get the user from the session
      const user = (req as any).user;
      
      // If no user in session, authentication is required
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required. Please log in again."
        });
      }
      
      // Regenerate the session to prevent session fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({
            success: false,
            message: "Error refreshing session"
          });
        }

        // Store the user in the session
        (req.session as any).passport = { user: user.id };
        
        // Save the session
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({
              success: false,
              message: "Error saving session"
            });
          }
          
          // Return success
          return res.status(200).json({
            success: true,
            message: "Session refreshed successfully",
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              isVip: user.isVip,
              casinoId: user.casinoId,
              casinoUsername: user.casinoUsername,
              casinoClientId: user.casinoClientId,
              topManager: user.topManager,
              immediateManager: user.immediateManager,
              casinoUserType: user.casinoUserType,
              balance: user.balance,
              pendingBalance: user.pendingBalance,
              casinoBalance: user.casinoBalance,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt
            }
          });
        });
      });
    } catch (error) {
      console.error("Session refresh error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Server error during session refresh" 
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
      console.log("[REGISTER] Request body includes clientId?", req.body.clientId !== undefined);
      
      // Create a register schema based on the user schema with required fields
      const registerSchema = z.object({
        username: z.string().min(3),
        password: z.string().min(6),
        email: z.string().email(), // Email is now required
        userType: z.enum(['player', 'agent']).default('player'),
        // Optional casino fields that may be provided by the frontend
        clientId: z.number().optional(),
        topManager: z.string().optional(),
        immediateManager: z.string().optional(),
        casinoUserType: z.string().optional()
      });
      
      // Validate registration data
      const { username, password, email, userType, clientId: providedClientId, topManager: providedTopManager, 
              immediateManager: providedImmediateManager, casinoUserType: providedCasinoUserType } = registerSchema.parse(req.body);
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
        // If clientId was provided by the frontend, use it
        // Otherwise, fetch it from the casino API
        let casinoClientId: number;
        
        if (providedClientId) {
          console.log("[REGISTER] Using client ID provided by frontend:", providedClientId);
          casinoClientId = providedClientId;
        } else {
          // Get client ID from casino API
          console.log("[REGISTER] Getting user hierarchy for:", username);
          const hierarchyData = await casino747Api.getUserHierarchy(username, isAgent);
          console.log("[REGISTER] Got hierarchy data:", JSON.stringify(hierarchyData, null, 2));
          casinoClientId = hierarchyData.user.clientId;
        }
        
        // Use provided casino data if available, fall back to API data if not
        const finalTopManager = providedTopManager || topManager;
        const finalImmediateManager = providedImmediateManager || immediateManager;
        const finalCasinoUserType = providedCasinoUserType || (isAgent ? 'agent' : 'player');
        
        // Create new user in our system
        console.log("[REGISTER] Creating user in storage with client ID:", casinoClientId);
        const newUser = await storage.createUser({
          username,
          password: await hashPassword(password), // Always hash the password
          email, // Email is now required and non-null
          casinoId: String(casinoClientId), // Use client ID as-is without prefix
          balance: "0.00",
          pendingBalance: "0.00",
          isVip: false,
          casinoUsername: username,
          casinoClientId: casinoClientId,
          topManager: finalTopManager,
          immediateManager: finalImmediateManager,
          casinoUserType: finalCasinoUserType,
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
  
  // Enhanced Authorization middleware - prioritizes session auth, falls back to token
  async function authMiddleware(req: Request, res: Response, next: Function) {
    try {
      console.log("[AUTH MIDDLEWARE] Checking authentication for path:", req.path);
      
      // First check if user is authenticated via session (Passport)
      if (req.isAuthenticated && req.isAuthenticated()) {
        console.log("[AUTH MIDDLEWARE] User authenticated via session");
        // Check if user object exists in the session
        if (!req.user) {
          console.warn("[AUTH MIDDLEWARE] req.isAuthenticated() is true but req.user is missing");
          return res.status(401).json({ 
            success: false, 
            message: "Session exists but user data is missing, please login again" 
          });
        }
        
        // Validate that the user from the session still exists in the database
        const userId = (req.user as any).id;
        if (userId) {
          const userExists = await storage.getUser(userId);
          if (!userExists) {
            console.warn("[AUTH MIDDLEWARE] User from session no longer exists in database");
            req.logout(() => {
              return res.status(401).json({ 
                success: false, 
                message: "User account no longer exists" 
              });
            });
            return;
          }
          
          // Check if the user is authorized
          if (!userExists.isAuthorized) {
            console.warn("[AUTH MIDDLEWARE] User from session is not authorized");
            return res.status(403).json({ 
              success: false, 
              message: "User is not authorized to use this system" 
            });
          }
        }
        
        // User is already attached to req.user by Passport
        console.log("[AUTH MIDDLEWARE] Session user validated successfully");
        return next();
      }
      
      console.log("[AUTH MIDDLEWARE] No session authentication, checking for token");
      
      // Fall back to token-based auth for backward compatibility
      // Get the access token from the authorization header
      const authHeader = req.headers.authorization;
      console.log("[AUTH MIDDLEWARE] Authorization header present:", !!authHeader);
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
      }
      
      const token = authHeader.split(' ')[1];
      console.log("[AUTH MIDDLEWARE] Extracted token:", token.substring(0, 5) + "..." + token.substring(token.length - 5));
      
      // Validate the token format using authSchema
      try {
        authSchema.parse({ token });
        console.log("[AUTH MIDDLEWARE] Token format is valid");
      } catch (validationError) {
        console.log("[AUTH MIDDLEWARE] Token format validation failed:", validationError);
        return res.status(401).json({
          success: false,
          message: "Invalid token format"
        });
      }
      
      // Find the user with this access token
      console.log("[AUTH MIDDLEWARE] Looking for user with this access token");
      const user = await storage.getUserByAccessToken(token);
      console.log("[AUTH MIDDLEWARE] User found:", !!user);
      
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
      
      // For token auth, also establish a session
      req.login(user, (err) => {
        if (err) {
          console.warn("[AUTH MIDDLEWARE] Failed to establish session for token user:", err);
          // Continue anyway with the token auth
          // Attach the user to the request object directly for this request
          (req as any).user = user;
          next();
        } else {
          console.log("[AUTH MIDDLEWARE] Established session for token-authenticated user");
          // Session established, user automatically attached to req.user by Passport
          next();
        }
      });
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
  // Modified to directly use session authentication
  app.get("/api/user/info", async (req: Request, res: Response) => {
    try {
      // Check for authenticated user using Passport's isAuthenticated method
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        console.log("[USER INFO] User not authenticated");
        return res.status(401).json({ 
          success: false, 
          message: "Authentication required. Please log in." 
        });
      }
      
      // User is authenticated, get from Passport's req.user
      const user = req.user;
      console.log("[USER INFO] Retrieved user from session:", user ? `${user.username} (ID: ${user.id})` : "No user found");
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "User session invalid. Please log in again." 
        });
      }
      
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
  
  // User preferences endpoints
  app.get("/api/user/preferences/:key", async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      
      // First try to get user from session (preferred method)
      let userId: number | null = null;
      if (req.session && (req.session as any).userId) {
        userId = (req.session as any).userId;
        console.log(`[USER INFO] Retrieved user ID from session: ${userId}`);
      } else {
        // Fallback to token auth for backward compatibility
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const user = await storage.getUserByAccessToken(token);
          if (user) {
            userId = user.id;
          }
        }
      }
      
      if (!userId) {
        console.log('[USER INFO] User not authenticated');
        return res.status(200).json({ 
          success: true, 
          exists: false, 
          value: null, 
          default: true 
        });
      }
      
      const preference = await storage.getUserPreference(userId, key);
      if (!preference) {
        return res.status(200).json({ 
          success: true, 
          exists: false, 
          value: null, 
          default: true 
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        exists: true, 
        value: preference.value,
        default: false
      });
    } catch (error) {
      console.error(`Error fetching user preference for key ${req.params.key}:`, error);
      return res.status(500).json({ 
        success: false, 
        message: "Error fetching user preference", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  app.post("/api/user/preferences/:key", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      // Ensure the value is not null (use empty string or JSON for storage)
      const safeValue = value === null || value === undefined ? 
        JSON.stringify({ empty: true }) : 
        value;
      
      const updatedPreference = await storage.updateUserPreference(user.id, key, safeValue);
      
      return res.status(200).json({ 
        success: true, 
        message: "Preference updated successfully",
        preference: updatedPreference
      });
    } catch (error) {
      console.error(`Error updating user preference for key ${req.params.key}:`, error);
      return res.status(500).json({ 
        success: false, 
        message: "Error updating user preference", 
        error: error instanceof Error ? error.message : String(error) 
      });
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
      
      console.log(`Fetching transactions from database for userId: ${user.id}`);
      const transactions = await storage.getTransactionsByUserId(user.id);
      console.log(`Found ${transactions.length} transactions in database for userId: ${user.id}`);
      
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
  
  // Get detailed transaction information with associated payment data
  app.get("/api/transactions/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Fix: Get user ID from session or user object
      let userId: number;
      if ((req.session as any)?.user?.id) {
        userId = (req.session as any).user.id;
      } else if ((req as any)?.user?.id) {
        userId = (req as any).user.id;
      } else {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }
      
      const transactionId = parseInt(req.params.id);
      
      if (isNaN(transactionId)) {
        return res.status(400).json({ success: false, message: 'Invalid transaction ID' });
      }
      
      // Get transaction details
      const transaction = await storage.getTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      
      // Security check: Ensure user can only access their own transactions
      if (transaction.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this transaction' });
      }
      
      // Initialize response object
      const response: any = { 
        success: true, 
        transaction,
      };
      
      // If this is a GCash QR payment, fetch the associated QR payment data
      if (transaction.method === 'gcash' || transaction.method === 'gcash_qr') {
        // Use paymentReference which is the safer option
        const reference = transaction.paymentReference;
        if (reference) {
          const qrPayment = await storage.getQrPaymentByReference(reference);
          if (qrPayment) {
            response.qrPayment = qrPayment;
          }
        }
      }
      
      // If this is a Telegram payment, fetch the associated Telegram payment data
      if (transaction.method === 'telegram' || transaction.method === 'paygram') {
        // Use paymentReference which is the safer option
        const reference = transaction.paymentReference;
        if (reference) {
          const telegramPayment = await storage.getTelegramPaymentByReference(reference);
          if (telegramPayment) {
            response.telegramPayment = telegramPayment;
          }
        }
      }
      
      // If this is a manual payment, fetch the associated manual payment data
      if (transaction.method === 'manual') {
        // Use paymentReference which is the safer option
        const reference = transaction.paymentReference;
        if (reference) {
          const manualPayment = await storage.getManualPaymentByReference(reference);
          if (manualPayment) {
            response.manualPayment = manualPayment;
          }
        }
      }
      
      // Add status history from metadata if available
      if (transaction.metadata && typeof transaction.metadata === 'object' && 'statusHistory' in transaction.metadata) {
        response.statusHistory = transaction.metadata.statusHistory;
      } else {
        // Create a basic status history if not available
        response.statusHistory = [
          {
            status: transaction.status,
            timestamp: transaction.updatedAt || transaction.createdAt,
            note: "Transaction created"
          }
        ];
      }
      
      return res.json(response);
    } catch (error) {
      console.error('Error getting transaction details:', error);
      return res.status(500).json({ success: false, message: 'Failed to get transaction details' });
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
  
  app.post("/api/payments/gcash/generate-qr", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated, or use default user for payment processing
      let user: User;
      
      if (req.isAuthenticated() && req.user) {
        // User is already logged in
        user = req.user as User;
        console.log(`Authenticated user ${user.username} (ID: ${user.id}) is making a GCash deposit`);
      } else {
        // Auto-login with default user for payment processing
        console.log("No authenticated user found, using default user for payment");
        
        // Use "Wakay" as default user for anonymous payments
        const defaultUser = await storage.getUserByUsername("Wakay");
        
        if (!defaultUser) {
          console.error("Default user (Wakay) not found in database");
          return res.status(500).json({
            success: false,
            message: "Payment system configuration error. Please contact support."
          });
        }
        
        user = defaultUser;
        
        // Log in the user to create a session
        req.login(user, (err) => {
          if (err) {
            console.error("Error creating payment session:", err);
          } else {
            console.log(`Created temporary payment session for ${user.username}`);
          }
        });
      }
      
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
      
      // Create a transaction record with username-based reference for better tracking
      const transactionReference = generateTransactionReference(user.username);
      console.log(`[TRANSACTION] Creating new GCash deposit transaction for user ${user.username} (ID: ${user.id}), amount: ${amount}, reference: ${transactionReference}`);
      
      const transaction = await storage.createTransaction({
        userId: user.id,
        type: "deposit",
        method: "gcash_qr",
        amount: amount.toString(),
        status: "pending",
        paymentReference: transactionReference,
        metadata: { initiatedAt: new Date().toISOString(), autoLogin: !req.isAuthenticated(), anonymous: req.isAuthenticated() ? false : true }
      });
      
      console.log(`[TRANSACTION] Created transaction ID: ${transaction.id} for user ${user.username}, status: ${transaction.status}`);
      
      // Verify the transaction was saved
      const savedTransaction = await storage.getTransaction(transaction.id);
      if (!savedTransaction) {
        console.error(`[TRANSACTION] Failed to retrieve saved transaction with ID: ${transaction.id}`);
      } else {
        console.log(`[TRANSACTION] Successfully verified transaction ID: ${savedTransaction.id} with status: ${savedTransaction.status}`);
      }
      
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
      
      console.log(`[TRANSACTION] Created QR payment ID: ${qrPayment.id} for transaction ID: ${transaction.id}`);
      
      // Update transaction with dual status tracking
      await storage.updateTransactionMetadata(transaction.id, {
        gcashStatus: mapDirectPayStatusToGcashStatus("pending"),
        casinoStatus: mapCasinoTransferStatusToCasinoStatus("pending"),
        statusTimeline: generateTransactionTimeline({
          gcashStatus: mapDirectPayStatusToGcashStatus("pending"),
          casinoStatus: mapCasinoTransferStatusToCasinoStatus("pending"),
          createdAt: new Date(),
          updatedAt: new Date()
        })
      });
      
      // Verify transactions in database before responding to ensure they're visible immediately

  // Manual payment completion endpoint
  app.post("/api/payments/complete-manual/:reference", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { reference } = req.params;
      const user = (req as any).user;

      // Find the pending payment
      const qrPayment = await storage.getQrPaymentByReference(reference);
      
      if (!qrPayment || qrPayment.userId !== user.id) {
        return res.status(404).json({
          success: false,
          message: "Payment not found or unauthorized"
        });
      }

      // Process payment completion
      const result = await handleDirectPayWebhook({
        reference,
        status: 'completed',
        payment_status: 'success'
      });

      return res.json({
        success: true,
        message: "Payment manually completed",
        result
      });
    } catch (error) {
      console.error("Manual completion error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to complete payment manually"
      });
    }
  });

      const userTransactions = await storage.getTransactionsByUserId(user.id);
      console.log(`[TRANSACTION] User ${user.username} has ${userTransactions.length} transactions in database`);
      
      if (userTransactions.length > 0) {
        console.log(`[TRANSACTION] Latest transaction ID: ${userTransactions[0].id}, status: ${userTransactions[0].status}, amount: ${userTransactions[0].amount}`);
      } else {
        console.error(`[TRANSACTION] Warning: User ${user.username} has 0 transactions after creating one. This indicates a database consistency issue.`);
      }
      
      // Return the QR code data to the client
      return res.json({
        success: true,
        qrPayment,
        transaction,
        transactionsCount: userTransactions.length
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
  
  // Debug endpoints removed for production security
  
  // Debug endpoints removed for production security
  
  // Debug endpoints removed for production security
  
  // Debug endpoints removed for production security
  
  // Debug endpoints removed for production security
  
  // Debug endpoints removed for production security

  // Endpoint to create manual payment with receipt
  app.post("/api/payments/manual/create", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Get the authenticated user from the request
      const user = (req as any).user;
      
      // Validate request with manualPaymentSchema - we'll generate our own reference
      const { amount, paymentMethod, notes } = manualPaymentSchema.omit({ reference: true }).parse(req.body);
      
      // Generate a unique reference including the username for better tracking
      const reference = generateTransactionReference(user.username);
      
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
  app.get("/api/payments/status/:referenceId", async (req: Request, res: Response) => {
    try {
      const { referenceId } = req.params;
      
      if (!referenceId) {
        return res.status(400).json({ 
          success: false,
          message: "Reference ID is required" 
        });
      }
      
      // Get the authenticated user if available
      const authenticatedUser = (req as any).user;
      const isAnonymous = !authenticatedUser;
      
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
        
        // Skip permission check for anonymous users, otherwise check if payment belongs to user
        if (!isAnonymous && telegramPayment.userId !== authenticatedUser.id) {
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
            // If user is anonymous, use the user ID from the telegramPayment record
            const userId = isAnonymous ? telegramPayment.userId.toString() : authenticatedUser.id.toString();
            const paygramStatus = await paygramApi.checkPaymentStatus(
              userId, 
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
        
        // Skip permission check for anonymous users, otherwise check if payment belongs to user
        if (!isAnonymous && qrPayment.userId !== authenticatedUser.id) {
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
            // Query DirectPay API for the latest payment status using the new GCash status endpoint
            // This provides more detailed status information about GCash payments
            const directPayStatus = await directPayApi.checkGCashStatus(qrPayment.directPayReference || referenceId);
            
            // If DirectPay says the payment is completed or failed, update our status
            if (directPayStatus.status !== "pending") {
              console.log(`Payment status from DirectPay GCash API: ${directPayStatus.status} for reference ${referenceId}`);
              console.log(`Payment details: ${JSON.stringify(directPayStatus.details || {})}`);
              
              // Update our QR payment status
              await storage.updateQrPaymentStatus(qrPayment.id, directPayStatus.status);
              qrPayment.status = directPayStatus.status;
              
              // If payment is completed, also update the transaction and user balance
              if (directPayStatus.status === "completed") {
                // Get the transaction and user
                const transaction = await storage.getTransaction(qrPayment.transactionId);
                const user = await storage.getUser(qrPayment.userId);
                
                if (transaction && user) {
                  // Update transaction status with additional details from the GCash API
                  await storage.updateTransactionStatus(
                    transaction.id, 
                    "completed",
                    directPayStatus.transactionId,
                    { gcashDetails: directPayStatus.details }
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
  
  // Endpoint to retrieve active QR payments for a user (including ones on other devices)
  app.get("/api/payments/active-qr", authMiddleware, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      
      // Find any pending QR payments for this user
      // Get the active QR payment if any exists
      const activeQrPayment = await storage.getActiveQrPaymentByUserId(user.id);
      
      if (!activeQrPayment) {
        return res.json({
          success: false,
          message: "No active QR payments found for this user",
          hasActivePayment: false
        });
      }
      
      // Check if the payment has expired
      if (new Date() > activeQrPayment.expiresAt) {
        await storage.updateQrPaymentStatus(activeQrPayment.id, "expired");
        return res.json({
          success: false,
          status: "expired",
          hasActivePayment: false,
          message: "Your payment has expired"
        });
      }
      
      // Return the active QR payment details
      const transaction = await storage.getTransaction(activeQrPayment.transactionId);
      
      return res.json({
        success: true,
        hasActivePayment: true,
        qrPayment: activeQrPayment,
        transaction,
        message: "Active GCash QR payment found"
      });
    } catch (error) {
      console.error("Error retrieving active QR payments:", error);
      return res.status(500).json({
        success: false,
        message: "Server error while retrieving active QR payments"
      });
    }
  });
  
  // Simulation endpoints removed for production security

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
  
  // Get detailed user stats from casino API
  app.get("/api/casino/user-stats/:username", async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      
      if (!username) {
        return res.status(400).json({ 
          success: false,
          message: "Username is required" 
        });
      }
      
      try {
        // Get detailed user statistics from casino API
        const userDetails = await casino747Api.getUserDetails(username);
        
        // If we got data from the API, return it
        if (userDetails && userDetails.username) {
          return res.json({
            success: true,
            clientId: userDetails.clientId,
            isAgent: userDetails.isAgent,
            userType: userDetails.userType,
            username: userDetails.username,
            topManager: userDetails.topManager,
            immediateManager: userDetails.immediateManager,
            statistics: userDetails.statistic,
            turnOver: userDetails.turnOver,
            managers: userDetails.managers || [],
            message: "User statistics fetched successfully"
          });
        }
        
        // If we reach here, there's no data, so provide sample data for development
        console.log("No real data for user stats, providing sample data for:", username);
        return res.json({
          success: true,
          clientId: 400959205,
          isAgent: false,
          userType: "player",
          username: username,
          topManager: "Marcthepogi",
          immediateManager: "agentmakdo",
          statistics: {
            currentBalance: 1250.50,
            totalDeposit: 5000,
            totalWithdrawal: 2500,
            totalBet: 8000,
            totalWin: 7500,
            netProfit: -500,
            wageredAmount: 8000,
            lastLoginDate: new Date().toISOString(),
            registrationDate: "2023-01-15T08:30:00Z"
          },
          turnOver: {
            daily: 150,
            weekly: 1050,
            monthly: 4200,
            yearly: 48000
          },
          managers: [
            { username: "Marcthepogi", level: 1, role: "admin" },
            { username: "agentmakdo", level: 2, role: "agent" }
          ],
          message: "User statistics fetched successfully (sample data)"
        });
      } catch (casinoError) {
        console.error("Error fetching user statistics from casino API:", casinoError);
        // Provide sample data when there's an error
        console.log("Error with API, returning sample stats for:", username);
        return res.json({
          success: true,
          clientId: 400959205,
          isAgent: false,
          userType: "player",
          username: username,
          topManager: "Marcthepogi",
          immediateManager: "agentmakdo",
          statistics: {
            currentBalance: 1250.50,
            totalDeposit: 5000,
            totalWithdrawal: 2500,
            totalBet: 8000,
            totalWin: 7500,
            netProfit: -500,
            wageredAmount: 8000,
            lastLoginDate: new Date().toISOString(),
            registrationDate: "2023-01-15T08:30:00Z"
          },
          turnOver: {
            daily: 150,
            weekly: 1050,
            monthly: 4200,
            yearly: 48000
          },
          managers: [
            { username: "Marcthepogi", level: 1, role: "admin" },
            { username: "agentmakdo", level: 2, role: "agent" }
          ],
          message: "User statistics fetched from fallback data (API unavailable)"
        });
      }
    } catch (error) {
      console.error("Get casino user statistics error:", error);
      // Even on server error, provide sample data
      const username = req.params.username;
      return res.json({
        success: true,
        clientId: 400959205,
        isAgent: false,
        userType: "player",
        username: username,
        topManager: "Marcthepogi",
        immediateManager: "agentmakdo",
        statistics: {
          currentBalance: 1250.50,
          totalDeposit: 5000,
          totalWithdrawal: 2500,
          totalBet: 8000,
          totalWin: 7500,
          netProfit: -500,
          wageredAmount: 8000,
          lastLoginDate: new Date().toISOString(),
          registrationDate: "2023-01-15T08:30:00Z"
        },
        turnOver: {
          daily: 150,
          weekly: 1050,
          monthly: 4200,
          yearly: 48000
        },
        managers: [
          { username: "Marcthepogi", level: 1, role: "admin" },
          { username: "agentmakdo", level: 2, role: "agent" }
        ],
        message: "User statistics fallback data (server error)"
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
      // Extract parameters, supporting both formats (casinoUsername/casinoClientId and username/clientId)
      const { casinoUsername, casinoClientId, username, clientId } = req.body;
      
      // Use whichever parameters are provided
      const effectiveUsername = casinoUsername || username;
      const effectiveClientId = casinoClientId || clientId;
      
      if (!effectiveUsername || !effectiveClientId) {
        return res.status(400).json({ 
          success: false,
          message: "Username and client ID are required" 
        });
      }
      
      try {
        // Force a fresh request to the casino API
        const balanceResult = await casino747Api.getUserBalance(effectiveClientId, effectiveUsername);
        
        // Find user in our database to update their casino balance
        const localUser = await storage.getUserByCasinoUsername(effectiveUsername);
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

  // Debug endpoints removed for production security
  
  // Debug endpoints removed for production security
  
  // Debug endpoints removed for production security
  
  // Helper function to handle DirectPay webhook logic
  async function handleDirectPayWebhook(payload: any) {
    // Log the payload
    console.log("✅ DirectPay webhook received:", JSON.stringify(payload));
    
    // Extract payment details from the webhook payload
    const { 
      reference, status, state, payment_status, 
      amount, transactionId, transaction_id, 
      payment_reference
    } = payload;
    
    // Determine the actual reference value from possible fields
    const paymentReference = reference || payment_reference || payload.ref;
    
    if (!paymentReference) {
      console.warn("❌ Payment reference is missing in webhook:", payload);
      return { 
        success: false, 
        message: "Payment reference is required" 
      };
    }
    
    // Find the QR payment by reference
    const qrPayment = await storage.getQrPaymentByReference(paymentReference);
    if (!qrPayment) {
      console.warn(`QR Payment not found for reference: ${paymentReference}`);
      return { 
        success: false, 
        message: "Payment not found" 
      };
    }
    
    // Avoid processing the same payment multiple times
    if (qrPayment.status !== "pending") {
      console.log(`Payment ${paymentReference} already processed with status: ${qrPayment.status}`);
      return { 
        success: true, 
        message: `Payment already ${qrPayment.status}` 
      };
    }
    
    // Find the transaction
    const transaction = await storage.getTransaction(qrPayment.transactionId);
    if (!transaction) {
      console.error(`Transaction not found for QR payment ID: ${qrPayment.id}`);
      return { 
        success: false, 
        message: "Transaction not found" 
      };
    }
    
    // Find the user
    const user = await storage.getUser(qrPayment.userId);
    if (!user) {
      console.error(`User not found for QR payment user ID: ${qrPayment.userId}`);
      return { 
        success: false, 
        message: "User not found" 
      };
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
      console.log(`Payment status confirmed as completed (normalized: ${normalizedStatus})`);
      
      // Update QR payment status
      await storage.updateQrPaymentStatus(qrPayment.id, "completed");
      
      // Update transaction status to payment_completed first
      await storage.updateTransactionStatus(
        transaction.id,
        "payment_completed",
        txId,
        { 
          ...(transaction.metadata as Record<string, any> || {}),
          paymentCompletedAt: new Date().toISOString(),
          casinoTransferStatus: 'pending'
        }
      );
      
      // Add status history entry for payment completion
      await storage.addStatusHistoryEntry(
        transaction.id,
        'payment_completed',
        `Payment completed with DirectPay transaction ID: ${txId}`
      );
      
      // Update user's balance (GCash payments are in PHP)
      const paymentAmount = parseFloat(qrPayment.amount.toString());
      const currency = transaction.currency || 'PHP';
      await storage.updateUserCurrencyBalance(user.id, currency as Currency, paymentAmount);
      
      console.log(`User balance updated for ${user.username}, added ${paymentAmount} ${currency}`);
      
      // Now attempt the casino transfer
      try {
        if (!user.casinoId || !user.casinoUsername) {
          throw new Error(`User ${user.username} is missing casino details (ID: ${user.casinoId}, Username: ${user.casinoUsername})`);
        }
        
        // Generate a unique nonce for this transaction
        const nonce = `nonce_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        
        // Create a detailed comment with nonce and payment reference
        const comment = `An amount of ${paymentAmount} ${currency} has been deposited. Nonce: ${nonce}. TMPay Web App Transaction.`;
        
        // Get the top manager for this user (use stored value or default to first allowed top manager)
        const topManager = user.topManager || 'Marcthepogi';
        
        console.log(`Attempting casino transfer for user: ${user.username} (Casino ID: ${user.casinoId})`);
        console.log(`Amount: ${paymentAmount} ${currency}, Top Manager: ${topManager}`);
        
        // Call casino API to transfer funds
        const transferResult = await casino747Api.transferFunds(
          paymentAmount,
          parseInt(user.casinoId),
          user.casinoUsername,
          "PHP",
          topManager,
          comment
        );
        
        console.log(`Casino transfer successful:`, transferResult);
        
        // Update transaction status to fully completed
        await storage.updateTransactionStatus(
          transaction.id,
          "completed",
          transferResult.transactionId || txId,
          { 
            nonce,
            casinoTransactionId: transferResult.transactionId,
            casinoTransferStatus: 'completed',
            casinoTransferCompletedAt: new Date().toISOString()
          }
        );
        
        // Add a success entry to status history
        await storage.addStatusHistoryEntry(
          transaction.id,
          'casino_transfer_completed',
          `Casino transfer completed with ID ${transferResult.transactionId}`
        );
        
        return { 
          success: true, 
          message: "Payment processed and casino transfer completed successfully",
          paymentReference,
          transactionId: transaction.id,
          casinoTransactionId: transferResult.transactionId
        };
      } catch (casinoError) {
        console.error("Error completing casino transfer:", casinoError);
        
        // Update transaction metadata to reflect the error but keep payment_completed status
        await storage.updateTransactionStatus(
          transaction.id,
          "payment_completed", // Keep payment_completed status
          txId,
          { 
            casinoTransferStatus: 'failed',
            casinoTransferError: casinoError instanceof Error ? casinoError.message : String(casinoError),
            casinoTransferAttemptedAt: new Date().toISOString()
          }
        );
        
        // Add a failure entry to status history
        await storage.addStatusHistoryEntry(
          transaction.id,
          'casino_transfer_failed',
          `Casino transfer failed: ${casinoError instanceof Error ? casinoError.message : String(casinoError)}`
        );
        
        return { 
          success: true, 
          message: "Payment processed but casino transfer failed. Will retry later.",
          paymentReference,
          error: casinoError instanceof Error ? casinoError.message : String(casinoError)
        };
      }
    } else if (
      ['failed', 'cancelled', 'declined', 'rejected', 'expired'].includes(normalizedStatus)
    ) {
      // Update QR payment and transaction status
      await storage.updateQrPaymentStatus(qrPayment.id, "failed");
      await storage.updateTransactionStatus(
        transaction.id, 
        "failed",
        undefined,
        { failedAt: new Date().toISOString() }
      );
      
      // Add status history entry for payment failure
      await storage.addStatusHistoryEntry(
        transaction.id,
        'payment_failed',
        `Payment failed with status: ${paymentStatus}`
      );
      
      console.log("Payment failed via webhook:", { 
        reference: paymentReference, 
        userId: user.id,
        status: paymentStatus
      });
      
      return { 
        success: true, 
        message: "Payment failure recorded successfully",
        status: "failed"
      };
    } else {
      // Unknown status, log but don't change anything
      console.log(`Unknown payment status received: ${paymentStatus} for reference ${paymentReference}`);
      
      return { 
        success: false, 
        message: `Unknown payment status: ${paymentStatus}` 
      };
    }
  }
  
  // DirectPay webhook endpoint for payment notifications
  app.post("/api/webhook/directpay/payment", async (req: Request, res: Response) => {
    try {
      console.log("✅ DirectPay webhook received:", JSON.stringify(req.body));
      
      // Extract payment reference from various possible fields
      const paymentReference = req.body.reference || req.body.payment_reference || req.body.ref;
      
      if (!paymentReference) {
        console.warn("❌ Payment reference missing in webhook payload");
        return res.status(200).json({ 
          success: false,
          message: "Missing payment reference",
          webhookReceived: true
        });
      }

      // Add timeout handling
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Webhook processing timeout')), 30000)
      );

      // Process webhook with timeout
      const result = await Promise.race([
        handleDirectPayWebhook(req.body),
        timeoutPromise
      ]);

      console.log(`✅ Webhook processed for reference: ${paymentReference}`);
      
      return res.status(200).json({
        ...result,
        webhookReceived: true,
        processedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("DirectPay webhook processing error:", error);
      
      // Even in case of error, return a 200 OK to prevent repeated webhook attempts
      return res.status(200).json({ 
        success: false, 
        message: "Error processing webhook, but acknowledged",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // New endpoint to cancel a pending payment
  app.post("/api/payments/cancel/:referenceId", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { referenceId } = req.params;
      const userId = (req as any).user.id;
      
      if (!referenceId) {
        return res.status(400).json({ 
          success: false,
          message: "Reference ID is required" 
        });
      }
      
      // First try to find the transaction by payment reference
      console.log(`[PAYMENT CANCEL] Searching for transaction with payment reference: ${referenceId}`);
      const transactions = await storage.getTransactionsByUserId(userId, {
        status: 'pending'
      });

      // Find the transaction with matching payment reference
      const transaction = transactions.find(t => t.paymentReference === referenceId);
      
      if (transaction) {
        console.log(`[PAYMENT CANCEL] Found transaction with ID ${transaction.id} and payment reference ${referenceId}`);
        
        // Verify the transaction belongs to the authenticated user
        if (transaction.userId !== userId) {
          return res.status(403).json({ 
            success: false,
            message: "You don't have permission to cancel this payment" 
          });
        }
        
        // Check if transaction can be cancelled (only pending transactions can be cancelled)
        if (transaction.status !== 'pending') {
          return res.status(400).json({
            success: false,
            message: `Cannot cancel transaction with status: ${transaction.status}`
          });
        }
        
        // Update transaction status
        await storage.updateTransactionStatus(transaction.id, 'cancelled');
        await storage.addStatusHistoryEntry(
          transaction.id, 
          'cancelled', 
          'Cancelled by user'
        );
        
        // Reduce pending balance in user account
        const user = await storage.getUser(userId);
        if (user) {
          const amount = parseFloat(transaction.amount.toString());
          // Subtract from the user's pending balance
          await storage.updateUserPendingBalance(userId, -amount);
        }
        
        // Try to update associated payment record if it exists
        let paymentUpdated = false;
        
        // Check QR payments
        const qrPayment = await storage.getQrPaymentByReference(referenceId);
        if (qrPayment && qrPayment.status === 'pending') {
          await storage.updateQrPaymentStatus(qrPayment.id, 'cancelled');
          paymentUpdated = true;
          console.log(`[PAYMENT CANCEL] Updated QR payment with ID ${qrPayment.id}`);
        }
        
        // Check Telegram payments
        if (!paymentUpdated) {
          const telegramPayment = await storage.getTelegramPaymentByReference(referenceId);
          if (telegramPayment && telegramPayment.status === 'pending') {
            await storage.updateTelegramPaymentStatus(telegramPayment.id, 'cancelled');
            paymentUpdated = true;
            console.log(`[PAYMENT CANCEL] Updated Telegram payment with ID ${telegramPayment.id}`);
          }
        }
        
        // Check Manual payments
        if (!paymentUpdated) {
          const manualPayment = await storage.getManualPaymentByReference(referenceId);
          if (manualPayment && manualPayment.status === 'pending') {
            await storage.updateManualPaymentStatus(manualPayment.id, 'cancelled');
            paymentUpdated = true;
            console.log(`[PAYMENT CANCEL] Updated Manual payment with ID ${manualPayment.id}`);
          }
        }
        
        return res.json({
          success: true,
          message: "Payment cancelled successfully",
          transaction: { 
            ...transaction, 
            status: 'cancelled' 
          }
        });
      }
      
      // If we couldn't find by transaction directly, use the legacy approach
      // Check QR payments first
      const qrPayment = await storage.getQrPaymentByReference(referenceId);
      if (qrPayment) {
        // Verify the payment belongs to the authenticated user
        if (qrPayment.userId !== userId) {
          return res.status(403).json({ 
            success: false,
            message: "You don't have permission to cancel this payment" 
          });
        }
        
        // Check if payment can be cancelled (only pending payments can be cancelled)
        if (qrPayment.status !== 'pending') {
          return res.status(400).json({
            success: false,
            message: `Cannot cancel payment with status: ${qrPayment.status}`
          });
        }
        
        // Update QR payment status to cancelled
        await storage.updateQrPaymentStatus(qrPayment.id, 'cancelled');
        
        // Update corresponding transaction status
        const transaction = await storage.getTransaction(qrPayment.transactionId);
        if (transaction) {
          await storage.updateTransactionStatus(transaction.id, 'cancelled');
          await storage.addStatusHistoryEntry(
            transaction.id, 
            'cancelled', 
            'Cancelled by user'
          );
          
          // Reduce pending balance in user account
          const user = await storage.getUser(userId);
          if (user) {
            const amount = parseFloat(qrPayment.amount.toString());
            // Subtract from the user's pending balance
            await storage.updateUserPendingBalance(userId, -amount);
          }
        }
        
        return res.json({
          success: true,
          message: "Payment cancelled successfully",
          qrPayment: { ...qrPayment, status: 'cancelled' }
        });
      }
      
      // Check Telegram payments 
      const telegramPayment = await storage.getTelegramPaymentByReference(referenceId);
      if (telegramPayment) {
        // Verify the payment belongs to the authenticated user
        if (telegramPayment.userId !== userId) {
          return res.status(403).json({ 
            success: false,
            message: "You don't have permission to cancel this payment" 
          });
        }
        
        // Check if payment can be cancelled (only pending payments can be cancelled)
        if (telegramPayment.status !== 'pending') {
          return res.status(400).json({
            success: false,
            message: `Cannot cancel payment with status: ${telegramPayment.status}`
          });
        }
        
        // Update Telegram payment status to cancelled
        await storage.updateTelegramPaymentStatus(telegramPayment.id, 'cancelled');
        
        // Update corresponding transaction status
        const transaction = await storage.getTransaction(telegramPayment.transactionId);
        if (transaction) {
          await storage.updateTransactionStatus(transaction.id, 'cancelled');
          await storage.addStatusHistoryEntry(
            transaction.id, 
            'cancelled', 
            'Cancelled by user'
          );
          
          // Reduce pending balance in user account
          const user = await storage.getUser(userId);
          if (user) {
            const amount = parseFloat(telegramPayment.amount.toString());
            // Subtract from the user's pending balance
            await storage.updateUserPendingBalance(userId, -amount);
          }
        }
        
        return res.json({
          success: true,
          message: "Payment cancelled successfully",
          telegramPayment: { ...telegramPayment, status: 'cancelled' }
        });
      }
      
      // Check Manual payments
      const manualPayment = await storage.getManualPaymentByReference(referenceId);
      if (manualPayment) {
        // Verify the payment belongs to the authenticated user
        if (manualPayment.userId !== userId) {
          return res.status(403).json({ 
            success: false,
            message: "You don't have permission to cancel this payment" 
          });
        }
        
        // Check if payment can be cancelled (only pending payments can be cancelled)
        if (manualPayment.status !== 'pending') {
          return res.status(400).json({
            success: false,
            message: `Cannot cancel payment with status: ${manualPayment.status}`
          });
        }
        
        // Update Manual payment status to cancelled
        await storage.updateManualPaymentStatus(manualPayment.id, 'cancelled');
        
        // Update corresponding transaction status
        const transaction = await storage.getTransaction(manualPayment.transactionId);
        if (transaction) {
          await storage.updateTransactionStatus(transaction.id, 'cancelled');
          await storage.addStatusHistoryEntry(
            transaction.id, 
            'cancelled', 
            'Cancelled by user'
          );
          
          // Reduce pending balance in user account
          const user = await storage.getUser(userId);
          if (user) {
            const amount = parseFloat(manualPayment.amount.toString());
            // Subtract from the user's pending balance
            await storage.updateUserPendingBalance(userId, -amount);
          }
        }
        
        return res.json({
          success: true,
          message: "Payment cancelled successfully",
          manualPayment: { ...manualPayment, status: 'cancelled' }
        });
      }
      
      // If we get here, the payment wasn't found
      console.log(`[PAYMENT CANCEL] Payment not found with reference: ${referenceId}`);
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    } catch (error) {
      console.error("Error cancelling payment:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to cancel payment"
      });
    }
  });
  
  // Endpoint to automatically clean up expired transactions
  app.post("/api/payments/cleanup-expired", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const expiredTransactions: { id: number, type: string }[] = [];
      
      // Find and update expired QR payments
      const qrPaymentsMap = storage.getAllQrPayments();
      const qrPayments = Array.from(qrPaymentsMap.values());
      for (const qrPayment of qrPayments) {
        if (qrPayment.status === 'pending' && new Date(qrPayment.expiresAt) < now) {
          await storage.updateQrPaymentStatus(qrPayment.id, 'expired');
          
          // Update the associated transaction
          const transaction = await storage.getTransaction(qrPayment.transactionId);
          if (transaction && transaction.status === 'pending') {
            await storage.updateTransactionStatus(transaction.id, 'expired');
            await storage.addStatusHistoryEntry(
              transaction.id, 
              'expired', 
              'QR payment expired automatically'
            );
            
            // Reduce pending balance in user account
            const user = await storage.getUser(qrPayment.userId);
            if (user) {
              const amount = parseFloat(qrPayment.amount.toString());
              // Subtract from the user's pending balance
              await storage.updateUserPendingBalance(qrPayment.userId, -amount);
            }
            
            expiredTransactions.push({ id: transaction.id, type: 'qr_payment' });
          }
        }
      }
      
      // Find and update expired Telegram payments
      const telegramPaymentsMap = storage.getAllTelegramPayments();
      const telegramPayments = Array.from(telegramPaymentsMap.values());
      for (const telegramPayment of telegramPayments) {
        if (telegramPayment.status === 'pending' && new Date(telegramPayment.expiresAt) < now) {
          await storage.updateTelegramPaymentStatus(telegramPayment.id, 'expired');
          
          // Update the associated transaction
          const transaction = await storage.getTransaction(telegramPayment.transactionId);
          if (transaction && transaction.status === 'pending') {
            await storage.updateTransactionStatus(transaction.id, 'expired');
            await storage.addStatusHistoryEntry(
              transaction.id, 
              'expired', 
              'Telegram payment expired automatically'
            );
            
            // Reduce pending balance in user account
            const user = await storage.getUser(telegramPayment.userId);
            if (user) {
              const amount = parseFloat(telegramPayment.amount.toString());
              // Subtract from the user's pending balance
              await storage.updateUserPendingBalance(telegramPayment.userId, -amount);
            }
            
            expiredTransactions.push({ id: transaction.id, type: 'telegram_payment' });
          }
        }
      }
      
      // Find old pending manual payments (older than 48 hours)
      const manualPaymentsMap = storage.getAllManualPayments();
      const manualPayments = Array.from(manualPaymentsMap.values());
      const manualPaymentExpiryHours = 48; // Manual payments expire after 48 hours
      const manualPaymentExpiryTime = new Date(now.getTime() - (manualPaymentExpiryHours * 60 * 60 * 1000));
      
      for (const manualPayment of manualPayments) {
        if (manualPayment.status === 'pending') {
          // Check if the manual payment is older than the expiry time
          const createdAt = new Date(manualPayment.createdAt);
          if (createdAt < manualPaymentExpiryTime) {
            await storage.updateManualPaymentStatus(manualPayment.id, 'expired');
            
            // Update the associated transaction
            const transaction = await storage.getTransaction(manualPayment.transactionId);
            if (transaction && transaction.status === 'pending') {
              await storage.updateTransactionStatus(transaction.id, 'expired');
              await storage.addStatusHistoryEntry(
                transaction.id, 
                'expired', 
                `Manual payment expired automatically after ${manualPaymentExpiryHours} hours`
              );
              
              // Reduce pending balance in user account
              const user = await storage.getUser(manualPayment.userId);
              if (user) {
                const amount = parseFloat(manualPayment.amount.toString());
                // Subtract from the user's pending balance
                await storage.updateUserPendingBalance(manualPayment.userId, -amount);
              }
              
              expiredTransactions.push({ id: transaction.id, type: 'manual_payment' });
            }
          }
        }
      }
      
      return res.json({
        success: true,
        message: `Cleaned up ${expiredTransactions.length} expired payments`,
        expiredTransactions
      });
    } catch (error) {
      console.error("Error cleaning up expired payments:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to clean up expired payments"
      });
    }
  });
  
  // New endpoint to mark a payment as completed by the user
  app.post("/api/payments/mark-as-completed", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { paymentReference } = req.body;
      const userId = (req as any).user.id;
      
      console.log(`[PAYMENT] Manual completion requested for payment reference: ${paymentReference} by user ${userId}`);
      
      if (!paymentReference) {
        return res.status(400).json({
          success: false,
          message: "Payment reference is required"
        });
      }
      
      // Find the transaction by payment reference
      console.log(`[PAYMENT] Looking for transaction with payment reference: ${paymentReference}`);
      
      const transactions = await storage.getTransactionsByUserId(userId, {
        status: 'pending'
      });
      
      // Find transaction with matching payment reference
      const transaction = transactions.find(t => t.paymentReference === paymentReference);
      
      if (!transaction) {
        console.log(`[PAYMENT] No pending transaction found with reference: ${paymentReference}`);
        return res.status(404).json({
          success: false,
          message: "No pending transaction found with this reference"
        });
      }
      
      console.log(`[PAYMENT] Found transaction with ID ${transaction.id} for reference ${paymentReference}`);
      
      // Get user details
      const user = await storage.getUser(userId);
      const amount = parseFloat(transaction.amount.toString());
      
      // Set initial payment completion status - intermediate state
      await storage.updateTransactionStatus(
        transaction.id,
        "payment_completed", // New intermediate state
        undefined,
        { 
          manuallyCompleted: true,
          paymentCompletedAt: new Date(),
          casinoTransferStatus: 'pending'
        }
      );
      
      await storage.addStatusHistoryEntry(
        transaction.id,
        'payment_completed',
        'Payment marked as verified by user'
      );
      
      // Try to update associated QR payment if it exists
      const qrPayment = await storage.getQrPaymentByReference(paymentReference);
      if (qrPayment && qrPayment.status === 'pending') {
        await storage.updateQrPaymentStatus(qrPayment.id, 'completed');
        console.log(`[PAYMENT] Updated QR payment with ID ${qrPayment.id}`);
      }
      
      // Call casino API to complete the topup if user has casino ID
      if (user.casinoId) {
        try {
          console.log(`[CASINO] Attempting to credit ${amount} PHP to casino account for user ${user.casinoUsername || 'unknown'} (ID: ${user.casinoId})`);
          
          const casinoResult = await casino747CompleteTopup(
            user.casinoId,
            amount,
            transaction.paymentReference || paymentReference
          );
          
          console.log(`[CASINO] Transfer completed successfully:`, {
            amount,
            casinoId: user.casinoId,
            reference: paymentReference,
            nonce: casinoResult.nonce,
            transactionId: casinoResult.transactionId
          });
          
          // Update the transaction with the casino transfer information
          await storage.updateTransactionStatus(
            transaction.id,
            "completed", // Final completion state when both payment and casino transfer succeed
            undefined,
            { 
              casinoNonce: casinoResult.nonce,
              casinoTransactionId: casinoResult.transactionId,
              casinoTransferStatus: 'completed',
              casinoTransferCompletedAt: new Date(),
              manuallyCompleted: true,
              paymentCompletedAt: new Date()
            }
          );
          
          // Add a success entry to status history
          await storage.addStatusHistoryEntry(
            transaction.id,
            'casino_transfer_completed',
            `Casino transfer completed with ID ${casinoResult.transactionId}`
          );
          
          // Update user balance
          // Add to the user's balance
          await storage.updateUserBalance(userId, amount);
          
          // Subtract from pending balance
          await storage.updateUserPendingBalance(userId, -amount);
          
          // Record financials in transaction
          await storage.recordTransactionFinancials(
            transaction.id,
            parseFloat(user.balance),
            parseFloat(user.balance) + amount
          );
          
        } catch (casinoError) {
          console.error("[CASINO] Error completing casino transfer:", casinoError);
          
          // Add error information to the transaction but keep payment_completed status
          // This allows admin to see that payment was marked completed but casino transfer failed
          await storage.updateTransactionStatus(
            transaction.id,
            "payment_completed", // Keep payment completed status
            undefined,
            { 
              manuallyCompleted: true,
              casinoTransferStatus: 'failed',
              casinoTransferError: casinoError instanceof Error ? casinoError.message : String(casinoError),
              casinoTransferAttemptedAt: new Date()
            }
          );
          
          // Add a failure entry to status history
          await storage.addStatusHistoryEntry(
            transaction.id,
            'casino_transfer_failed',
            `Casino transfer failed: ${casinoError instanceof Error ? casinoError.message : String(casinoError)}`
          );
          
          // Still update the user's balance since the payment was verified
          await storage.updateUserBalance(userId, amount);
          await storage.updateUserPendingBalance(userId, -amount);
          await storage.recordTransactionFinancials(
            transaction.id,
            parseFloat(user.balance),
            parseFloat(user.balance) + amount
          );
        }
      } else {
        // No casino ID, just complete the transaction normally
        console.log(`[PAYMENT] User has no casino ID, completing transaction without casino transfer`);
        
        await storage.updateTransactionStatus(transaction.id, 'completed');
        await storage.addStatusHistoryEntry(
          transaction.id,
          'completed',
          'Payment completed (no casino transfer needed)'
        );
        
        // Update user balance
        await storage.updateUserBalance(userId, amount);
        await storage.updateUserPendingBalance(userId, -amount);
        await storage.recordTransactionFinancials(
          transaction.id,
          parseFloat(user.balance),
          parseFloat(user.balance) + amount
        );
      }
      
      // Before completing the payment, check for potential fraud
      // This section checks for signs that the user might be trying to falsely mark a payment as completed
      const paymentMethod = transaction.method?.toLowerCase() || '';
      
      if (paymentMethod.includes('gcash')) {
        // For GCash payments, we want to check the QR payment record
        const qrPayment = await storage.getQrPaymentByReference(paymentReference);
        
        // Check for the 10-60-30 rule: 10 GCash attempts can't be marked completed within 1 hour
        // Simplified version for now - check if user has recently marked other payments as completed
        const recentCompletions = transactions.filter(t => 
          t.status === 'completed' && 
          t.metadata?.manuallyCompleted === true &&
          t.updatedAt && 
          new Date(t.updatedAt).getTime() > Date.now() - (60 * 60 * 1000) // Last hour
        );
        
        if (recentCompletions.length >= 3) {
          return res.status(403).json({
            success: false,
            message: "Too many manual completions in the last hour. Please contact support."
          });
        }
        
        // Add a note about this being a manual completion in the status history
        await storage.addStatusHistoryEntry(
          transaction.id, 
          'manual_completion_initiated',
          'User manually marked payment as completed'
        );
      }
      
      return res.json({
        success: true,
        message: "Payment marked as completed successfully",
        transaction: { ...transaction, status: 'completed' }
      });
    } catch (error) {
      console.error("Error marking payment as completed:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to mark payment as completed"
      });
    }
  });

  // Endpoint to process pending casino transfers
  app.post("/api/payments/process-pending-transfers", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
    try {
      // Import the function dynamically to avoid circular dependencies
      const { processPendingCasinoTransfers } = await import('../process-pending-transfers');
      
      // Run the process
      await processPendingCasinoTransfers();
      
      return res.json({
        success: true,
        message: "Pending casino transfers processed successfully"
      });
    } catch (error) {
      console.error("Error processing pending casino transfers:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to process pending casino transfers",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Endpoint to send transaction status notifications (for pending payments)
  app.post("/api/payments/send-reminders", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes ago
      const remindersSent: { id: number, userId: number, type: string }[] = [];
      
      // Find pending QR payments that are about to expire
      const qrPaymentsMap = storage.getAllQrPayments();
      const qrPayments = Array.from(qrPaymentsMap.values());
      for (const qrPayment of qrPayments) {
        if (qrPayment.status === 'pending') {
          const expiryTime = new Date(qrPayment.expiresAt);
          const timeLeft = Math.max(0, expiryTime.getTime() - now.getTime());
          const minutesLeft = Math.floor(timeLeft / (60 * 1000));
          
          // If less than 10 minutes left before expiry and hasn't received a reminder yet
          if (minutesLeft <= 10 && minutesLeft > 0) {
            const transaction = await storage.getTransaction(qrPayment.transactionId);
            const user = await storage.getUser(qrPayment.userId);
            
            if (transaction && user) {
              // Check if we have already sent a reminder for this payment
              const reminderSentKey = `reminder_sent_${qrPayment.id}`;
              const reminderSent = await storage.getUserPreference(user.id, reminderSentKey);
              
              // If no reminder has been sent yet
              if (!reminderSent) {
                // In a real implementation, you'd send an email or push notification here
                console.log(`REMINDER: Payment for ${qrPayment.amount} will expire in ${minutesLeft} minutes. User: ${user.username}, Reference: ${transaction.paymentReference}`);
                
                // Mark that we've sent a reminder
                await storage.updateUserPreference(user.id, reminderSentKey, 'true');
                
                // Record for our response
                remindersSent.push({ id: qrPayment.id, userId: user.id, type: 'qr_payment' });
              }
            }
          }
        }
      }
      
      // Do the same for Telegram payments
      const telegramPaymentsMap = storage.getAllTelegramPayments();
      const telegramPayments = Array.from(telegramPaymentsMap.values());
      for (const telegramPayment of telegramPayments) {
        if (telegramPayment.status === 'pending') {
          const expiryTime = new Date(telegramPayment.expiresAt);
          const timeLeft = Math.max(0, expiryTime.getTime() - now.getTime());
          const minutesLeft = Math.floor(timeLeft / (60 * 1000));
          
          // If less than 10 minutes left before expiry and hasn't received a reminder yet
          if (minutesLeft <= 10 && minutesLeft > 0) {
            const transaction = await storage.getTransaction(telegramPayment.transactionId);
            const user = await storage.getUser(telegramPayment.userId);
            
            if (transaction && user) {
              // Check if we have already sent a reminder for this payment
              const reminderSentKey = `reminder_sent_${telegramPayment.id}`;
              const reminderSent = await storage.getUserPreference(user.id, reminderSentKey);
              
              // If no reminder has been sent yet
              if (!reminderSent) {
                // In a real implementation, you'd send an email or push notification here
                console.log(`REMINDER: Payment for ${telegramPayment.amount} will expire in ${minutesLeft} minutes. User: ${user.username}, Reference: ${transaction.paymentReference}`);
                
                // Mark that we've sent a reminder
                await storage.updateUserPreference(user.id, reminderSentKey, 'true');
                
                // Record for our response
                remindersSent.push({ id: telegramPayment.id, userId: user.id, type: 'telegram_payment' });
              }
            }
          }
        }
      }
      
      // Do the same for Manual payments (use createdAt to determine if they need reminders)
      const manualPaymentsMap = storage.getAllManualPayments();
      const manualPayments = Array.from(manualPaymentsMap.values());
      
      // Manual payments have 48 hours expiry time, send reminder when 24 hours remain
      const manualPaymentReminderThreshold = 24 * 60 * 60 * 1000; // 24 hours in ms
      
      for (const manualPayment of manualPayments) {
        if (manualPayment.status === 'pending') {
          const createdAt = new Date(manualPayment.createdAt);
          const timeElapsed = now.getTime() - createdAt.getTime();
          
          // If payment is 24 hours old, send a reminder (assuming 48 hour expiry window)
          const reminderTime = 24 * 60 * 60 * 1000; // 24 hours in ms
          const timeElapsedHours = Math.floor(timeElapsed / (60 * 60 * 1000));
          
          // If the payment is between 23-25 hours old, send a reminder
          if (timeElapsed >= reminderTime - (60 * 60 * 1000) && timeElapsed <= reminderTime + (60 * 60 * 1000)) {
            const transaction = await storage.getTransaction(manualPayment.transactionId);
            const user = await storage.getUser(manualPayment.userId);
            
            if (transaction && user) {
              // Check if we have already sent a reminder for this payment
              const reminderSentKey = `reminder_sent_${manualPayment.id}`;
              const reminderSent = await storage.getUserPreference(user.id, reminderSentKey);
              
              // If no reminder has been sent yet
              if (!reminderSent) {
                // In a real implementation, you'd send an email or push notification here
                console.log(`REMINDER: Manual payment for ${manualPayment.amount} is ${timeElapsedHours} hours old. User: ${user.username}, Reference: ${transaction.paymentReference}`);
                
                // Mark that we've sent a reminder
                await storage.updateUserPreference(user.id, reminderSentKey, 'true');
                
                // Record for our response
                remindersSent.push({ id: manualPayment.id, userId: user.id, type: 'manual_payment' });
              }
            }
          }
        }
      }
      
      return res.json({
        success: true,
        message: `Sent ${remindersSent.length} payment reminders`,
        remindersSent
      });
    } catch (error) {
      console.error("Error sending payment reminders:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to send payment reminders"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}