const aiService = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/response');
const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5004';

/**
 * CONTROLLER LAYER: Request handling for AI shop generation.
 */

// Generate full shop config via AI or Fallback
const generateShop = async (req, res) => {
    const { businessType, vendorId, shopName, products, theme, primaryColor } = req.body;
    
    console.log(`[AI Controller] Received request for vendor: ${vendorId}, type: ${businessType}`);

    // 1. Validation
    if (!businessType || !vendorId) {
        return sendError(res, 'businessType and vendorId are required', 400);
    }

    try {
        // 2. Cross-Service Validation (Verify Vendor exists)
        try {
            await axios.get(`${USER_SERVICE_URL}/users/${vendorId}`);
        } catch (vErr) {
            console.warn(`[AI Controller] Vendor validation failed for ID: ${vendorId}. Error: ${vErr.message}`);
            return sendError(res, 'Validation error: User service unreachable or vendor invalid', 400);
        }

        // 3. AI Service Pipeline
        const generatedShop = await aiService.generateShopData(businessType, shopName, products, theme, primaryColor);
        
        console.log(`[AI Controller] Successfully generated brand: "${generatedShop.shopName}"`);
        
        // 4. Persistence (Optional: You can add database saving here if needed)
        
        // Final response matches the flat structure requested by the user
        sendSuccess(res, generatedShop, 201);

    } catch (error) {
        console.error('--- AI Controller Failure ---');
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        console.error('-----------------------------');
        
        sendError(res, error.message || 'Internal error during AI generation', 500);
    }
};

const saveShop = async (req, res) => {
    const { vendorId, shopName, config, isPublished, location } = req.body;

    if (!vendorId || !shopName || !config) {
        return sendError(res, 'vendorId, shopName, and config are required', 400);
    }

    try {
        const savedShop = await aiService.saveShop(vendorId, shopName, config, isPublished, location);
        sendSuccess(res, savedShop, 201);
    } catch (error) {
        console.error('[AI Controller] Error saving shop:', error);
        sendError(res, 'Failed to save shop configuration', 500);
    }
};

const getVendorShops = async (req, res) => {
    const { vendorId } = req.params;
    try {
        const shops = await aiService.findShopsByVendor(vendorId);
        sendSuccess(res, shops);
    } catch (error) {
        sendError(res, 'Failed to fetch shops');
    }
};

const publishShop = async (req, res) => {
    const { shopId } = req.params;
    try {
        const publishedShop = await aiService.publishShop(shopId);
        if (!publishedShop) {
            return sendError(res, 'Shop not found', 404);
        }
        sendSuccess(res, publishedShop);
    } catch (error) {
        sendError(res, 'Failed to publish shop');
    }
};

const getPublishedShops = async (req, res) => {
    try {
        const shops = await aiService.getPublishedShops();
        sendSuccess(res, shops);
    } catch (error) {
        sendError(res, 'Failed to fetch published shops');
    }
};

const getPublicShops = async (req, res) => {
    try {
        const shops = await aiService.getPublicShops();
        sendSuccess(res, shops);
    } catch (error) {
        sendError(res, 'Failed to fetch public shops');
    }
};

const getPublicShopById = async (req, res) => {
    const { id } = req.params;
    try {
        const shop = await aiService.getPublicShopById(id);
        if (!shop) {
            return sendError(res, 'Public shop not found or not published', 404);
        }
        sendSuccess(res, shop);
    } catch (error) {
        sendError(res, 'Failed to fetch shop details');
    }
};

const getAllShopsAdmin = async (req, res) => {
    try {
        const shops = await aiService.findAllShopsAdmin();
        sendSuccess(res, shops);
    } catch (error) {
        sendError(res, 'Failed to fetch all shops');
    }
};

const toggleShopApprovalAdmin = async (req, res) => {
    const { id } = req.params;
    const { isApproved } = req.body;
    if (isApproved === undefined) {
        return sendError(res, 'isApproved field is required', 400);
    }
    try {
        const shop = await aiService.toggleShopApproval(id, isApproved);
        if (!shop) return sendError(res, 'Shop not found', 404);
        sendSuccess(res, shop);
    } catch (error) {
        sendError(res, 'Failed to update shop approval status');
    }
};

const updateShopAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        const shop = await aiService.updateShopAdmin(id, req.body);
        if (!shop) return sendError(res, 'Shop not found', 404);
        sendSuccess(res, shop);
    } catch (error) {
        sendError(res, 'Failed to update shop details');
    }
};

const updateShopConfig = async (req, res) => {
    const { shopId } = req.params;
    const { config } = req.body;
    if (!config) {
        return sendError(res, 'config field is required', 400);
    }
    try {
        const shop = await aiService.updateShopConfig(shopId, config);
        if (!shop) return sendError(res, 'Shop not found', 404);
        sendSuccess(res, shop);
    } catch (error) {
        console.error('[AI Controller] Error updating shop config:', error);
        sendError(res, 'Failed to update shop configuration');
    }
};

const deleteShopAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        const shop = await aiService.deleteShopAdmin(id);
        if (!shop) return sendError(res, 'Shop not found', 404);
        sendSuccess(res, { message: 'Shop deleted successfully', shop });
    } catch (error) {
        sendError(res, 'Failed to delete shop');
    }
};

module.exports = {
    generateShop,
    saveShop,
    getVendorShops,
    publishShop,
    getPublishedShops,
    getPublicShops,
    getPublicShopById,
    getAllShopsAdmin,
    toggleShopApprovalAdmin,
    updateShopAdmin,
    updateShopConfig,
    deleteShopAdmin
};
