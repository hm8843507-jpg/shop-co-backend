const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { asArray, normalizeRole, publicUser } = require('../utils/formatters');

async function listUsers(req, res) {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    return res.status(200).json(asArray(users).map(publicUser));
  } catch (error) {
    console.error('Users GET error:', error);
    return res.status(500).json({ message: 'Error fetching users', error: error.message, data: [] });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, password, role, status, avatar_url } = req.body || {};
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const rawPassword = password && String(password).length >= 6
      ? String(password)
      : `User${Date.now().toString().slice(-4)}!`;
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(rawPassword, 10),
      role: normalizeRole(role),
      status: status || 'Active',
      avatar_url: avatar_url || '',
    });

    return res.status(201).json({
      message: 'User created successfully.',
      user: publicUser(user),
      temporaryPassword: password ? undefined : rawPassword,
    });
  } catch (error) {
    console.error('Users POST error:', error);
    return res.status(500).json({ message: 'Error creating user', error: error.message });
  }
}

async function deleteUser(req, res) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.json({ message: 'User deleted.' });
  } catch (error) {
    console.error('Users DELETE error:', error);
    return res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
}

module.exports = { listUsers, createUser, deleteUser };
