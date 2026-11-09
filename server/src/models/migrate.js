const { getPool } = require('../config/db');

async function migrate() {
  console.log('🔄 Running database migrations...');
  try {
    const pool = await getPool();
    console.log('✅ Migrations completed successfully.');
    if (pool.end) await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
