const express = require('express');
const authController = require('../controllers/authController');
const dbGuard = require('../middleware/database');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.post('/register', dbGuard, authController.register);
router.post('/login', dbGuard, authController.login);
router.get('/me', dbGuard, authRequired, authController.me);

module.exports = router;
