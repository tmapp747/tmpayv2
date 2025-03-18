import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { casino747Api } from "./casino747Api";
import { pool } from "./db";
import pgSession from "connect-pg-simple";
import { insertUserSchema, supportedCurrencies } from "../shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Number of salt rounds for bcrypt hashing
const SALT_ROUNDS = 10;

/**
 * Hashes a password using bcrypt
 * Always uses bcrypt regardless of environment for security
 */
export async function hashPassword(password: string) {
  // Always use proper bcrypt hashing for security
  try {
    console.log("Hashing password with bcrypt...");
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    console.log("Password hashed successfully with bcrypt");
    return hashedPassword;
  } catch (error) {
    console.error("Error hashing password with bcrypt:", error);
    throw new Error("Failed to hash password securely");
  }
}

/**
 * Checks if a password is already hashed with bcrypt
 * Used to determine if migration is needed
 */
export function isPasswordHashed(password: string): boolean {
  return password.startsWith('$2b$') || password.startsWith('$2a$');
}

/**
 * Compares a supplied password with a stored password
 * Handles both bcrypt hashed passwords and plaintext passwords during migration period
 * Uses constant-time comparison to prevent timing attacks where needed
 * 
 * @returns An object containing the comparison result and whether migration is needed
 */
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  // Log password comparison attempt with more details but keeping security in mind
  console.log(`Password comparison attempt details:`);
  console.log(`- Supplied password length: ${supplied ? supplied.length : 0}`);
  console.log(`- Stored password type: ${stored ? (isPasswordHashed(stored) ? 'bcrypt hash' : 'plaintext') : 'missing'}`);
  console.log(`- Stored password preview: ${stored ? stored.substring(0, 3) + '...' + stored.substring(stored.length - 3) : 'none'}`);

  // Immediately fail if either value is missing
  if (!supplied || !stored) {
    console.warn("Password comparison failed: Missing password input");
    return false;
  }

  // If the stored password appears to be a bcrypt hash, use bcrypt.compare
  if (isPasswordHashed(stored)) {
    try {
      console.log("Using bcrypt.compare for password validation");
      const result = await bcrypt.compare(supplied, stored);
      console.log(`Bcrypt comparison result: ${result ? 'Success' : 'Failed'}`);
      return result;
    } catch (error) {
      console.error("Bcrypt comparison error:", error);
      console.error("Error details:", error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  // Special case for legacy accounts with plaintext passwords that need migration
  console.warn("⚠️ SECURITY NOTICE: Plaintext password detected. Password migration required.");
  console.log("Comparing plaintext password for legacy account");

  // Use a constant-time comparison for plaintext to mitigate timing attacks
  let result = true;
  const suppliedBuffer = Buffer.from(supplied);
  const storedBuffer = Buffer.from(stored);

  // If lengths differ, result will be false, but continue to prevent timing attacks
  if (suppliedBuffer.length !== storedBuffer.length) {
    console.log(`Password length mismatch: ${suppliedBuffer.length} vs ${storedBuffer.length}`);
    result = false;
  }

  // Constant-time comparison
  let differences = 0;
  for (let i = 0; i < Math.min(suppliedBuffer.length, storedBuffer.length); i++) {
    if (suppliedBuffer[i] !== storedBuffer[i]) {
      differences++;
      result = false;
    }
  }

  console.log(`Legacy password comparison result: ${result ? 'Success' : `Failed with ${differences} differences`}`);

  // Log a prominent warning about password migration
  if (result) {
    console.warn("==================================================");
    console.warn("⚠️ CRITICAL SECURITY WARNING: Legacy plaintext password was used successfully");
    console.warn("Password migration should be performed immediately");
    console.warn("==================================================");
  }

  return result;
}

export function setupAuth(app: Express) {
  // Create PostgreSQL session store
  const PgStore = pgSession(session);

  // Setup PostgreSQL session store with the connection pool
  const pgSessionStore = new PgStore({
    pool,
    tableName: 'session', // Use default table name
    createTableIfMissing: true, // Auto-create the session table if it doesn't exist
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || (process.env.NODE_ENV === "production" 
      ? randomBytes(32).toString('hex')
      : "casino747_dev_session_secret"),
    resave: false, 
    saveUninitialized: false,
    rolling: true, // Extends session on activity
    store: pgSessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    }
  };

  // Log a warning if using default session secret in production
  if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
    console.warn("WARNING: Using auto-generated session secret in production. Set SESSION_SECRET env variable for persistent sessions.");
  }

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Log session initialization
  console.log("Session middleware initialized with PostgreSQL store");
  console.log("Passport.js initialized for authentication");

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Look up the user - use case-insensitive search
        const user = await storage.getUserByUsername(username.toLowerCase());

        if (!user) {
          console.log(`Login failed: no user found with username "${username}"`);
          return done(null, false);
        }

        // Compare passwords using our enhanced function that handles both hashed and plaintext passwords
        const isPasswordValid = await comparePasswords(password, user.password);

        if (!isPasswordValid) {
          console.log(`Login failed: invalid password for user "${username}"`);
          return done(null, false);
        }

        // If login successful and password is not hashed (plaintext), perform automatic migration
        if (!isPasswordHashed(user.password)) {
          console.log(`Automatically migrating plaintext password to bcrypt hash for user "${username}"`);
          try {
            // Hash the password and update the user record
            const hashedPassword = await hashPassword(password);
            await storage.updateUserPassword(user.id, hashedPassword);
            console.log(`Password migration completed successfully for user "${username}"`);

            // Get the updated user with the new hashed password
            const updatedUser = await storage.getUser(user.id);
            if (updatedUser) {
              return done(null, updatedUser);
            }
          } catch (migrationError) {
            console.error(`Failed to migrate password for user "${username}":`, migrationError);
            // Continue with login even if migration fails - we can try again next time
          }
        }

        return done(null, user);
      } catch (error) {
        console.error("Authentication error:", error);
        return done(error);
      }
    }),
  );

  // Enhanced serializer for users - only store the user ID in the session
  passport.serializeUser((user: Express.User, done) => {
    console.log(`Serializing user: ${user.username} (ID: ${user.id})`);
    done(null, user.id);
  });

  // Enhanced deserializer that retrieves the full user info from storage
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`Deserializing user with ID: ${id}`);
      const user = await storage.getUser(id);

      if (!user) {
        console.error(`Failed to deserialize user with ID: ${id} - User not found`);
        return done(null, false);
      }

      console.log(`Successfully deserialized user: ${user.username}`);
      done(null, user);
    } catch (error) {
      console.error(`Error deserializing user with ID: ${id}:`, error);
      done(error);
    }
  });

  // Admin registration endpoint
app.post("/api/admin/register", async (req, res, next) => {
  try {
    // Check if request contains the specified credentials
    if (req.body.username !== 'admin' || req.body.password !== 'Bossmarc@747live') {
      return res.status(400).json({ success: false, message: "Invalid admin credentials" });
    }

    // Check if admin already exists
    const existingAdmin = await storage.getUserByUsername('admin');
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: "Admin account already exists" });
    }

    // Create admin user with specified credentials
    const hashedPassword = await hashPassword('Bossmarc@747live');
    const admin = await storage.createUser({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@tmpay.com',
      role: 'admin',
      isAuthorized: true,
      casinoId: 'admin',
      isVip: true,
      hierarchyLevel: 3, // Top level access
      balances: { PHP: '0.00', PHPT: '0.00', USDT: '0.00' },
      preferredCurrency: 'PHP'
    });

    res.status(201).json({ success: true, message: "Admin account created successfully" });
  } catch (error) {
    console.error('Error creating admin account:', error);
    next(error);
  }
});

app.post("/api/register", async (req, res, next) => {
    try {
      // Validate registration data using insertUserSchema
      const registrationData = insertUserSchema.parse(req.body);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(registrationData.username.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Username already exists" });
      }

      // Check password security criteria
      const passwordSchema = z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/);
      passwordSchema.parse(registrationData.password);

      // Validate email
      const emailSchema = z.string().email();
      emailSchema.parse(registrationData.email);

      // Validate casinoId
      const casinoIdSchema = z.string().nonempty();
      casinoIdSchema.parse(registrationData.casinoId);

      // Validate preferredCurrency
      const preferredCurrencySchema = z.enum(supportedCurrencies);
      preferredCurrencySchema.parse(registrationData.preferredCurrency);

      // Create new user
      const user = await storage.createUser({
        ...registrationData,
        username: registrationData.username.toLowerCase(),
        password: await hashPassword(registrationData.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        // Remove password from the response
        const userResponse = { ...user } as Partial<SelectUser>;
        if (userResponse.password) {
          delete userResponse.password;
        }

        res.status(201).json({ success: true, user: userResponse, message: "User registered successfully" });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: error.errors });
      }
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), async (req, res) => {
    try {
      // Get the authenticated user from request
      const user = req.user as SelectUser;

      // If the user has a casino username, try to fetch the hierarchy info
      if (user && user.casinoUsername) {
        // Determine if the user is an agent based on their stored user type
        const isAgent = user.casinoUserType === 'agent';

        try {
          // Fetch user hierarchy from casino API
          const hierarchyData = await casino747Api.getUserHierarchy(user.casinoUsername, isAgent);

          if (hierarchyData.hierarchy && hierarchyData.hierarchy.length >= 3) {
            // Get top manager (3rd element, index 2)
            const topManager = hierarchyData.hierarchy[2]?.username;

            // Find immediate manager by finding parent
            let immediateManager = '';

            // Find the immediate manager by matching parentClientId
            for (const agent of hierarchyData.hierarchy) {
              if (agent.clientId === hierarchyData.user.parentClientId) {
                immediateManager = agent.username;
                break;
              }
            }

            // Update user with hierarchy info from API
            await storage.updateUserHierarchyInfo(
              user.id, 
              topManager || user.topManager || "", 
              immediateManager || user.immediateManager || "", 
              user.casinoUserType || (isAgent ? 'agent' : 'player')
            );

            // Get updated user
            const updatedUser = await storage.getUser(user.id);
            if (updatedUser) {
              req.user = updatedUser;
            }
          }
        } catch (error) {
          console.error("Error fetching hierarchy data during login:", error);
          // Don't fail the login if we can't get hierarchy, just continue with existing data
        }
      }

      // Remove password from the response
      const userResponse = { ...req.user } as Partial<SelectUser>;
      if (userResponse.password) {
        delete userResponse.password;
      }

      res.status(200).json({ success: true, user: userResponse, message: "Login successful" });
    } catch (error) {
      console.error("Error in login endpoint:", error);
      res.status(500).json({ success: false, message: "Error processing login" });
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ success: true, message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    // Remove password from the response
    const userResponse = { ...req.user } as Partial<SelectUser>;
    if (userResponse.password) {
      delete userResponse.password;
    }

    res.json({ success: true, user: userResponse });
  });
}