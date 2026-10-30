const express = require('express');
const orderController = require('../controllers/orderController');
const dbGuard = require('../middleware/database');
const { authRequired, adminRequired, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', dbGuard, authRequired, adminRequired, orderController.listOrders);
router.post('/', dbGuard, optionalAuth, orderController.createOrder);

module.exports = router;
