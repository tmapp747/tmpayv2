import { db } from './server/db.js';
import { transactions } from './shared/schema.js';
import { sql } from 'drizzle-orm';

async function createTestTransaction() {
  try {
    console.log("Creating test transaction...");
    
    // Create a pending transaction
    const pendingTransaction = await db.insert(transactions).values({
      userId: 8, // Chubbyme user
      type: 'deposit',
      method: 'gcash_qr',
      amount: 500,
      status: 'pending',
      statusHistory: JSON.stringify([
        { status: 'pending', timestamp: new Date().toISOString(), note: 'Test transaction created' }
      ]),
      statusUpdatedAt: new Date(),
      paymentReference: `TEST-${Date.now()}`,
      currency: 'PHP',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    console.log("Created pending transaction:", pendingTransaction[0]);
    
    // After 10 seconds, update to completed
    setTimeout(async () => {
      console.log("Updating transaction to completed...");
      
      const transactionId = pendingTransaction[0].id;
      const historyEntry = {
        status: 'completed',
        timestamp: new Date().toISOString(),
        note: 'Test transaction completed'
      };
      
      const statusHistory = [...JSON.parse(pendingTransaction[0].statusHistory), historyEntry];
      
      await db.update(transactions)
        .set({
          status: 'completed',
          statusHistory: JSON.stringify(statusHistory),
          statusUpdatedAt: new Date(),
          completedAt: new Date(),
          balanceBefore: '0.00',
          balanceAfter: '500.00',
          updatedAt: new Date()
        })
        .where(sql`${transactions.id} = ${transactionId}`);
      
      console.log("Transaction updated to completed");
    }, 10000);
    
  } catch (error) {
    console.error("Error creating test transaction:", error);
  }
}

createTestTransaction();
