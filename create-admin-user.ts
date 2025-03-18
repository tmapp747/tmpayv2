/**
 * Script to create admin user account for the 747 Casino E-Wallet Platform
 * This script creates a special admin user that bypasses the casino integration
 */
import { db } from './server/db';
import { users, rolePermissions, type InsertUser } from './shared/schema';
import { hashPassword } from './server/auth';
import { eq } from 'drizzle-orm';

async function createAdminUser() {
  try {
    console.log('Checking if admin user already exists...');
    const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin'));
    
    if (existingAdmin.length > 0) {
      console.log('Admin user already exists with ID:', existingAdmin[0].id);
      
      // Update the admin user to ensure it has the bypass flag
      await db.update(users)
        .set({ 
          bypassCasinoAuth: true,
          isAuthorized: true,
          role: 'admin',
          status: 'active'
        })
        .where(eq(users.id, existingAdmin[0].id));
      
      console.log('Admin user updated to bypass casino authentication');
      return;
    }
    
    // Hash the password
    console.log('Hashing password with bcrypt...');
    const hashedPassword = await hashPassword('Bossmarc@747live');
    console.log('Password hashed successfully with bcrypt');
    
    // Create new admin user
    const newUser: InsertUser = {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@tmpay747.net',
      preferredCurrency: 'PHP',
      casinoId: 'SYSTEM_ADMIN',
      role: 'admin',
      status: 'active',
      balance: '0.00',
      pendingBalance: '0.00',
      isVip: false,
      vipLevel: 0,
      casinoUsername: 'SYSTEM_ADMIN',
      casinoClientId: null, 
      topManager: null,
      immediateManager: null,
      casinoUserType: 'SYSTEM',
      isAuthorized: true,
      bypassCasinoAuth: true, // Special flag to bypass casino auth checks
      balances: {
        PHP: '0.00',
        PHPT: '0.00',
        USDT: '0.00'
      }
    };
    
    // Create the admin user
    const result = await db.insert(users).values(newUser).returning();
    console.log('Admin user created successfully with ID:', result[0].id);
    
    // Set up permissions
    console.log('Setting up admin permissions...');
    
    const adminPermissions = [
      'users:read', 'users:create', 'users:update', 'users:delete', 'users:manage',
      'transactions:read', 'transactions:create', 'transactions:update', 'transactions:delete',
      'transactions:approve', 'transactions:reject', 'transactions:manage',
      'deposits:read', 'deposits:create', 'deposits:manage', 'deposits:approve', 'deposits:reject',
      'withdrawals:read', 'withdrawals:create', 'withdrawals:manage', 'withdrawals:approve', 'withdrawals:reject',
      'reports:read', 'reports:create', 'reports:export', 'reports:share',
      'settings:read', 'settings:update', 'settings:manage',
      'casino:connect', 'casino:transfer', 'casino:sync', 'casino:manage'
    ];
    
    // First delete any existing permissions
    await db.delete(rolePermissions).where(eq(rolePermissions.role, 'admin'));
    
    // Insert the new permissions
    for (const permission of adminPermissions) {
      await db.insert(rolePermissions).values({
        role: 'admin',
        permission,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log(`Added ${adminPermissions.length} permissions for admin role`);
    console.log('Setup complete!');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
createAdminUser();