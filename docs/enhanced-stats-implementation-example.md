# Enhanced Stats Implementation Example

This document provides examples of how to enhance the MobileCasinoStats component to take advantage of the enriched data from the TM Pay API while maintaining backward compatibility.

## Example 1: Adding Deposit and Bet Count Stats

The following additions to the MobileCasinoStats component would display deposit count and bet count statistics using the enriched API data:

```tsx
// Inside the renderStatistics function in MobileCasinoStats.tsx

{/* Add this new section to display enhanced statistics */}
<div 
  className="bg-[#001849] rounded-xl p-4 shadow-md mt-3"
  onClick={() => toggleSection('activity')}
>
  <div className="flex justify-between items-center">
    <h3 className="font-medium">Activity Details</h3>
    <ChevronDown 
      className={`h-5 w-5 transition-transform ${expandedSection === 'activity' ? 'rotate-180' : ''}`}
    />
  </div>
  <AnimatePresence>
    {expandedSection === 'activity' && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden"
      >
        <div className="pt-3 space-y-2">
          {/* Enhanced data: Deposit count */}
          <div className="flex justify-between items-center">
            <span className="text-sm opacity-80">Total Deposits</span>
            <span className="font-medium">{statistics.depositCount || 'N/A'}</span>
          </div>
          
          {/* Enhanced data: Bet count */}
          <div className="flex justify-between items-center">
            <span className="text-sm opacity-80">Total Bets</span>
            <span className="font-medium">{statistics.casinoBetCount || 'N/A'}</span>
          </div>
          
          {/* Enhanced data: Win rate (if we have both bet count and win amount) */}
          {statistics.casinoBetCount && statistics.totalWin && (
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-80">Average Win per Bet</span>
              <span className="font-medium">
                {formatCurrency(statistics.totalWin / statistics.casinoBetCount)}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</div>
```

## Example 2: Enhanced TypeScript Interface

To properly type the enriched data while maintaining backward compatibility, you could update the CasinoStatistics interface:

```tsx
interface CasinoStatistics {
  clientId: number;
  isAgent: boolean;
  userType: string;
  username: string;
  topManager: string;
  immediateManager: string;
  statistics: {
    currentBalance: number;
    totalDeposit: number;
    totalWithdrawal: number;
    totalBet: number;
    totalWin: number;
    netProfit: number;
    wageredAmount: number;
    lastLoginDate: string;
    registrationDate: string;
    
    // Enhanced data fields (optional to maintain compatibility)
    depositCount?: number;
    withdrawalCount?: number;
    casinoBetCount?: number;
    sportBetCount?: number;
    currentCasinoBalance?: number;
    casinoNetProfit?: number;
    daily?: number;
    weekly?: number;
  };
  turnOver: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  managers: Array<{
    username: string;
    level: number;
    role: string;
  }>;
  
  // Optional field containing raw data for advanced use cases
  _rawData?: {
    turnOver?: any;
    statistic?: any;
    managers?: any[];
    hierarchy?: any[];
  };
}
```

## Example 3: Adding 7-Day Statistics Trend

The enhanced API provides 7-day trend data which can be used to create a simple trend visualization:

```tsx
// Inside the renderStatistics function in MobileCasinoStats.tsx

{/* Add this new section to display 7-day trend data */}
{statistics.last7Days && (
  <div 
    className="bg-[#001849] rounded-xl p-4 shadow-md mt-3"
    onClick={() => toggleSection('trends')}
  >
    <div className="flex justify-between items-center">
      <h3 className="font-medium">7-Day Trends</h3>
      <ChevronDown 
        className={`h-5 w-5 transition-transform ${expandedSection === 'trends' ? 'rotate-180' : ''}`}
      />
    </div>
    <AnimatePresence>
      {expandedSection === 'trends' && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="pt-3 space-y-2">
            {/* 7-day deposit trend */}
            <div>
              <span className="text-sm opacity-80">Deposit Trend</span>
              <div className="h-10 flex items-end space-x-1 mt-1">
                {statistics.last7Days.deposits.map((value, index) => (
                  <div 
                    key={index}
                    className="bg-blue-500 rounded-t w-full"
                    style={{ 
                      height: `${Math.max(5, (value / Math.max(...statistics.last7Days.deposits)) * 100)}%`
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* 7-day betting trend */}
            <div>
              <span className="text-sm opacity-80">Betting Trend</span>
              <div className="h-10 flex items-end space-x-1 mt-1">
                {statistics.last7Days.bets.map((value, index) => (
                  <div 
                    key={index}
                    className="bg-purple-500 rounded-t w-full"
                    style={{ 
                      height: `${Math.max(5, (value / Math.max(...statistics.last7Days.bets)) * 100)}%`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)}
```

## Important Notes

1. All enhancements are made in a backward-compatible way, so existing code continues to work.
2. The enhanced fields are accessed with optional chaining (`?.`) to handle cases where the data might not be available.
3. Default values or 'N/A' are provided for cases where the enhanced data is not present.
4. The implementation uses progressive enhancement - the base functionality works with the original API, and additional features are enabled when enhanced data is available.