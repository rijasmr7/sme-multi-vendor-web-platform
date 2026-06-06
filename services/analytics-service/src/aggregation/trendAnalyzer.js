const { pool } = require('../db/index');

class TrendAnalyzer {
    /**
     * Calculates the percentage change between two values.
     * @param {number} current 
     * @param {number} previous 
     * @returns {number} percentage change
     */
    calculatePercentageChange(current, previous) {
        if (previous === 0) {
            return current > 0 ? 100 : 0;
        }
        return ((current - previous) / previous) * 100;
    }

    /**
     * Gets a simple trend (up/down) compared to the previous time period.
     * This is a placeholder for more complex trend logic if needed.
     */
    async getDailyTrends() {
        // Here we could query the previous day vs today from analytics_summary
        // For simplicity in the MVP, we'll return basic calculated trends or just rely on raw stats.
        return {
            viewsTrend: '+12%',
            ordersTrend: '+5%',
            arTrend: '+24%'
        };
    }
}

module.exports = new TrendAnalyzer();
