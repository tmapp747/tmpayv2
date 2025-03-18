/**
 * Database Migration Script for 747 Casino E-Wallet Platform
 * 
 * This script handles database schema migrations, adding new fields and tables 
 * to support enhanced role management and field mapping from external APIs.
 */

import { db } from './server/db';
import { rolePermissions, supportedUserRoles } from './shared/schema';
import { sql } from 'drizzle-orm';

async function migrateDatabase() {
  try {
    console.log('Starting database migration...');

    // Step 1: Add new user role fields
    console.log('Step 1: Adding new user role fields...');
    await addUserRoleFields();
    
    // Step 2: Create role permissions table if it doesn't exist
    console.log('Step 2: Creating role permissions table...');
    await createRolePermissionsTable();
    
    // Step 3: Set up default role permissions
    console.log('Step 3: Setting up default role permissions...');
    await setupDefaultRolePermissions();
    
    // Step 4: Update existing users with default roles
    console.log('Step 4: Updating existing users with default roles...');
    await updateExistingUsersWithRoles();
    
    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Database migration failed:', error);
    process.exit(1);
  }
}

async function addUserRoleFields() {
  try {
    // Check if the status column exists
    const statusColumnExists = await checkColumnExists('users', 'status');
    if (!statusColumnExists) {
      console.log('Adding status column to users table...');
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' NOT NULL
      `);
    }
    
    // Check if the role column exists
    const roleColumnExists = await checkColumnExists('users', 'role');
    if (!roleColumnExists) {
      console.log('Adding role column to users table...');
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'player' NOT NULL
      `);
    }
    
    // Add other new columns from our schema
    const columns = [
      { name: 'last_login_at', type: 'TIMESTAMP' },
      { name: 'last_login_ip', type: 'TEXT' },
      { name: 'status_reason', type: 'TEXT' },
      { name: 'vip_level', type: 'INTEGER DEFAULT 0' },
      { name: 'vip_since', type: 'TIMESTAMP' },
      { name: 'referred_by', type: 'INTEGER' },
      { name: 'referral_code', type: 'TEXT' }
    ];
    
    for (const column of columns) {
      const columnExists = await checkColumnExists('users', column.name);
      if (!columnExists) {
        console.log(`Adding ${column.name} column to users table...`);
        await db.execute(sql.raw(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}
        `));
      }
    }
    
    console.log('User role fields added successfully.');
  } catch (error) {
    console.error('Error adding user role fields:', error);
    throw error;
  }
}

async function createRolePermissionsTable() {
  try {
    // Check if role_permissions table exists
    const tableExists = await checkTableExists('role_permissions');
    
    if (!tableExists) {
      console.log('Creating role_permissions table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS role_permissions (
          id SERIAL PRIMARY KEY,
          role TEXT NOT NULL,
          permission TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE UNIQUE INDEX IF NOT EXISTS idx_role_permission_unique 
        ON role_permissions(role, permission);
      `);
    }
    
    console.log('Role permissions table created successfully.');
  } catch (error) {
    console.error('Error creating role permissions table:', error);
    throw error;
  }
}

async function setupDefaultRolePermissions() {
  try {
    // Define default permissions for each role
    const defaultPermissions = {
      'player': [
        'transactions:read',
        'transactions:create',
        'deposits:create',
        'deposits:read',
        'withdrawals:create',
        'withdrawals:read'
      ],
      'agent': [
        'transactions:read',
        'transactions:create',
        'deposits:create',
        'deposits:read',
        'withdrawals:create',
        'withdrawals:read',
        'users:read',
        'reports:read'
      ],
      'admin': [
        'users:read',
        'users:create',
        'users:update',
        'users:delete',
        'users:manage',
        'transactions:read',
        'transactions:create',
        'transactions:update',
        'transactions:delete',
        'transactions:approve',
        'transactions:reject',
        'deposits:create',
        'deposits:read',
        'deposits:update',
        'deposits:approve',
        'deposits:reject',
        'deposits:manage',
        'withdrawals:create',
        'withdrawals:read',
        'withdrawals:update',
        'withdrawals:approve',
        'withdrawals:reject',
        'withdrawals:manage',
        'reports:read',
        'reports:create',
        'reports:export',
        'settings:read',
        'settings:update',
        'casino:connect',
        'casino:transfer',
        'casino:sync',
        'casino:manage'
      ]
    };
    
    // Get existing permissions
    const existingPermissions = await db.select()
      .from(rolePermissions)
      .execute();
    
    console.log(`Found ${existingPermissions.length} existing role permissions.`);
    
    // Create a map of existing permissions for quick lookup
    const existingPermissionsMap = new Map();
    existingPermissions.forEach(permission => {
      const key = `${permission.role}:${permission.permission}`;
      existingPermissionsMap.set(key, permission);
    });
    
    // Insert default permissions if they don't exist
    let insertedCount = 0;
    
    for (const role of supportedUserRoles) {
      if (!defaultPermissions[role]) continue;
      
      for (const permission of defaultPermissions[role]) {
        const key = `${role}:${permission}`;
        
        if (!existingPermissionsMap.has(key)) {
          await db.insert(rolePermissions)
            .values({
              role,
              permission,
              createdAt: new Date(),
              updatedAt: new Date()
            })
            .execute();
          
          insertedCount++;
        }
      }
    }
    
    console.log(`Inserted ${insertedCount} new role permissions.`);
  } catch (error) {
    console.error('Error setting up default role permissions:', error);
    throw error;
  }
}

async function updateExistingUsersWithRoles() {
  try {
    // Update existing users with default roles:
    // - Users with user role or null role -> player
    // - Users with admin role -> admin
    
    // First, count users without role set
    const result = await db.execute(sql`
      SELECT COUNT(*) FROM users WHERE role IS NULL OR role = ''
    `);
    
    const userCount = parseInt(result.rows[0].count, 10);
    console.log(`Found ${userCount} users without a role set.`);
    
    if (userCount > 0) {
      // Update users with no role or empty role to 'player'
      await db.execute(sql`
        UPDATE users
        SET role = 'player'
        WHERE role IS NULL OR role = ''
      `);
      
      console.log(`Updated ${userCount} users to have 'player' role.`);
    }
    
    // Update users with 'user' role to 'player'
    const userRoleResult = await db.execute(sql`
      SELECT COUNT(*) FROM users WHERE role = 'user'
    `);
    
    const userRoleCount = parseInt(userRoleResult.rows[0].count, 10);
    
    if (userRoleCount > 0) {
      await db.execute(sql`
        UPDATE users
        SET role = 'player'
        WHERE role = 'user'
      `);
      
      console.log(`Updated ${userRoleCount} users from 'user' role to 'player' role.`);
    }
    
    // Set status for all users to 'active' if not set
    await db.execute(sql`
      UPDATE users
      SET status = 'active'
      WHERE status IS NULL OR status = ''
    `);
    
    console.log('All users have been updated with proper roles and statuses.');
  } catch (error) {
    console.error('Error updating existing users with roles:', error);
    throw error;
  }
}

async function checkColumnExists(table: string, column: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = ${table}
        AND column_name = ${column}
      ) as exists
    `);
    
    return result.rows[0].exists;
  } catch (error) {
    console.error(`Error checking if column ${column} exists in ${table}:`, error);
    throw error;
  }
}

async function checkTableExists(table: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = ${table}
      ) as exists
    `);
    
    return result.rows[0].exists;
  } catch (error) {
    console.error(`Error checking if table ${table} exists:`, error);
    throw error;
  }
}

// Run the migration
migrateDatabase().then(() => {
  console.log('Migration script execution completed');
  process.exit(0);
}).catch(error => {
  console.error('Migration script execution failed:', error);
  process.exit(1);
});