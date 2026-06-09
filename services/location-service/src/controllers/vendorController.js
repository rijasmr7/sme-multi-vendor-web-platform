const geoService = require('../services/geoService');

const updateLocation = async (req, res) => {
    const { shopId, shopName, lat, lon } = req.body;
    
    if (!shopId || lat === undefined || lon === undefined) {
        return res.status(400).json({ success: false, message: 'shopId, lat, and lon are required' });
    }

    try {
        const result = await geoService.updateShopLocation(shopId, shopName || 'Unknown Shop', parseFloat(lat), parseFloat(lon));
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Failed to update location:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getNearbyShops = async (req, res) => {
    const { lat, lon, radius = 10 } = req.query;

    if (!lat || !lon) {
        return res.status(400).json({ success: false, message: 'lat and lon query parameters are required' });
    }

    try {
        const shops = await geoService.findNearbyShops(parseFloat(lat), parseFloat(lon), parseFloat(radius));
        res.status(200).json({ success: true, count: shops.length, data: shops });
    } catch (error) {
        console.error('Failed to fetch nearby shops:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getDistanceToShop = async (req, res) => {
    const { id } = req.params;
    const { lat, lon } = req.query;

    if (!lat || !lon) {
        return res.status(400).json({ success: false, message: 'lat and lon query parameters are required' });
    }

    try {
        const distanceData = await geoService.getDistanceToShop(id, parseFloat(lat), parseFloat(lon));
        if (!distanceData) {
            return res.status(404).json({ success: false, message: 'Shop location not found' });
        }
        res.status(200).json({ success: true, data: distanceData });
    } catch (error) {
        console.error('Failed to fetch distance:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getLocationRecommendations = async (req, res) => {
    // Wrapper around nearby shops for AI-based or featured logic
    // For now, it returns the closest shops
    await getNearbyShops(req, res);
};

const deleteLocation = async (req, res) => {
    const { shopId } = req.params;
    if (!shopId) {
        return res.status(400).json({ success: false, message: 'shopId is required' });
    }
    try {
        const result = await geoService.deleteShopLocation(shopId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Failed to delete location:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    updateLocation,
    getNearbyShops,
    getDistanceToShop,
    getLocationRecommendations,
    deleteLocation
};
