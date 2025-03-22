/**
 * Test script for the enhanced TM Pay API integration
 * 
 * This script verifies that:
 * 1. The enhanced API endpoint provides richer user data
 * 2. The existing API format is preserved for backward compatibility
 * 3. The enhanced data is correctly mapped and accessible
 */

import { db } from './server/db';
import { Casino747Api } from './server/casino747Api-simplified';
import { storage } from './server/storage';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize the casino API client
const casino747Api = new Casino747Api(storage);

// Username to test with
const TEST_USERNAME = 'Athan45';

// Helper function to print JSON in a more readable format
function prettyPrint(obj: any) {
  console.log(JSON.stringify(obj, null, 2));
}

// Test the enhanced API getUserDetails method
async function testEnhancedApiEndpoint() {
  console.log('\n=== Testing Enhanced TM Pay API Integration ===\n');
  
  try {
    console.log(`🔍 Fetching detailed stats for ${TEST_USERNAME} from TM Pay API...`);
    const userDetails = await casino747Api.getUserDetails(TEST_USERNAME);
    
    if (!userDetails) {
      console.error('❌ Failed to fetch user details from TM Pay API');
      return false;
    }
    
    console.log(`✅ Successfully fetched detailed data for ${TEST_USERNAME}`);
    
    // Verify we got rich data from the enhanced API
    console.log('\n--- Enhanced API Response Structure ---');
    console.log('API Fields Available:');
    
    // List the top-level fields
    Object.keys(userDetails).forEach(key => {
      if (typeof userDetails[key] === 'object' && userDetails[key] !== null) {
        console.log(`- ${key}: [Object with ${Object.keys(userDetails[key]).length} properties]`);
      } else {
        console.log(`- ${key}: ${userDetails[key]}`);
      }
    });
    
    // Check for the rich turnOver data
    if (userDetails.turnOver) {
      console.log('\nTurnOver Data Structure:');
      const turnOverKeys = Object.keys(userDetails.turnOver);
      turnOverKeys.forEach(key => {
        console.log(`- ${key}: ${userDetails.turnOver[key]}`);
      });
      
      // Verify key metrics
      const balance = userDetails.turnOver.currentBalance || 0;
      const totalBet = userDetails.turnOver.totalBetAmount || 0;
      const deposits = userDetails.turnOver.depositAmount || 0;
      
      console.log(`\n📊 Key Metrics for ${TEST_USERNAME}:`);
      console.log(`- Current Balance: ${balance}`);
      console.log(`- Total Bets: ${totalBet}`);
      console.log(`- Total Deposits: ${deposits}`);
      
      return true;
    } else {
      console.log('❌ No turnOver data found in the response');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing enhanced API:', error);
    return false;
  }
}

// Test the HTTP endpoint to verify backward compatibility
async function testHttpEndpoint() {
  console.log('\n=== Testing HTTP Endpoint for Backward Compatibility ===\n');
  
  try {
    console.log(`🔍 Fetching user stats from HTTP endpoint for ${TEST_USERNAME}...`);
    const response = await axios.get(`http://localhost:5000/api/casino/user-stats/${TEST_USERNAME}`);
    
    if (!response.data || !response.data.success) {
      console.error('❌ Failed to fetch user stats from HTTP endpoint');
      return false;
    }
    
    console.log(`✅ Successfully fetched stats from HTTP endpoint for ${TEST_USERNAME}`);
    
    // Verify the response has the expected structure for backward compatibility
    const data = response.data;
    console.log('\n--- HTTP Endpoint Response Structure ---');
    
    // Verify required fields exist
    const requiredFields = [
      'success', 'clientId', 'username', 'statistics', 'turnOver', 'managers'
    ];
    
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    console.log('✅ All required fields present (success, clientId, username, statistics, turnOver, managers)');
    
    // Verify statistics contains all expected fields
    const statsFields = [
      'currentBalance', 'totalDeposit', 'totalWithdrawal', 'totalBet', 
      'totalWin', 'netProfit', 'wageredAmount'
    ];
    
    const missingStatsFields = statsFields.filter(field => !(field in data.statistics));
    
    if (missingStatsFields.length > 0) {
      console.error(`❌ Missing statistics fields: ${missingStatsFields.join(', ')}`);
      return false;
    }
    
    console.log('✅ All statistics fields present');
    
    // Verify turnOver contains all expected fields
    const turnOverFields = ['daily', 'weekly', 'monthly', 'yearly'];
    
    const missingTurnOverFields = turnOverFields.filter(field => !(field in data.turnOver));
    
    if (missingTurnOverFields.length > 0) {
      console.error(`❌ Missing turnOver fields: ${missingTurnOverFields.join(', ')}`);
      return false;
    }
    
    console.log('✅ All turnOver fields present');
    
    // Verify we have enhanced data in the correct format
    console.log('\n📊 Sample Data from HTTP Response:');
    console.log(`- Current Balance: ${data.statistics.currentBalance}`);
    console.log(`- Total Bets: ${data.statistics.totalBet}`);
    console.log(`- Total Deposits: ${data.statistics.totalDeposit}`);
    console.log(`- Total Withdrawals: ${data.statistics.totalWithdrawal}`);
    console.log(`- Net Profit: ${data.statistics.netProfit}`);
    console.log(`- Daily Turnover: ${data.turnOver.daily}`);
    console.log(`- Weekly Turnover: ${data.turnOver.weekly}`);
    console.log(`- Monthly Turnover: ${data.turnOver.monthly}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error testing HTTP endpoint:', error);
    return false;
  }
}

// Run all tests
async function runTests() {
  try {
    console.log('🧪 Starting Enhanced API Integration Tests');
    
    // Test the enhanced API directly
    const enhancedApiSuccess = await testEnhancedApiEndpoint();
    
    // Test the HTTP endpoint for backward compatibility
    const httpEndpointSuccess = await testHttpEndpoint();
    
    // Overall test result
    if (enhancedApiSuccess && httpEndpointSuccess) {
      console.log('\n✅ ALL TESTS PASSED: Enhanced API is fully functional and backward compatible');
    } else {
      console.log('\n❌ SOME TESTS FAILED: See details above');
    }
    
    // Close the database connection
    await db.end();
  } catch (error) {
    console.error('❌ Error running tests:', error);
  }
}

// Run the tests
runTests();