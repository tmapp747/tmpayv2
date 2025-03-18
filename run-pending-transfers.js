/**
 * Script to manually run the pending transfers processor
 * 
 * This script simply calls the process-pending-transfers.ts module
 * to process any pending casino transfers for completed payments.
 */

import { processPendingCasinoTransfers } from './process-pending-transfers.js';

async function runPendingTransfers() {
  console.log('🚀 Starting process to handle pending casino transfers...');
  
  try {
    await processPendingCasinoTransfers();
    console.log('✅ Process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error processing pending transfers:', error);
    process.exit(1);
  }
}

// Run the script
runPendingTransfers();