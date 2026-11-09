-- Database Schema for Sweety - Blood Glucose Tracker

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'patient',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS readings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  slot VARCHAR(50) NOT NULL,
  value INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_date_slot UNIQUE (user_id, reading_date, slot),
  CONSTRAINT valid_slot CHECK (slot IN (
    'Morning (fasting)',
    'After breakfast',
    'After lunch',
    'After dinner'
  )),
  CONSTRAINT valid_value CHECK (value >= 40 AND value <= 600)
);

CREATE INDEX IF NOT EXISTS idx_readings_user_date ON readings(user_id, reading_date);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
