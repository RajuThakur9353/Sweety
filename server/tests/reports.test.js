const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Reports API (Daily, Month-to-date, Monthly)', () => {
  let token;
  const targetDate = '2026-10-15'; // From assignment example

  beforeAll(async () => {
    process.env.USE_IN_MEMORY_DB = 'true';
    await db.resetForTests();

    // Register user
    const res = await request(app).post('/api/auth/register').send({
      name: 'Report Test Patient',
      email: 'reports@example.com',
      password: 'password123',
    });
    token = res.body.token;

    // Seed specific readings:
    // 1. Readings on 15 Oct 2026 (Daily): 90, 140, 160 -> avg 130.0, min 90, max 160, count 3
    await request(app).post('/api/readings').set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-10-15', slot: 'Morning (fasting)', value: 90 });
    await request(app).post('/api/readings').set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-10-15', slot: 'After breakfast', value: 140 });
    await request(app).post('/api/readings').set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-10-15', slot: 'After lunch', value: 160 });

    // 2. Additional reading on 10 Oct 2026 (in MTD range 1-15 Oct): 110
    // Total MTD values: 90, 140, 160, 110 -> count 4, min 90, max 160, avg 125.0
    await request(app).post('/api/readings').set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-10-10', slot: 'Morning (fasting)', value: 110 });

    // 3. Reading in previous month: 20 Sep 2026 (Monthly range 1-30 Sep): 150
    await request(app).post('/api/readings').set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-09-20', slot: 'After dinner', value: 150 });
  });

  test('Daily Report calculates highest, lowest, average (rounded to 1 decimal) and lists readings with slot', async () => {
    const res = await request(app)
      .get(`/api/reports?date=${targetDate}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const { daily } = res.body.reports;

    expect(daily.count).toBe(3);
    expect(daily.highest).toBe(160);
    expect(daily.lowest).toBe(90);
    expect(daily.average).toBe(130.0);
    expect(daily.hasData).toBe(true);

    // Lists each reading with its slot
    expect(daily.readings).toHaveLength(3);
    expect(daily.readings[0].slot).toBe('Morning (fasting)');
    expect(daily.readings[0].value).toBe(90);
    expect(daily.readings[1].slot).toBe('After breakfast');
    expect(daily.readings[1].value).toBe(140);
    expect(daily.readings[2].slot).toBe('After lunch');
    expect(daily.readings[2].value).toBe(160);
  });

  test('Month-to-date Report aggregates from 1st of month to selected date', async () => {
    const res = await request(app)
      .get(`/api/reports?date=${targetDate}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const { monthToDate } = res.body.reports;

    expect(monthToDate.count).toBe(4); // 3 from Oct 15 + 1 from Oct 10
    expect(monthToDate.highest).toBe(160);
    expect(monthToDate.lowest).toBe(90);
    expect(monthToDate.average).toBe(125.0);
    expect(monthToDate.hasData).toBe(true);
    expect(monthToDate.startDate).toBe('2026-10-01');
    expect(monthToDate.endDate).toBe('2026-10-15');
  });

  test('Monthly Report aggregates whole previous month (1 Sep – 30 Sep 2026)', async () => {
    const res = await request(app)
      .get(`/api/reports?date=${targetDate}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const { monthly } = res.body.reports;

    expect(monthly.count).toBe(1);
    expect(monthly.highest).toBe(150);
    expect(monthly.lowest).toBe(150);
    expect(monthly.average).toBe(150.0);
    expect(monthly.hasData).toBe(true);
    expect(monthly.startDate).toBe('2026-09-01');
    expect(monthly.endDate).toBe('2026-09-30');
  });

  test('Shows friendly empty state when no readings exist for date range', async () => {
    // Pick an empty date in August 2026
    const res = await request(app)
      .get('/api/reports?date=2026-08-15')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const { daily, monthToDate, monthly } = res.body.reports;

    expect(daily.count).toBe(0);
    expect(daily.highest).toBeNull();
    expect(daily.lowest).toBeNull();
    expect(daily.average).toBeNull();
    expect(daily.hasData).toBe(false);
    expect(daily.readings).toHaveLength(0);

    expect(monthToDate.count).toBe(0);
    expect(monthToDate.hasData).toBe(false);

    expect(monthly.count).toBe(0);
    expect(monthly.hasData).toBe(false);
  });
});
