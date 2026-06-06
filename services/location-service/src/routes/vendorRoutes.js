const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');

// Update shop location
router.post('/location', vendorController.updateLocation);

// Find nearby shops
router.get('/nearby', vendorController.getNearbyShops);

// Get exact distance to a specific shop
router.get('/distance/:id', vendorController.getDistanceToShop);

// Location-based recommendations
router.get('/recommendations/location', vendorController.getLocationRecommendations);

module.exports = router;
