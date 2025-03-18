/**
 * Script to verify global constants have been added
 */
import { 
  TRANSACTION_STATUS, 
  PAYMENT_STATUS, 
  CASINO_STATUS, 
  DEFAULT_TOP_MANAGERS, 
  DEFAULT_TOP_MANAGER 
} from './server/constants';

console.log('Verifying global constants...');
console.log('\nTRANSACTION_STATUS:');
console.log(TRANSACTION_STATUS);

console.log('\nPAYMENT_STATUS:');
console.log(PAYMENT_STATUS);

console.log('\nCASINO_STATUS:');
console.log(CASINO_STATUS);

console.log('\nDEFAULT_TOP_MANAGERS:');
console.log(DEFAULT_TOP_MANAGERS);

console.log('\nDEFAULT_TOP_MANAGER:');
console.log(DEFAULT_TOP_MANAGER);