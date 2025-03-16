// Test script to verify the Casino747 transfer component
import { casino747Api } from './server/casino747Api';

async function testCasinoTransfer() {
  console.log('🎮 Testing Casino747 API transfer functionality');
  console.log('-------------------------------------------');
  
  try {
    // Test parameters
    const amount = 100;
    const toClientId = 329777805; // Wakay's ID as provided in your notes
    const toUsername = 'Wakay'; 
    const fromUsername = 'system'; // Critical test - should use Marcthepogi's token
    const comment = 'Test transfer from system account using Marcthepogi token';
    
    console.log('🔹 Test Parameters:');
    console.log(`- Amount: ${amount} PHP`);
    console.log(`- To User: ${toUsername} (ID: ${toClientId})`);
    console.log(`- From User: ${fromUsername}`);
    console.log(`- Comment: ${comment}`);
    console.log('-------------------------------------------');
    
    console.log('🔶 Attempting transfer...');
    
    // Call the transferFunds method which should use Marcthepogi's token for the system user
    const result = await casino747Api.transferFunds(
      amount,
      toClientId,
      toUsername,
      'php',
      fromUsername,
      comment
    );
    
    console.log('✅ Transfer successful!');
    console.log('🔹 Result:');
    console.log(JSON.stringify(result, null, 2));
    
    return { success: true, result };
    
  } catch (error) {
    console.error('❌ Transfer failed:');
    console.error(error);
    
    return { 
      success: false, 
      error: error.message || 'Unknown error' 
    };
  }
}

// Run the test
testCasinoTransfer();