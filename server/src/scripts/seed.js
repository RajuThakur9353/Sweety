const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { getTodayString } = require('../middleware/validate');

async function seed({ shouldExit = false } = {}) {
  console.log('🌱 Starting Sweety database seed...');
  try {
    // Ensure tables exist
    await db.getPool();

    // 1. Create or retrieve demo patient user
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('password123', saltRounds);

    let userResult = await db.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1);`,
      ['demo@sweety.app']
    );

    let userId;
    if (userResult.rows.length === 0) {
      const insertUser = await db.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id;`,
        ['Demo Patient', 'demo@sweety.app', passwordHash, 'patient']
      );
      userId = insertUser.rows[0].id;
      console.log(`👤 Created demo patient user: demo@sweety.app (ID: ${userId})`);
    } else {
      userId = userResult.rows[0].id;
      console.log(`ℹ️ Existing demo patient user found (ID: ${userId})`);
    }

    // 2. Create demo doctor user (bonus feature)
    let doctorResult = await db.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1);`,
      ['doctor@sweety.app']
    );

    if (doctorResult.rows.length === 0) {
      await db.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4);`,
        ['Dr. Sarah Mitchell', 'doctor@sweety.app', passwordHash, 'doctor']
      );
      console.log(`👨‍⚕️ Created demo doctor user: doctor@sweety.app`);
    }

    // Clear existing readings for this demo user so seed is idempotent
    await db.query(`DELETE FROM readings WHERE user_id = $1;`, [userId]);

    // 3. Generate sample readings for the last 45 days up to today
    const slots = [
      { name: 'Morning (fasting)', base: 95, variance: 15, notes: ['Fasting 10h', 'Well rested', 'Early morning run', null] },
      { name: 'After breakfast', base: 135, variance: 25, notes: ['Oatmeal & eggs', 'Idli & sambar', 'Avocado toast', null] },
      { name: 'After lunch', base: 145, variance: 30, notes: ['Brown rice & veggies', 'Chicken salad', 'Quinoa bowl', null] },
      { name: 'After dinner', base: 140, variance: 25, notes: ['Lentil soup', 'Light salad', 'Walked 20 mins after meal', null] },
    ];

    const today = new Date();
    let totalReadingsAdded = 0;

    for (let dayOffset = 45; dayOffset >= 0; dayOffset--) {
      const d = new Date(today);
      d.setDate(d.getDate() - dayOffset);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      for (const slot of slots) {
        const delta = Math.floor(Math.random() * (slot.variance * 2 + 1)) - slot.variance;
        const value = Math.max(70, Math.min(260, slot.base + delta));
        const note = slot.notes[Math.floor(Math.random() * slot.notes.length)];

        await db.query(
          `INSERT INTO readings (user_id, reading_date, slot, value, notes)
           VALUES ($1, $2, $3, $4, $5);`,
          [userId, dateStr, slot.name, value, note]
        );
        totalReadingsAdded++;
      }
    }

    console.log(`✅ Successfully seeded ${totalReadingsAdded} blood glucose readings for demo user!`);
    console.log(`📋 Credentials:`);
    console.log(`   Patient: demo@sweety.app / password123`);
    console.log(`   Doctor:  doctor@sweety.app / password123`);
    console.log('🎉 Database seeding complete.');
    if (shouldExit) {
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    if (shouldExit) {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  seed({ shouldExit: true });
}

module.exports = seed;
