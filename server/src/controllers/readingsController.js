const ReadingModel = require('../models/readingModel');

class ReadingsController {
  static async create(req, res, next) {
    try {
      const { readingDate, slot, value, notes } = req.validatedData;
      const userId = req.user.id;

      const reading = await ReadingModel.create({
        userId,
        readingDate,
        slot,
        value,
        notes,
      });

      res.status(201).json({
        success: true,
        message: 'Reading recorded successfully.',
        reading,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req, res, next) {
    try {
      const { startDate, endDate, page, limit, patientId } = req.query;

      // Doctor role bonus: doctor can view patient's readings
      let targetUserId = req.user.id;
      if (patientId && req.user.role === 'doctor') {
        targetUserId = parseInt(patientId, 10);
      }

      const result = await ReadingModel.findAllByUser({
        userId: targetUserId,
        startDate,
        endDate,
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const reading = await ReadingModel.findByUserAndId(id, req.user.id);

      if (!reading) {
        return res.status(404).json({
          success: false,
          error: 'Reading not found or unauthorized.',
        });
      }

      res.status(200).json({
        success: true,
        reading,
      });
    } catch (err) {
      next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user.id;

      // Check existence and ownership
      const existing = await ReadingModel.findByUserAndId(id, userId);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Reading not found or unauthorized.',
        });
      }

      const { readingDate, slot, value, notes } = req.validatedData;
      const updated = await ReadingModel.update(id, userId, {
        readingDate,
        slot,
        value,
        notes,
      });

      res.status(200).json({
        success: true,
        message: 'Reading updated successfully.',
        reading: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user.id;

      const deleted = await ReadingModel.delete(id, userId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Reading not found or unauthorized.',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Reading deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ReadingsController;
