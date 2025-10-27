// Test schema creation directly
require('dotenv').config();
const { ensureDatabaseAndSchema } = require('./src/lib/db');

async function test() {
  try {
    console.log('Running ensureDatabaseAndSchema...');
    await ensureDatabaseAndSchema();
    console.log('✓ Schema setup completed');
  } catch (err) {
    console.error('✗ Error:', err);
    process.exit(1);
  }
}

test();
