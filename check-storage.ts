import { storage } from './server/storage';

// Get all users
const users = [...storage.getAllUsers().values()];
console.log('Current users in the database:');
console.log(JSON.stringify(users, null, 2));