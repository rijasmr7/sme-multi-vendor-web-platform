const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

/**
 * ROUTE LAYER: Maps endpoints for AI shop management.
 */

router.post('/generate-shop', aiController.generateShop);
router.post('/save-shop', aiController.saveShop);
router.get('/shops/published', aiController.getPublishedShops);

// --- ADMIN ROUTES (Must go above /shops/:vendorId to avoid routing conflicts) ---
router.get('/admin/shops', authenticateToken, authorizeRole('admin'), aiController.getAllShopsAdmin);
router.put('/admin/shops/:id/approve', authenticateToken, authorizeRole('admin'), aiController.toggleShopApprovalAdmin);
router.put('/admin/shops/:id', authenticateToken, authorizeRole('admin'), aiController.updateShopAdmin);
router.delete('/admin/shops/:id', authenticateToken, authorizeRole('admin'), aiController.deleteShopAdmin);

router.get('/shops/:vendorId', aiController.getVendorShops);
router.put('/shops/publish/:shopId', aiController.publishShop);
router.put('/shops/:shopId/config', aiController.updateShopConfig);

// Public Routes (No Auth required)
router.get('/public/shops', aiController.getPublicShops);
router.get('/public/shops/:id', aiController.getPublicShopById);

module.exports = router;
