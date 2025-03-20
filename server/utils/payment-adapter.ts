/**
 * Payment Method Field Adapter
 * 
 * This utility provides functions to convert between database field names (snake_case)
 * and frontend field names (camelCase) for payment method objects.
 * 
 * This helps maintain consistency across the application while respecting
 * the database schema and frontend component expectations.
 */

/**
 * Maps database payment method fields (snake_case) to frontend field names (camelCase)
 * @param dbPaymentMethod The payment method from the database
 * @returns A payment method object with camelCase field names for frontend use
 */
export function mapDbToFrontend(dbPaymentMethod: any): any {
  if (!dbPaymentMethod) return null;
  
  return {
    id: dbPaymentMethod.id,
    name: dbPaymentMethod.name,
    type: dbPaymentMethod.type,
    accountName: dbPaymentMethod.account_name || dbPaymentMethod.accountName,
    accountNumber: dbPaymentMethod.account_number || dbPaymentMethod.accountNumber,
    bankName: dbPaymentMethod.bank_name || dbPaymentMethod.bankName,
    instructions: dbPaymentMethod.instructions,
    iconUrl: dbPaymentMethod.icon_url || dbPaymentMethod.iconUrl,
    isActive: dbPaymentMethod.is_active !== undefined ? dbPaymentMethod.is_active : dbPaymentMethod.isActive,
    sortOrder: dbPaymentMethod.sort_order !== undefined ? dbPaymentMethod.sort_order : dbPaymentMethod.sortOrder,
    createdAt: dbPaymentMethod.created_at || dbPaymentMethod.createdAt,
    updatedAt: dbPaymentMethod.updated_at || dbPaymentMethod.updatedAt
  };
}

/**
 * Maps frontend payment method fields (camelCase) to database field names (snake_case)
 * @param frontendPaymentMethod The payment method from the frontend
 * @returns A payment method object with snake_case field names for database storage
 */
export function mapFrontendToDb(frontendPaymentMethod: any): any {
  if (!frontendPaymentMethod) return null;
  
  return {
    id: frontendPaymentMethod.id,
    name: frontendPaymentMethod.name,
    type: frontendPaymentMethod.type,
    account_name: frontendPaymentMethod.accountName || frontendPaymentMethod.account_name,
    account_number: frontendPaymentMethod.accountNumber || frontendPaymentMethod.account_number,
    bank_name: frontendPaymentMethod.bankName || frontendPaymentMethod.bank_name,
    instructions: frontendPaymentMethod.instructions,
    icon_url: frontendPaymentMethod.iconUrl || frontendPaymentMethod.icon_url,
    is_active: frontendPaymentMethod.isActive !== undefined ? frontendPaymentMethod.isActive : frontendPaymentMethod.is_active,
    sort_order: frontendPaymentMethod.sortOrder !== undefined ? frontendPaymentMethod.sortOrder : frontendPaymentMethod.sort_order,
    created_at: frontendPaymentMethod.createdAt || frontendPaymentMethod.created_at,
    updated_at: frontendPaymentMethod.updatedAt || frontendPaymentMethod.updated_at
  };
}