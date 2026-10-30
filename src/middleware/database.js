const mongoose = require('mongoose');
const { connectDatabase, seedAdmin } = require('../config/database');

async function dbGuard(req, res, next) {
  try {
    await connectDatabase();
    await seedAdmin();

    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB connection is not ready.');
    }

    return next();
  } catch (error) {
    console.error('Database middleware error:', error.message);
    return res.status(503).json({
      message: 'Database is temporarily unavailable. Please retry shortly.',
      data: [],
    });
  }
}

module.exports = dbGuard;
