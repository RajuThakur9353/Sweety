const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    process.env.USE_IN_MEMORY_DB = 'true';
    await db.resetForTests();
  });

  const testUser = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'securePassword123',
  };

  test('POST /api/auth/register - Successfully registers a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.name).toBe(testUser.name);
    expect(res.body).toHaveProperty('token');

    // Verify password is NOT stored as plain text
    const userInDb = await db.query('SELECT password_hash FROM users WHERE email = $1', [testUser.email]);
    expect(userInDb.rows[0].password_hash).not.toBe(testUser.password);
    expect(userInDb.rows[0].password_hash).toMatch(/^\$2[aby]\$/); // bcrypt hash prefix
  });

  test('POST /api/auth/register - Rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/already exists/i);
  });

  test('POST /api/auth/login - Successfully logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testUser.email);
  });

  test('POST /api/auth/login - Rejects invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongPassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Invalid email or password.');
  });

  test('GET /api/auth/me - Returns authenticated user profile', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const token = loginRes.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
  });
});
