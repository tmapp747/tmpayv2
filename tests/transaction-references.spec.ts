import { test, expect } from '@playwright/test';

/**
 * Comprehensive test suite for the username-based transaction reference system
 * 
 * This test suite validates:
 * 1. Transaction references now include username for better tracking
 * 2. Transactions are immediately visible in user's history
 * 3. References are consistent across different transaction types
 * 4. Login works with supplied credentials
 */

// Test user credentials
const TEST_USER = {
  username: 'Chubbyme',
  password: 'Password@123'
};

test.describe('Username-Based Transaction References', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the application
    await page.goto('http://localhost:3000');
    
    // Login with the test user
    await page.getByLabel('Username').fill(TEST_USER.username);
    await page.getByLabel('Password').fill(TEST_USER.password);
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for the dashboard to load
    await expect(page.getByText('Welcome back')).toBeVisible({ timeout: 5000 });
    console.log('Successfully logged in as', TEST_USER.username);
  });

  test('Test transaction reference contains username', async ({ page }) => {
    console.log('Testing transaction reference format...');
    
    // Navigate to the wallet/deposit page
    await page.getByRole('link', { name: 'Wallet' }).click();
    await page.getByRole('button', { name: 'Deposit' }).click();
    
    // Select a test deposit amount
    await page.getByRole('button', { name: '₱100' }).click();
    
    // Get the current transaction count
    const transactionCountBefore = await page.locator('.transaction-item').count();
    console.log('Transaction count before:', transactionCountBefore);
    
    // Create a test transaction
    await page.getByRole('button', { name: 'Generate QR Code' }).click();
    
    // Wait for the QR code to be generated
    await expect(page.getByText('Scan this QR code')).toBeVisible({ timeout: 10000 });
    
    // Check if the reference contains the username
    const referenceText = await page.locator('.payment-reference').textContent();
    expect(referenceText?.toLowerCase()).toContain(TEST_USER.username.toLowerCase());
    console.log('Reference text:', referenceText);
    
    // Go back to the transaction history
    await page.getByRole('link', { name: 'Transaction History' }).click();
    
    // Verify the transaction is immediately visible
    await page.waitForTimeout(2000); // Wait for any potential UI updates
    const transactionCountAfter = await page.locator('.transaction-item').count();
    console.log('Transaction count after:', transactionCountAfter);
    
    // Assert that we have at least one more transaction than before
    expect(transactionCountAfter).toBeGreaterThan(transactionCountBefore);
    
    // Verify the newest transaction has our username in the reference
    const latestTransactionReference = await page.locator('.transaction-item').first().locator('.transaction-reference').textContent();
    expect(latestTransactionReference?.toLowerCase()).toContain(TEST_USER.username.toLowerCase());
    console.log('Latest transaction reference:', latestTransactionReference);
  });

  test('Manual payment references include username', async ({ page }) => {
    console.log('Testing manual payment references...');
    
    // Navigate to the wallet/deposit page
    await page.getByRole('link', { name: 'Wallet' }).click();
    await page.getByRole('button', { name: 'Deposit' }).click();
    
    // Choose manual payment option
    await page.getByRole('tab', { name: 'Manual Payment' }).click();
    
    // Fill in manual payment details
    await page.getByLabel('Amount').fill('200');
    await page.getByLabel('Payment Method').selectOption('GCash');
    await page.getByLabel('Sender Name').fill('Test Sender');
    await page.getByLabel('Reference Number').fill('TEST12345');
    
    // Submit the manual payment
    await page.getByRole('button', { name: 'Submit Manual Payment' }).click();
    
    // Verify the payment is created and reference contains username
    await expect(page.getByText('Manual payment submitted')).toBeVisible({ timeout: 5000 });
    const referenceText = await page.locator('.payment-reference').textContent();
    expect(referenceText?.toLowerCase()).toContain(TEST_USER.username.toLowerCase());
    console.log('Manual payment reference:', referenceText);
    
    // Go to transaction history
    await page.getByRole('link', { name: 'Transaction History' }).click();
    
    // Verify the transaction is immediately visible
    await page.waitForTimeout(2000); // Wait for any potential UI updates
    const latestTransactionReference = await page.locator('.transaction-item').first().locator('.transaction-reference').textContent();
    expect(latestTransactionReference?.toLowerCase()).toContain(TEST_USER.username.toLowerCase());
    console.log('Latest transaction reference in history:', latestTransactionReference);
  });

  test('Casino deposit references include username', async ({ page }) => {
    console.log('Testing casino deposit references...');
    
    // Navigate to the wallet/deposit page
    await page.getByRole('link', { name: 'Wallet' }).click();
    
    // Click on Casino tab
    await page.getByRole('tab', { name: 'Casino' }).click();
    
    // Fill in casino deposit details
    await page.getByLabel('Amount').fill('150');
    
    // Get the current transaction count
    await page.getByRole('link', { name: 'Transaction History' }).click();
    const transactionCountBefore = await page.locator('.transaction-item').count();
    console.log('Transaction count before casino deposit:', transactionCountBefore);
    
    // Go back to casino tab
    await page.getByRole('link', { name: 'Wallet' }).click();
    await page.getByRole('tab', { name: 'Casino' }).click();
    
    // Submit the casino deposit
    await page.getByRole('button', { name: 'Deposit to Casino' }).click();
    
    // Verify the deposit is processed
    await expect(page.getByText('Casino deposit successful')).toBeVisible({ timeout: 5000 });
    
    // Go to transaction history
    await page.getByRole('link', { name: 'Transaction History' }).click();
    
    // Verify the transaction is immediately visible
    await page.waitForTimeout(2000); // Wait for any potential UI updates
    const transactionCountAfter = await page.locator('.transaction-item').count();
    console.log('Transaction count after casino deposit:', transactionCountAfter);
    
    // Assert that we have at least one more transaction than before
    expect(transactionCountAfter).toBeGreaterThan(transactionCountBefore);
    
    // Verify the newest transaction has our username in the reference
    const latestTransactionReference = await page.locator('.transaction-item').first().locator('.transaction-reference').textContent();
    expect(latestTransactionReference?.toLowerCase()).toContain(TEST_USER.username.toLowerCase());
    console.log('Casino deposit reference:', latestTransactionReference);
  });
});