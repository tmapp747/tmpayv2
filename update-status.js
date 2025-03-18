/**
 * Simple script to update a transaction status to match its metadata
 */

import pg from 'pg';
const { Pool } = pg;

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function updateTransaction() {
  try {
    console.log("Starting transaction status update...");
    
    // Get transaction 29 first to see its current state
    const getResult = await pool.query(`
      SELECT id, status, gcash_status, casino_status, metadata
      FROM transactions
      WHERE id = 29
    `);
    
    if (getResult.rows.length === 0) {
      console.error("Transaction 29 not found");
      return;
    }
    
    const tx = getResult.rows[0];
    console.log("Transaction 29 current status:");
    console.log(`- Overall status: ${tx.status}`);
    console.log(`- GCash status: ${tx.gcashStatus}`);
    console.log(`- Casino status: ${tx.casinoStatus}`);
    console.log("- Metadata:", tx.metadata);
    
    // Determine correct statuses based on metadata
    let updatedGcashStatus = tx.gcash_status;
    let updatedCasinoStatus = tx.casino_status;
    
    // If metadata shows a completed casino transfer, update casino status
    if (tx.metadata && 
        tx.metadata.casinoTransferStatus === 'completed' && 
        tx.metadata.casinoTransferCompletedAt) {
      updatedCasinoStatus = 'completed';
      console.log("Setting casino status to 'completed' based on metadata");
    }
    
    // When transaction shows it's completed but GCash still says processing,
    // update GCash status as well
    if (tx.status === 'completed' && tx.gcash_status === 'processing') {
      updatedGcashStatus = 'success';
      console.log("Setting GCash status to 'success' based on overall completion");
    }
    
    // Calculate the overall transaction status
    // If both are successful, transaction is completed
    let updatedStatus = tx.status;
    if (updatedGcashStatus === 'success' && updatedCasinoStatus === 'completed') {
      updatedStatus = 'completed';
    }
    
    console.log("\nUpdated status fields:");
    console.log(`- Overall status: ${updatedStatus}`);
    console.log(`- GCash status: ${updatedGcashStatus}`);
    console.log(`- Casino status: ${updatedCasinoStatus}`);
    
    // Create an updated metadata object that preserves existing data
    // and adds our status fix information
    const updatedMetadata = {
      ...tx.metadata,
      statusFixed: true,
      statusFixedAt: new Date().toISOString(),
      previousStatus: {
        status: tx.status,
        gcashStatus: tx.gcash_status,
        casinoStatus: tx.casino_status
      }
    };
    
    // Update the transaction with fixed status fields
    const updateResult = await pool.query(`
      UPDATE transactions
      SET 
        status = $1,
        gcash_status = $2,
        casino_status = $3,
        metadata = $4
      WHERE id = 29
      RETURNING id, status, gcash_status, casino_status, metadata
    `, [updatedStatus, updatedGcashStatus, updatedCasinoStatus, updatedMetadata]);
    
    console.log("\nTransaction status update result:");
    console.log(JSON.stringify(updateResult.rows[0], null, 2));
    
    console.log("\nStatus fix completed successfully!");
    
  } catch (error) {
    console.error("Error updating transaction status:", error);
  } finally {
    pool.end();
  }
}

// Run the update
updateTransaction();