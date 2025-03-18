// Script to generate a hashed password for testing
import bcrypt from 'bcrypt';

async function hashPassword(password) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
}

async function runTest() {
  const password = 'pass123';
  const hashedPassword = await hashPassword(password);
  console.log(`Original password: ${password}`);
  console.log(`Hashed password: ${hashedPassword}`);
}

runTest();