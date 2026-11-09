const ReadingModel = require('../models/readingModel');

const VALID_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner',
];

/**
 * Returns today's date formatted as YYYY-MM-DD in the local/server timezone
 */
function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats slot duplicate message matching the assignment spec:
 * e.g., "You already have an After lunch reading for this date."
 */
function formatDuplicateSlotMessage(slot) {
  const article = /^[aeiou]/i.test(slot) ? 'an' : 'a';
  return `You already have ${article} ${slot} reading for this date.`;
}

/**
 * Validates reading input for create (POST) and update (PUT)
 */
async function validateReading(req, res, next) {
  try {
    const { date, reading_date, slot, value, notes } = req.body;
    const readingDate = (date || reading_date || '').trim();
    const excludeId = req.params.id ? parseInt(req.params.id, 10) : null;
    const userId = req.user.id;

    // 1. Date is required
    if (!readingDate) {
      return res.status(400).json({
        success: false,
        field: 'date',
        error: 'Please enter a valid date.',
      });
    }

    // Check date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(readingDate)) {
      return res.status(400).json({
        success: false,
        field: 'date',
        error: 'Please enter a date in YYYY-MM-DD format.',
      });
    }

    // Rule: Date cannot be in the future
    const today = getTodayString();
    if (readingDate > today) {
      return res.status(400).json({
        success: false,
        field: 'date',
        error: 'Date cannot be in the future.',
      });
    }

    // 2. Slot validation
    if (!slot) {
      return res.status(400).json({
        success: false,
        field: 'slot',
        error: 'Please select a time slot.',
      });
    }

    if (!VALID_SLOTS.includes(slot)) {
      return res.status(400).json({
        success: false,
        field: 'slot',
        error: `Slot must be one of: ${VALID_SLOTS.join(', ')}.`,
      });
    }

    // 3. Value is required
    if (value === undefined || value === null || value === '') {
      return res.status(400).json({
        success: false,
        field: 'value',
        error: 'Please enter a glucose value.',
      });
    }

    // Rule: Value must be a whole number between 40 and 600
    const numValue = Number(value);
    if (!Number.isInteger(numValue) || numValue < 40 || numValue > 600) {
      return res.status(400).json({
        success: false,
        field: 'value',
        error: 'Value must be between 40 and 600 mg/dl.',
      });
    }

    // 4. Rule: Only one reading per slot per day
    const existingSlot = await ReadingModel.findByUserDateAndSlot(
      userId,
      readingDate,
      slot,
      excludeId
    );
    if (existingSlot) {
      return res.status(400).json({
        success: false,
        field: 'slot',
        error: formatDuplicateSlotMessage(slot),
      });
    }

    // 5. Rule: Maximum 4 readings per day
    const dayCount = await ReadingModel.countByUserAndDate(
      userId,
      readingDate,
      excludeId
    );
    if (dayCount >= 4) {
      return res.status(400).json({
        success: false,
        field: 'slot',
        error: 'You can add only 4 readings per day.',
      });
    }

    // Attach normalized values to req.validatedData
    req.validatedData = {
      readingDate,
      slot,
      value: numValue,
      notes: notes ? notes.trim() : null,
    };

    next();
  } catch (err) {
    next(err);
  }
}

function validateAuth(req, res, next) {
  const { email, password, name } = req.body;

  if (req.path.includes('register')) {
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        field: 'name',
        error: 'Name is required.',
      });
    }
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({
      success: false,
      field: 'email',
      error: 'Please enter a valid email address.',
    });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      field: 'password',
      error: 'Password must be at least 6 characters.',
    });
  }

  next();
}

module.exports = {
  validateReading,
  validateAuth,
  VALID_SLOTS,
  getTodayString,
  formatDuplicateSlotMessage,
};
