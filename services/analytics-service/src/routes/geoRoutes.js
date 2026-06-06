const express = require('express');
const router = express.Router();
const geoAnalyticsService = require('../geo/geoAnalyticsService');

// GET /geo/live-activity
router.get('/live-activity', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const activity = await geoAnalyticsService.getRecentActivity(limit);
        res.status(200).json({ success: true, data: activity });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /geo/hotspots
router.get('/hotspots', async (req, res) => {
    try {
        const hotspots = await geoAnalyticsService.getHotspots();
        res.status(200).json({ success: true, data: hotspots });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /geo/vendor-traffic/:id
router.get('/vendor-traffic/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { lat, lon, radius } = req.query;
        if (!lat || !lon) {
            return res.status(400).json({ success: false, message: "lat and lon are required" });
        }
        
        const traffic = await geoAnalyticsService.getVendorTraffic(parseFloat(lat), parseFloat(lon), parseFloat(radius) || 10);
        res.status(200).json({ success: true, data: traffic });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /geo/regional-trends
router.get('/regional-trends', async (req, res) => {
    try {
        // For now, re-use hotspots as a proxy for regional trends
        const trends = await geoAnalyticsService.getHotspots();
        res.status(200).json({ success: true, data: trends });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
