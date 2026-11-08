function errorHandler(err, req, res, next) {
  console.error('Unhandled Server Error:', err);

  // PostgreSQL unique violation
  if (err.code === '23505') {
    if (err.constraint === 'unique_user_date_slot') {
      return res.status(400).json({
        success: false,
        error: 'Only one reading per slot is allowed on this date.',
      });
    }
    if (err.constraint === 'users_email_key' || err.detail?.includes('email')) {
      return res.status(400).json({
        success: false,
        field: 'email',
        error: 'An account with this email already exists.',
      });
    }
  }

  // PostgreSQL check constraint violation
  if (err.code === '23514') {
    if (err.constraint === 'valid_value') {
      return res.status(400).json({
        success: false,
        field: 'value',
        error: 'Value must be between 40 and 600 mg/dl.',
      });
    }
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
}

module.exports = errorHandler;
