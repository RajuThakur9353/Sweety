const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const { getPool } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Initialize database pool and create tables if needed
    await getPool();

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
