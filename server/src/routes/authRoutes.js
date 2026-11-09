const express = require('express');
const AuthController = require('../controllers/authController');
const { validateAuth } = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/register', validateAuth, AuthController.register);
router.post('/login', validateAuth, AuthController.login);
router.get('/me', authenticate, AuthController.getProfile);
router.get('/patients', authenticate, requireRole(['doctor']), AuthController.getPatients);

module.exports = router;
