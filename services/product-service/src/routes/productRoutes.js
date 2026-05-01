const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * ROUTE LAYER: Maps endpoints for products.
 */

router.post('/', authMiddleware, productController.createProduct);
router.get('/', productController.getAllProducts);
router.get('/vendor/:vendorId', authMiddleware, productController.getVendorProducts);
router.put('/:id', authMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);

module.exports = router;
