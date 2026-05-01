const analyticsService = require('../services/analyticsService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * CONTROLLER LAYER: Request handling for platform analytics.
 */

const getStats = async (req, res) => {
    try {
        const stats = await analyticsService.getPlatformStats();
        sendSuccess(res, stats);
    } catch (error) {
        console.error('Analytics Error:', error);
        sendError(res, 'Internal Analytics Error: Database connection failure', 500);
    }
};

module.exports = {
    getStats
};
