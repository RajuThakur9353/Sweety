const express = require('express');
const ReadingsController = require('../controllers/readingsController');
const { authenticate } = require('../middleware/auth');
const { validateReading } = require('../middleware/validate');

const router = express.Router();

// All reading endpoints require user authentication
router.use(authenticate);

router.post('/', validateReading, ReadingsController.create);
router.get('/', ReadingsController.getAll);
router.get('/:id', ReadingsController.getById);
router.put('/:id', validateReading, ReadingsController.update);
router.delete('/:id', ReadingsController.delete);

module.exports = router;
