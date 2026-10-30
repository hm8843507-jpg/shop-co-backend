const express = require('express');
const productController = require('../controllers/productController');
const dbGuard = require('../middleware/database');
const { authRequired, adminRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/', dbGuard, productController.listProducts);
router.post('/', dbGuard, authRequired, adminRequired, productController.createProduct);
router.put('/:id', dbGuard, authRequired, adminRequired, productController.updateProduct);
router.delete('/:id', dbGuard, authRequired, adminRequired, productController.deleteProduct);

module.exports = router;
