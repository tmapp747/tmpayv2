/**
 * Script to update the Wakay user password to a known value
 */
import { db } from "./server/db";
import { users } from "./shared/schema";
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

async function updateWakayPassword() {
  try {
    console.log('Updating Wakay user password...');
    
    // Set the new password
    const newPassword = 'Wakay@123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user
    const result = await db.update(users)
      .set({
        password: hashedPassword,
        isAuthorized: true,
        status: 'active'
      })
      .where(eq(users.username, 'Wakay'))
      .returning({
        id: users.id,
        username: users.username
      });
    
    if (result.length > 0) {
      console.log(`Successfully updated password for user ${result[0].username} (ID: ${result[0].id})`);
      console.log(`New password: ${newPassword}`);
    } else {
      console.log('User Wakay not found');
    }
    
  } catch (error) {
    console.error('Error updating Wakay password:', error);
  } finally {
    process.exit(0);
  }
}

updateWakayPassword();