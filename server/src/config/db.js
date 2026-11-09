const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

let pool;
let isInMemory = false;

function createPostgresPool() {
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 3000,
    });
  }

  return new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'sweety_db',
    password: process.env.PGPASSWORD || 'postgres',
    port: parseInt(process.env.PGPORT || '5432', 10),
    connectionTimeoutMillis: 3000,
  });
}

function createInMemoryPool() {
  const { newDb } = require('pg-mem');
  const db = newDb();

  // Register ROUND function
  db.public.registerFunction({
    name: 'round',
    args: [db.public.getType('float'), db.public.getType('integer')],
    returns: db.public.getType('float'),
    implementation: (val, decimals) => {
      if (val === null || val === undefined) return null;
      const factor = Math.pow(10, decimals);
      return Math.round(Number(val) * factor) / factor;
    },
  });

  // Register TO_CHAR functions for date and timestamp
  const toCharImpl = (val, fmt) => {
    if (!val) return null;
    const d = new Date(val);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  db.public.registerFunction({
    name: 'to_char',
    args: [db.public.getType('date'), db.public.getType('text')],
    returns: db.public.getType('text'),
    implementation: toCharImpl,
  });

  db.public.registerFunction({
    name: 'to_char',
    args: [db.public.getType('timestamp'), db.public.getType('text')],
    returns: db.public.getType('text'),
    implementation: toCharImpl,
  });

  const adapter = db.adapters.createPg();
  isInMemory = true;
  return new adapter.Pool();
}

async function initSchema(activePool) {
  const schemaPath = path.join(__dirname, '..', 'models', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  if (isInMemory) {
    const statements = [
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'patient',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS readings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reading_date DATE NOT NULL,
        slot VARCHAR(50) NOT NULL,
        value INTEGER NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_date_slot UNIQUE (user_id, reading_date, slot)
      );`
    ];

    for (const stmt of statements) {
      await activePool.query(stmt);
    }
  } else {
    await activePool.query(schemaSql);
  }
}

async function getPool() {
  if (pool) return pool;

  if (process.env.USE_IN_MEMORY_DB === 'true') {
    pool = createInMemoryPool();
    await initSchema(pool);
    console.log('ℹ️ Using in-memory PostgreSQL engine (pg-mem)');
    return pool;
  }

  const candidatePool = createPostgresPool();
  try {
    const client = await candidatePool.connect();
    client.release();
    pool = candidatePool;
    isInMemory = false;
    await initSchema(pool);
    console.log('✅ Connected to live PostgreSQL database');
    return pool;
  } catch (err) {
    console.warn(`⚠️ Could not connect to live PostgreSQL (${err.message}). Falling back to in-memory PostgreSQL engine.`);
    candidatePool.end().catch(() => {});
    pool = createInMemoryPool();
    await initSchema(pool);
    console.log('ℹ️ Connected to in-memory PostgreSQL engine (pg-mem)');
    return pool;
  }
}

module.exports = {
  getPool,
  query: async (text, params) => {
    const p = await getPool();
    return p.query(text, params);
  },
  resetForTests: async () => {
    pool = createInMemoryPool();
    await initSchema(pool);
    return pool;
  },
  isInMemory: () => isInMemory,
};
