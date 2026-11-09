const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const { getPool, query } = require('./config/db');
const seed = require('./scripts/seed');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Initialize database pool and create tables if needed
    await getPool();

    // Auto-seed if database has no users yet
    try {
      const userCountRes = await query('SELECT COUNT(*)::integer AS count FROM users;');
      const userCount = parseInt(userCountRes.rows[0]?.count || 0, 10);
      if (userCount === 0) {
        console.log('ℹ️ No users found in database. Auto-populating initial demo data...');
        await seed({ shouldExit: false });
      }
    } catch (e) {
      console.warn('Auto-seed check notice:', e.message);
    }

    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🩸 Sweety API Server running on port ${PORT}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
      console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
