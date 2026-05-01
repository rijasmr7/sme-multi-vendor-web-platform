const { userPool, productPool, aiPool } = require('../config/db');

/**
 * SERVICE LAYER: Aggregates data from multiple sources.
 */

const getPlatformStats = async () => {
    const userQuery = 'SELECT COUNT(*) FROM users;';
    const productQuery = 'SELECT COUNT(*) FROM products;';
    const shopQuery = 'SELECT COUNT(*) FROM shops;';

    // Execute all 3 queries concurrently
    const [userRes, productRes, shopRes] = await Promise.all([
        userPool.query(userQuery),
        productPool.query(productQuery),
        aiPool.query(shopQuery)
    ]);

    return {
        totalVendors: Number(userRes.rows[0].count),
        totalProducts: Number(productRes.rows[0].count),
        totalShops: Number(shopRes.rows[0].count)
    };
};

module.exports = {
    getPlatformStats
};
