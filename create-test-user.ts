/**
 * Script to create a test user account with known credentials
 */
import { db } from "./server/db";
import { users, supportedCurrencies } from "./shared/schema";
import * as bcrypt from 'bcrypt';

async function createTestUser() {
  try {
    // Check if the test user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, 'testuser')
    });

    if (existingUser) {
      console.log('Test user already exists, updating password...');
      
      // Update user with new password
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      await db.update(users).set({
        password: hashedPassword,
        isAuthorized: true,
        role: 'admin',
        status: 'active'
      }).where(users.username === 'testuser');
      
      console.log('Test user password updated successfully');
      return;
    }

    // Create test user with known credentials
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    const balancesObj: Record<string, string> = {};
    
    // Initialize balances for all supported currencies
    supportedCurrencies.forEach(currency => {
      balancesObj[currency] = "1000.00";
    });

    // Insert the test user
    const newUser = await db.insert(users).values({
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
      topManager: 'Marcthepogi',
      immediateManager: 'platalyn@gmail.com',
      casinoUserType: 'player',
      preferredCurrency: 'PHP',
      casinoUsername: 'testuser',
      casinoClientId: 999999
    });

    console.log('Test user created successfully');
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    process.exit(0);
  }
}

createTestUser();
