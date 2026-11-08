const db = require('../config/db');

function normalizeReading(row) {
  if (!row) return null;
  let dateStr = row.reading_date;
  if (dateStr instanceof Date) {
    const y = dateStr.getFullYear();
    const m = String(dateStr.getMonth() + 1).padStart(2, '0');
    const d = String(dateStr.getDate()).padStart(2, '0');
    dateStr = `${y}-${m}-${d}`;
  } else if (typeof dateStr === 'string' && dateStr.length > 10) {
    dateStr = dateStr.slice(0, 10);
  }
  return {
    ...row,
    reading_date: dateStr,
  };
}

class ReadingModel {
  static async create({ userId, readingDate, slot, value, notes = null }) {
    const query = `
      INSERT INTO readings (user_id, reading_date, slot, value, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, reading_date, slot, value, notes, created_at, updated_at;
    `;
    const result = await db.query(query, [userId, readingDate, slot, value, notes]);
    return normalizeReading(result.rows[0]);
  }

  static async findByUserAndId(id, userId) {
    const query = `
      SELECT id, user_id, reading_date, slot, value, notes, created_at, updated_at
      FROM readings
      WHERE id = $1 AND user_id = $2;
    `;
    const result = await db.query(query, [id, userId]);
    return normalizeReading(result.rows[0]);
  }

  static async findByUserDateAndSlot(userId, readingDate, slot, excludeId = null) {
    let query = `
      SELECT id, user_id, reading_date, slot, value, notes
      FROM readings
      WHERE user_id = $1 AND reading_date = $2 AND slot = $3
    `;
    const params = [userId, readingDate, slot];

    if (excludeId) {
      query += ` AND id != $4`;
      params.push(excludeId);
    }

    const result = await db.query(query, params);
    return normalizeReading(result.rows[0]);
  }

  static async countByUserAndDate(userId, readingDate, excludeId = null) {
    let query = `
      SELECT COUNT(*)::integer AS total
      FROM readings
      WHERE user_id = $1 AND reading_date = $2
    `;
    const params = [userId, readingDate];

    if (excludeId) {
      query += ` AND id != $3`;
      params.push(excludeId);
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0]?.total || 0, 10);
  }

  static async findAllByUser({ userId, startDate, endDate, page, limit }) {
    const conditions = ['user_id = $1'];
    const params = [userId];

    if (startDate) {
      params.push(startDate);
      conditions.push(`reading_date >= $${params.length}`);
    }

    if (endDate) {
      params.push(endDate);
      conditions.push(`reading_date <= $${params.length}`);
    }

    const whereClause = conditions.join(' AND ');

    const orderClause = `
      ORDER BY reading_date DESC,
      CASE slot
        WHEN 'Morning (fasting)' THEN 1
        WHEN 'After breakfast' THEN 2
        WHEN 'After lunch' THEN 3
        WHEN 'After dinner' THEN 4
        ELSE 5
      END ASC,
      id DESC
    `;

    // Pagination (Bonus feature)
    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
      const offset = (pageNum - 1) * limitNum;

      const countQuery = `SELECT COUNT(*)::integer AS total FROM readings WHERE ${whereClause};`;
      const countResult = await db.query(countQuery, params);
      const total = parseInt(countResult.rows[0]?.total || 0, 10);

      const dataQuery = `
        SELECT id, user_id, reading_date, slot, value, notes, created_at, updated_at
        FROM readings
        WHERE ${whereClause}
        ${orderClause}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2};
      `;
      const dataResult = await db.query(dataQuery, [...params, limitNum, offset]);

      return {
        data: dataResult.rows.map(normalizeReading),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      };
    }

    const query = `
      SELECT id, user_id, reading_date, slot, value, notes, created_at, updated_at
      FROM readings
      WHERE ${whereClause}
      ${orderClause};
    `;
    const result = await db.query(query, params);
    return { data: result.rows.map(normalizeReading) };
  }

  static async update(id, userId, { readingDate, slot, value, notes }) {
    const query = `
      UPDATE readings
      SET reading_date = $1, slot = $2, value = $3, notes = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND user_id = $6
      RETURNING id, user_id, reading_date, slot, value, notes, created_at, updated_at;
    `;
    const result = await db.query(query, [readingDate, slot, value, notes, id, userId]);
    return normalizeReading(result.rows[0]);
  }

  static async delete(id, userId) {
    const query = `
      DELETE FROM readings
      WHERE id = $1 AND user_id = $2
      RETURNING id;
    `;
    const result = await db.query(query, [id, userId]);
    return result.rowCount > 0;
  }

  static async getReportStats({ userId, startDate, endDate }) {
    const query = `
      SELECT
        COUNT(*)::integer AS count,
        MAX(value)::integer AS highest,
        MIN(value)::integer AS lowest,
        ROUND(AVG(value)::numeric, 1)::float AS average
      FROM readings
      WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3;
    `;
    const result = await db.query(query, [userId, startDate, endDate]);
    const row = result.rows[0] || { count: 0, highest: null, lowest: null, average: null };

    return {
      count: parseInt(row.count || 0, 10),
      highest: row.highest !== null ? parseInt(row.highest, 10) : null,
      lowest: row.lowest !== null ? parseInt(row.lowest, 10) : null,
      average: row.average !== null ? parseFloat(row.average) : null,
    };
  }

  static async getReadingsInRange({ userId, startDate, endDate }) {
    const query = `
      SELECT id, user_id, reading_date, slot, value, notes, created_at
      FROM readings
      WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
      ORDER BY reading_date ASC,
      CASE slot
        WHEN 'Morning (fasting)' THEN 1
        WHEN 'After breakfast' THEN 2
        WHEN 'After lunch' THEN 3
        WHEN 'After dinner' THEN 4
        ELSE 5
      END ASC;
    `;
    const result = await db.query(query, [userId, startDate, endDate]);
    return result.rows.map(normalizeReading);
  }
}

module.exports = ReadingModel;
