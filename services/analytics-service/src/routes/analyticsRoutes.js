const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

/**
 * ROUTE LAYER: Maps endpoints for platform analytics.
 */

router.get('/stats', analyticsController.getStats);

module.exports = router;
