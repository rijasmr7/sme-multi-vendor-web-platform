const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

/**
 * ROUTE LAYER: Maps endpoints for products.
 */

// --- ADMIN ROUTES (Must go above other routes to avoid conflicts) ---
router.get('/admin/products', authenticateToken, authorizeRole('admin'), productController.getAllProductsAdmin);
router.post('/admin/products', authenticateToken, authorizeRole('admin'), productController.createProductAdmin);
router.put('/admin/products/:id', authenticateToken, authorizeRole('admin'), productController.updateProductAdmin);
router.delete('/admin/products/:id', authenticateToken, authorizeRole('admin'), productController.deleteProductAdmin);

router.post('/', authenticateToken, productController.createProduct);
router.get('/', productController.getAllProducts);
router.get('/vendor/:vendorId', authenticateToken, productController.getVendorProducts);
router.get('/public/vendor/:vendorId', productController.getPublicVendorProducts);
router.put('/:id', authenticateToken, productController.updateProduct);
router.delete('/:id', authenticateToken, productController.deleteProduct);

module.exports = router;
