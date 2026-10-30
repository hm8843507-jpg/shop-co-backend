const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const { publicUser, normalizeRole } = require('../utils/formatters');

function createAuthPayload(user) {
  const token = jwt.sign(
    { id: String(user._id), role: user.role, email: user.email },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );
  return { token, user: publicUser(user), role: user.role };
}

async function register(req, res) {
  try {
    const { name, email, password, role, status, avatar_url } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    let assignedRole = 'User';
    const authorization = req.headers.authorization || '';
    if (authorization.startsWith('Bearer ')) {
      try {
        const payload = jwt.verify(authorization.slice(7).trim(), jwtSecret);
        if (payload.role === 'Admin') assignedRole = normalizeRole(role);
      } catch {
        assignedRole = 'User';
      }
    }

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(String(password), 10),
      role: assignedRole,
      status: status || 'Active',
      avatar_url: avatar_url || '',
    });

    return res.status(201).json({
      message: 'User registered successfully!',
      ...createAuthPayload(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Unable to register user.', error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(400).json({ message: 'User not found!' });

    if (!(await bcrypt.compare(String(password), user.password))) {
      return res.status(400).json({ message: 'Invalid credentials!' });
    }

    return res.status(200).json({
      message: 'Login successful.',
      ...createAuthPayload(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Unable to login.', error: error.message });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.json({ user: publicUser(user), role: user.role });
  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({ message: 'Unable to load profile.', error: error.message });
  }
}

module.exports = { register, login, me };
