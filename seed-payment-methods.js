/**
 * Script to seed initial payment methods into the database
 * 
 * This script creates a set of default payment methods that will be
 * available for users to select when adding their banking info.
 */
import { db } from "./server/db.js";
import { paymentMethods } from "./shared/schema.js";

async function seedPaymentMethods() {
  // Check if we already have payment methods to avoid duplicates
  const existingMethods = await db.select().from(paymentMethods);
  
  if (existingMethods.length > 0) {
    console.log(`Found ${existingMethods.length} existing payment methods, skipping seed.`);
    return;
  }
  
  // Banks
  const banks = [
    {
      name: "BDO",
      type: "bank",
      accountName: "747 E-Wallet",
      accountNumber: "00123456789",
      bankName: "Banco de Oro",
      instructions: "Transfer to this BDO account. Include reference number in the notes.",
      iconUrl: "/assets/icons/bdo.svg",
      isActive: true,
      sortOrder: 10
    },
    {
      name: "BPI",
      type: "bank",
      accountName: "747 E-Wallet",
      accountNumber: "1234567890",
      bankName: "Bank of the Philippine Islands",
      instructions: "Transfer to this BPI account. Include reference number in the notes.",
      iconUrl: "/assets/icons/bpi.svg",
      isActive: true,
      sortOrder: 20
    },
    {
      name: "Metrobank",
      type: "bank",
      accountName: "747 E-Wallet",
      accountNumber: "123-456-78901",
      bankName: "Metropolitan Bank & Trust Company",
      instructions: "Transfer to this Metrobank account. Include reference number in the notes.",
      iconUrl: "/assets/icons/metrobank.svg",
      isActive: true,
      sortOrder: 30
    }
  ];
  
  // E-Wallets
  const wallets = [
    {
      name: "GCash",
      type: "wallet",
      accountName: "747 E-Wallet",
      accountNumber: "09123456789",
      instructions: "Send money to this GCash number. Include reference number in the notes.",
      iconUrl: "/assets/icons/gcash.svg",
      isActive: true,
      sortOrder: 5
    },
    {
      name: "Maya",
      type: "wallet",
      accountName: "747 E-Wallet",
      accountNumber: "09876543210",
      instructions: "Send money to this Maya account. Include reference number in the notes.",
      iconUrl: "/assets/icons/maya.svg",
      isActive: true,
      sortOrder: 6
    },
    {
      name: "Coins.ph",
      type: "wallet",
      accountName: "747 E-Wallet",
      accountNumber: "09123456780",
      instructions: "Send money to this Coins.ph wallet. Include reference number in the notes.",
      iconUrl: "/assets/icons/coinsph.svg",
      isActive: true,
      sortOrder: 40
    }
  ];
  
  // Crypto wallets
  const crypto = [
    {
      name: "USDT (Tether) TRC20",
      type: "crypto",
      accountName: "747 E-Wallet",
      accountNumber: "TRC20Address123456789ABCDEFG",
      instructions: "Send USDT to this TRC20 wallet address. Include reference number in the memo.",
      iconUrl: "/assets/icons/usdt.svg",
      isActive: true,
      sortOrder: 50
    },
    {
      name: "USDT (Tether) ERC20",
      type: "crypto",
      accountName: "747 E-Wallet",
      accountNumber: "0x123456789ABCDEFG",
      instructions: "Send USDT to this ERC20 wallet address. Gas fees may apply.",
      iconUrl: "/assets/icons/usdt.svg",
      isActive: true,
      sortOrder: 60
    }
  ];
  
  const allMethods = [...banks, ...wallets, ...crypto];
  
  try {
    // Insert all payment methods
    const result = await db.insert(paymentMethods).values(allMethods);
    
    console.log(`Successfully seeded ${allMethods.length} payment methods!`);
  } catch (error) {
    console.error("Error seeding payment methods:", error);
  }
}

// Run the seeding function
seedPaymentMethods()
  .then(() => {
    console.log("Seed completed.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Error in seed script:", error);
    process.exit(1);
  });