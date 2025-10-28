require('dotenv').config();
const { ensureDatabaseAndSchema } = require('./src/lib/db');

async function run() {
  console.log('Running database migrations...\n');
  try {
    await ensureDatabaseAndSchema();
    console.log('\n✓ Migrations completed successfully');
  } catch (err) {
    console.error('\n✗ Migration failed:', err);
    process.exit(1);
  }
}

run();
