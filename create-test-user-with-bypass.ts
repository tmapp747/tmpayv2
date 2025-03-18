/**
 * Script to create a test user account with known credentials and bypass casino validation
 */
import { db } from "./server/db";
import { users, supportedCurrencies } from "./shared/schema";
import * as bcrypt from 'bcrypt';

async function createTestUserWithBypass() {
  try {
    // Generate a random refresh token
    const refreshToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Generate a random access token
    const accessToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Set token expiry dates (access token: 1 hour, refresh token: 30 days)
    const now = new Date();
    const accessTokenExpiry = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    const refreshTokenExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Check if the test user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, 'testuser')
    });

    if (existingUser) {
      console.log('Test user already exists, updating settings...');
      
      // Update user with new tokens and set isAuthorized to true (bypassing validation)
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      await db.update(users).set({
        password: hashedPassword,
        accessToken,
        accessTokenExpiry,
        refreshToken,
        refreshTokenExpiry,
        isAuthorized: true,
        role: 'admin',
        status: 'active'
      }).where(users.username === 'testuser');
      
      console.log('Test user updated successfully');
      console.log(`Access Token: ${accessToken}`);
      console.log(`Refresh Token: ${refreshToken}`);
      return;
    }

    // Create test user with known credentials
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    const balancesObj: Record<string, string> = {};
    
    // Initialize balances for all supported currencies
    supportedCurrencies.forEach(currency => {
      balancesObj[currency] = "1000.00";
    });

    // Insert the test user with pre-authorized tokens
    await db.insert(users).values({
      username: 'testuser',
      password: hashedPassword,
      email: 'test@example.com',
      casinoId: 'test123',
      role: 'admin',
      status: 'active',
      isAuthorized: true,
      balance: "1000.00",
      pendingBalance: "0.00",
      balances: balancesObj,
      accessToken,
      accessTokenExpiry,
      refreshToken,
      refreshTokenExpiry,
      topManager: 'Marcthepogi',
      immediateManager: 'platalyn@gmail.com',
      casinoUserType: 'player',
      preferredCurrency: 'PHP',
      casinoUsername: 'testuser',
      casinoClientId: 999999
    });

    console.log('Test user created successfully with pre-authorized tokens');
    console.log(`Access Token: ${accessToken}`);
    console.log(`Refresh Token: ${refreshToken}`);
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    process.exit(0);
  }
}

createTestUserWithBypass();
