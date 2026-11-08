const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const { getTodayString } = require('../src/middleware/validate');

describe('Blood Glucose Readings API & Validation Rules', () => {
  let user1Token;
  let user2Token;
  const today = getTodayString();

  beforeAll(async () => {
    process.env.USE_IN_MEMORY_DB = 'true';
    await db.resetForTests();

    // Register User 1
    const res1 = await request(app).post('/api/auth/register').send({
      name: 'Alice Patient',
      email: 'alice@example.com',
      password: 'password123',
    });
    user1Token = res1.body.token;

    // Register User 2
    const res2 = await request(app).post('/api/auth/register').send({
      name: 'Bob Patient',
      email: 'bob@example.com',
      password: 'password123',
    });
    user2Token = res2.body.token;
  });

  describe('Validation Rules as Specified in Assignment', () => {
    test('Rule 1: Value is required -> "Please enter a glucose value."', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          date: today,
          slot: 'Morning (fasting)',
          // value omitted
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Please enter a glucose value.');
    });

    test('Rule 2: Value must be a whole number between 40 and 600 -> "Value must be between 40 and 600 mg/dl."', async () => {
      // Test below 40
      const resLow = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          date: today,
          slot: 'Morning (fasting)',
          value: 39,
        });

      expect(resLow.status).toBe(400);
      expect(resLow.body.error).toBe('Value must be between 40 and 600 mg/dl.');

      // Test above 600
      const resHigh = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          date: today,
          slot: 'Morning (fasting)',
          value: 601,
        });

      expect(resHigh.status).toBe(400);
      expect(resHigh.body.error).toBe('Value must be between 40 and 600 mg/dl.');

      // Test non-integer (decimal)
      const resDecimal = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          date: today,
          slot: 'Morning (fasting)',
          value: 120.5,
        });

      expect(resDecimal.status).toBe(400);
      expect(resDecimal.body.error).toBe('Value must be between 40 and 600 mg/dl.');
    });

    test('Rule 3: Only one reading per slot per day -> "You already have an After lunch reading for this date."', async () => {
      // Add first After lunch reading
      const resFirst = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          date: today,
          slot: 'After lunch',
          value: 140,
        });
      expect(resFirst.status).toBe(201);

      // Attempt duplicate After lunch reading on same date
      const resDuplicate = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          date: today,
          slot: 'After lunch',
          value: 155,
        });

      expect(resDuplicate.status).toBe(400);
      expect(resDuplicate.body.error).toBe('You already have an After lunch reading for this date.');
    });

    test('Rule 4: Maximum 4 readings per day -> "You can add only 4 readings per day."', async () => {
      // We already have 'After lunch' for today. Add the other 3 slots:
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ date: today, slot: 'Morning (fasting)', value: 95 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ date: today, slot: 'After breakfast', value: 130 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ date: today, slot: 'After dinner', value: 135 });

      // Now day has 4 readings. Try adding a 5th reading on same date:
      const res5th = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          date: today,
          slot: 'Morning (fasting)',
          value: 100,
        });

      expect(res5th.status).toBe(400);
      // Either duplicate slot or max 4 readings
      expect([
        'You can add only 4 readings per day.',
        'You already have a Morning (fasting) reading for this date.',
      ]).toContain(res5th.body.error);
    });

    test('Rule 5: Date cannot be in the future -> "Date cannot be in the future."', async () => {
      // Calculate a future date
      const future = new Date();
      future.setDate(future.getDate() + 5);
      const futureStr = future.toISOString().slice(0, 10);

      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          date: futureStr,
          slot: 'Morning (fasting)',
          value: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Date cannot be in the future.');
    });
  });

  describe('CRUD Operations & Data Isolation', () => {
    let readingId;

    test('User can view only their own readings', async () => {
      const res1 = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res1.status).toBe(200);
      expect(res1.body.data.length).toBeGreaterThan(0);
      const afterLunchReading = res1.body.data.find(r => r.slot === 'After lunch');
      expect(afterLunchReading).toBeDefined();
      readingId = afterLunchReading.id;

      // User 2 has not recorded any readings yet
      const res2 = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.length).toBe(0);
    });

    test('Pagination on GET /readings (?page=1&limit=2)', async () => {
      const res = await request(app)
        .get('/api/readings?page=1&limit=2')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.data.length).toBe(2);
    });

    test('User can edit their existing reading', async () => {
      const res = await request(app)
        .put(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          date: today,
          slot: 'After lunch',
          value: 145,
          notes: 'Updated note after 30 min walk',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.reading.value).toBe(145);
      expect(res.body.reading.notes).toBe('Updated note after 30 min walk');
    });

    test('User cannot edit another user reading (Unauthorized)', async () => {
      const res = await request(app)
        .put(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          date: today,
          slot: 'After lunch',
          value: 180,
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found or unauthorized/i);
    });

    test('User can delete their own reading', async () => {
      const res = await request(app)
        .delete(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it is gone
      const checkRes = await request(app)
        .get(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(checkRes.status).toBe(404);
    });
  });
});
