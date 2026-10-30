const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { mongoUri, adminEmail, adminPassword } = require('./env');
const User = require('../models/User');

mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', true);

let connectionPromise;
let adminSeedPromise;
let adminSeeded = false;

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return;
  if (mongoose.connection.readyState === 2 && connectionPromise) return connectionPromise;

  connectionPromise = mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
  }).then(() => {
    console.log('MongoDB connected.');
  }).catch((error) => {
    connectionPromise = null;
    throw error;
  });

  return connectionPromise;
}

async function seedAdmin() {
  if (!adminEmail || !adminPassword || adminSeeded) return;
  if (adminSeedPromise) return adminSeedPromise;

  adminSeedPromise = (async () => {
    const email = adminEmail.trim().toLowerCase();
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      adminSeeded = true;
      return;
    }

    const password = await bcrypt.hash(adminPassword, 10);
    await User.create({
      name: 'Store Admin',
      email,
      password,
      role: 'Admin',
      status: 'Active',
    });

    adminSeeded = true;
    console.log(`Initial administrator created for ${email}.`);
  })().catch((error) => {
    adminSeedPromise = null;
    throw error;
  });

  return adminSeedPromise;
}

module.exports = { connectDatabase, seedAdmin };
