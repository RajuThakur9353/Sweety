const db = require('../config/db');

class UserModel {
  static async create({ name, email, passwordHash, role = 'patient' }) {
    const query = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at, updated_at;
    `;
    const result = await db.query(query, [name, email.toLowerCase().trim(), passwordHash, role]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = `
      SELECT id, name, email, password_hash, role, created_at, updated_at
      FROM users
      WHERE LOWER(email) = LOWER($1);
    `;
    const result = await db.query(query, [email.trim()]);
    return result.rows[0] || null;
  }

  static async findById(id) {
    const query = `
      SELECT id, name, email, role, created_at, updated_at
      FROM users
      WHERE id = $1;
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findAllPatients() {
    const query = `
      SELECT id, name, email, role, created_at
      FROM users
      WHERE role = 'patient'
      ORDER BY name ASC;
    `;
    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = UserModel;
