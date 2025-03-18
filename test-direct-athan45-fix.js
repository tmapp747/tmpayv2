// Direct test script for Athan45 casino username fix
// This script bypasses the authentication and directly tests the casino747CompleteTopup function

// Import required dependencies
import { db } from './server/db.ts';
import { casino747Api } from './server/casino747Api.ts';
import { casino747CompleteTopup } from './server/routes.ts';

// Directly test the casino transfer with Athan45's exact scenario
async function testAthan45Fix() {
  try {
    console.log('🧪 Starting direct test for Athan45 casino username fix');
    
    // Get Athan45's user data
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, 'Athan45')
    });
    
    if (!user) {
      console.error('❌ User Athan45 not found in database');
      return;
    }
    
    console.log('📋 User data:', {
      id: user.id,
      username: user.username,
      casinoUsername: user.casinoUsername,
      casinoClientId: user.casinoClientId,
      topManager: user.topManager
    });
    
    // Check if casinoClientId exists
    if (!user.casinoClientId) {
      console.error('❌ Athan45 has no casinoClientId set. Setting a test value.');
      
      // For testing, we'll set a client ID if it doesn't exist
      await db.update(db.users)
        .set({ casinoClientId: 329777805 }) // Using a test client ID
        .where(db.eq(db.users.id, user.id));
      
      console.log('✅ Set test casinoClientId: 329777805');
    }
    
    // Store original values
    const originalCasinoUsername = user.casinoUsername;
    
    // Set casinoUsername to null to replicate the issue
    console.log('⚠️ Setting casinoUsername to null temporarily to simulate issue');
    await db.update(db.users)
      .set({ casinoUsername: null })
      .where(db.eq(db.users.id, user.id));
    console.log('✅ Updated casinoUsername to null for testing');
    
    // Create a test reference
    const reference = `TEST-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Call the casino747CompleteTopup function directly
    console.log('🔄 Attempting to call the casino747CompleteTopup function');
    console.log(`🔄 Parameters: casinoId=${user.casinoClientId}, amount=100, reference=${reference}`);
    
    // Call the function
    const result = await casino747CompleteTopup(
      user.casinoClientId.toString(),
      100,
      reference
    );
    
    console.log('✅ Result:', result);
    
    // Verify if our fix worked - it should have used the username as fallback
    console.log('🔍 Checking if the fix worked properly');
    
    if (result.success) {
      console.log('🎉 SUCCESS: Casino transfer completed successfully!');
      console.log('This means our fix for using username as fallback for casinoUsername is working!');
      
      // Double check if the database user record was auto-updated
      const updatedUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, user.id)
      });
      
      if (updatedUser.casinoUsername === user.username) {
        console.log('✅ Auto-update feature worked! casinoUsername was set to regular username.');
      } else {
        console.log('⚠️ Auto-update feature didn\'t work. casinoUsername is still:', updatedUser.casinoUsername);
      }
    } else {
      console.log('❌ FAILURE: Casino transfer failed');
    }
    
    // Restore original casinoUsername
    console.log('🔄 Restoring original user data');
    await db.update(db.users)
      .set({ casinoUsername: originalCasinoUsername })
      .where(db.eq(db.users.id, user.id));
    console.log('✅ User data restored');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testAthan45Fix();