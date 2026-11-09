const express = require('express');
const ReportsController = require('../controllers/reportsController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', ReportsController.getReports);

module.exports = router;
