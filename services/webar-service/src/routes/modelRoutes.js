const express = require('express');
const router = express.Router();
const modelController = require('../controllers/modelController');
const uploadMiddleware = require('../middleware/uploadMiddleware');

router.post('/upload', uploadMiddleware.single('file'), modelController.uploadModel);

// Analytics Routes
router.get('/analytics', modelController.getAnalytics);
router.post('/product/:product_id/analytics', modelController.trackAnalytics);

// Product Integration Routes
router.get('/product/:product_id', modelController.getModel);

module.exports = router;
