# Enhanced Statistics API Integration

## Overview

This document describes the integration of the improved TM Pay API endpoint for retrieving comprehensive user statistics and hierarchy data, while maintaining backward compatibility with existing API consumers.

## API Endpoint

The enhanced API endpoint is available at:
```
https://tmpay747.azurewebsites.net/api/Bridge/get-user/{username}
```

This endpoint provides significantly richer data than the previous casino API endpoint, including:
- Detailed turnover statistics
- Comprehensive betting history 
- Complete deposit/withdrawal records
- Manager hierarchy information

## Integration Implementation

The integration has been implemented in a way that preserves backward compatibility while providing access to the enhanced data.

### Key Components:

1. **Enhanced Data Retrieval**: The `getUserDetails` method in `Casino747Api` class now accesses the optimized endpoint with better error handling and logging.

2. **Backward Compatible Format**: The API response format remains unchanged, ensuring that existing API consumers continue to work without modification.

3. **Enhanced Data Mapping**: The detailed data from the TM Pay API is mapped to our existing structure while preserving all the rich information.

4. **Special Case Handling**: Special case handling for known users (e.g., Athan45) has been enhanced to leverage the richer data.

## Data Structure

The enhanced API provides a much richer data structure including:

### TurnOver Object
- `totalBetAmount`: Total amount of all bets placed
- `withdrawalAmount`: Total amount withdrawn
- `totalBalance`: Total current balance
- `sportTotalBetAmount`: Total amount bet on sports
- `sportNetProfit`: Net profit from sports betting
- `netProfit`: Overall net profit 
- `depositAmount`: Total amount deposited
- `withdrawalCount`: Number of withdrawals
- `depositCount`: Number of deposits
- `casinoTotalBetAmount`: Total amount bet in casino
- `casinoNetProfit`: Net profit from casino betting
- `casinoBetCount`: Number of casino bets
- `currentBalance`: Current balance

### Statistic Object
- Contains summary statistics
- Includes `statisticsForThePast7Days` with recent activity
- Provides `statisticsForMostRecentDeposit` for latest deposit details

### Managers
- Array of manager usernames in the hierarchy

## Testing

The integration has been tested to ensure:

1. The enhanced API endpoint is successfully reached and returns valid data
2. The data format is consistent with existing API expectations
3. The enriched data is properly accessible via our existing API structure
4. The system gracefully handles API unavailability with fallback mechanisms

## Usage Example

Here's an example of accessing enhanced statistics in the frontend:

```typescript
const { data: statsData } = useQuery<CasinoStatistics>({
  queryKey: ['/api/casino/user-stats', username],
  queryFn: async () => {
    const response = await fetch(`/api/casino/user-stats/${username}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.statusText}`);
    }
    return await response.json();
  },
  enabled: true,
  refetchInterval: 30000, // Refresh every 30 seconds
});

// Access enhanced data through existing structure
const currentBalance = statsData?.statistics?.currentBalance;
const totalDeposits = statsData?.statistics?.totalDeposit;
const totalBets = statsData?.statistics?.totalBet;
const netProfit = statsData?.statistics?.netProfit;
```

## Conclusion

The enhanced TM Pay API integration provides much richer user data while maintaining backward compatibility with existing API consumers. This enables enhanced features and more detailed statistics display without breaking existing functionality.