const express = require('express');
const cartController = require('../controllers/cartController');
const dbGuard = require('../middleware/database');

const router = express.Router();

router.get('/', dbGuard, cartController.getCart);
router.post('/', dbGuard, cartController.addCartItem);
router.put('/:id', dbGuard, cartController.updateCartItem);
router.delete('/:id', dbGuard, cartController.removeCartItem);
router.delete('/', dbGuard, cartController.clearCart);

module.exports = router;
