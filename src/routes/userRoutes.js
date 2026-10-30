const express = require('express');
const userController = require('../controllers/userController');
const dbGuard = require('../middleware/database');
const { authRequired, adminRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/', dbGuard, authRequired, adminRequired, userController.listUsers);
router.post('/', dbGuard, authRequired, adminRequired, userController.createUser);
router.delete('/:id', dbGuard, authRequired, adminRequired, userController.deleteUser);

module.exports = router;
