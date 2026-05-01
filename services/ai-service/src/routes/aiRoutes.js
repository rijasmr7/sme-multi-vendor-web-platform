const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

/**
 * ROUTE LAYER: Maps endpoints for AI shop management.
 */

router.post('/generate-shop', aiController.generateShop);
router.post('/save-shop', aiController.saveShop);
router.get('/shops/published', aiController.getPublishedShops);
router.get('/shops/:vendorId', aiController.getVendorShops);
router.put('/shops/publish/:shopId', aiController.publishShop);

// Public Routes (No Auth required)
router.get('/public/shops', aiController.getPublicShops);
router.get('/public/shops/:id', aiController.getPublicShopById);

module.exports = router;
