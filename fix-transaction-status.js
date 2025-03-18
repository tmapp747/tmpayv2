// Script to fix transaction status inconsistencies
import { db } from './server/db.js';
import * as schema from './shared/schema.js';
import { eq } from 'drizzle-orm';
import { determineTransactionStatus } from './shared/api-mapping.js';

/**
 * This script fixes transaction status inconsistencies by:
 * 1. Identifying transactions with mismatched status fields
 * 2. Updating component statuses based on metadata
 * 3. Recalculating the overall transaction status
 */
async function fixTransactionStatuses() {
  console.log("Starting transaction status fix...");
  
  try {
    // Get transaction 29 first
    const transaction = await db.query.transactions.findFirst({
      where: eq(schema.transactions.id, 29)
    });
    
    if (!transaction) {
      console.error("Transaction 29 not found");
      return;
    }
    
    console.log("Transaction 29 current status:");
    console.log(`- Overall status: ${transaction.status}`);
    console.log(`- GCash status: ${transaction.gcashStatus}`);
    console.log(`- Casino status: ${transaction.casinoStatus}`);
    console.log("- Metadata:", transaction.metadata);
    
    // Determine correct statuses based on metadata
    let updatedGcashStatus = transaction.gcashStatus;
    let updatedCasinoStatus = transaction.casinoStatus;
    
    // If metadata shows a completed casino transfer, update casino status
    if (transaction.metadata && 
        transaction.metadata.casinoTransferStatus === 'completed' && 
        transaction.metadata.casinoTransferCompletedAt) {
      updatedCasinoStatus = 'completed';
      console.log("Setting casino status to 'completed' based on metadata");
    }
    
    // When transaction shows it's completed but GCash still says processing,
    // update GCash status as well
    if (transaction.status === 'completed' && transaction.gcashStatus === 'processing') {
      updatedGcashStatus = 'success';
      console.log("Setting GCash status to 'success' based on overall completion");
    }
    
    // Recalculate overall transaction status
    const updatedStatus = determineTransactionStatus(updatedGcashStatus, updatedCasinoStatus);
    
    console.log("\nUpdated status fields:");
    console.log(`- Overall status: ${updatedStatus}`);
    console.log(`- GCash status: ${updatedGcashStatus}`);
    console.log(`- Casino status: ${updatedCasinoStatus}`);
    
    // Update the transaction with fixed status fields
    const result = await db.update(schema.transactions)
      .set({
        status: updatedStatus,
        gcashStatus: updatedGcashStatus,
        casinoStatus: updatedCasinoStatus,
        metadata: {
          ...transaction.metadata,
          statusFixed: true,
          statusFixedAt: new Date().toISOString(),
          previousStatus: {
            status: transaction.status,
            gcashStatus: transaction.gcashStatus,
            casinoStatus: transaction.casinoStatus
          }
        }
      })
      .where(eq(schema.transactions.id, transaction.id))
      .returning();
    
    console.log("\nTransaction status update result:");
    console.log(JSON.stringify(result, null, 2));
    
    console.log("\nStatus fix completed!");
    
  } catch (error) {
    console.error("Error fixing transaction status:", error);
  }
}

// Run the fix
fixTransactionStatuses().then(() => {
  console.log("Done!");
  process.exit(0);
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});