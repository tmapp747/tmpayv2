/**
 * Simple script to seed payment methods into the database
 */
const { Pool } = require('pg');

// Connect to the database using the environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function seedPaymentMethods() {
  // Check if we already have payment methods to avoid duplicates
  const existingMethodsResult = await pool.query('SELECT COUNT(*) FROM payment_methods');
  
  if (parseInt(existingMethodsResult.rows[0].count) > 0) {
    console.log(`Found ${existingMethodsResult.rows[0].count} existing payment methods, skipping seed.`);
    return;
  }
  
  // Banks
  const banks = [
    {
      name: "BDO",
      type: "bank",
      account_name: "747 E-Wallet",
      account_number: "00123456789",
      bank_name: "Banco de Oro",
      instructions: "Transfer to this BDO account. Include reference number in the notes.",
      icon_url: "/assets/icons/bdo.svg",
      is_active: true,
      sort_order: 10
    },
    {
      name: "BPI",
      type: "bank",
      account_name: "747 E-Wallet",
      account_number: "1234567890",
      bank_name: "Bank of the Philippine Islands",
      instructions: "Transfer to this BPI account. Include reference number in the notes.",
      icon_url: "/assets/icons/bpi.svg",
      is_active: true,
      sort_order: 20
    },
    {
      name: "Metrobank",
      type: "bank",
      account_name: "747 E-Wallet",
      account_number: "123-456-78901",
      bank_name: "Metropolitan Bank & Trust Company",
      instructions: "Transfer to this Metrobank account. Include reference number in the notes.",
      icon_url: "/assets/icons/metrobank.svg",
      is_active: true,
      sort_order: 30
    }
  ];
  
  // E-Wallets
  const wallets = [
    {
      name: "GCash",
      type: "wallet",
      account_name: "747 E-Wallet",
      account_number: "09123456789",
      instructions: "Send money to this GCash number. Include reference number in the notes.",
      icon_url: "/assets/icons/gcash.svg",
      is_active: true,
      sort_order: 5
    },
    {
      name: "Maya",
      type: "wallet",
      account_name: "747 E-Wallet",
      account_number: "09876543210",
      instructions: "Send money to this Maya account. Include reference number in the notes.",
      icon_url: "/assets/icons/maya.svg",
      is_active: true,
      sort_order: 6
    },
    {
      name: "Coins.ph",
      type: "wallet",
      account_name: "747 E-Wallet",
      account_number: "09123456780",
      instructions: "Send money to this Coins.ph wallet. Include reference number in the notes.",
      icon_url: "/assets/icons/coinsph.svg",
      is_active: true,
      sort_order: 40
    }
  ];
  
  // Crypto wallets
  const crypto = [
    {
      name: "USDT (Tether) TRC20",
      type: "crypto",
      account_name: "747 E-Wallet",
      account_number: "TRC20Address123456789ABCDEFG",
      instructions: "Send USDT to this TRC20 wallet address. Include reference number in the memo.",
      icon_url: "/assets/icons/usdt.svg",
      is_active: true,
      sort_order: 50
    },
    {
      name: "USDT (Tether) ERC20",
      type: "crypto",
      account_name: "747 E-Wallet",
      account_number: "0x123456789ABCDEFG",
      instructions: "Send USDT to this ERC20 wallet address. Gas fees may apply.",
      icon_url: "/assets/icons/usdt.svg",
      is_active: true,
      sort_order: 60
    }
  ];
  
  const allMethods = [...banks, ...wallets, ...crypto];
  
  try {
    // Use a client from the pool for the transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const method of allMethods) {
        // Insert each payment method
        const insertQuery = `
          INSERT INTO payment_methods (
            name, type, account_name, account_number, bank_name, 
            instructions, icon_url, is_active, sort_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        
        await client.query(insertQuery, [
          method.name,
          method.type,
          method.account_name,
          method.account_number,
          method.bank_name || null,
          method.instructions || null,
          method.icon_url || null,
          method.is_active,
          method.sort_order
        ]);
        
        console.log(`Added payment method: ${method.name}`);
      }
      
      await client.query('COMMIT');
      console.log(`Successfully seeded ${allMethods.length} payment methods!`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error seeding payment methods:", error);
  } finally {
    // Close the pool
    pool.end();
  }
}

// Run the seeding function
seedPaymentMethods();