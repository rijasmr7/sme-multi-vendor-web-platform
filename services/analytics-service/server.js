const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 5003;

app.use(cors());
app.use(express.json());

// --- API RESPONSE HELPERS ---
const sendSuccess = (res, data, status = 200) => {
    res.status(status).json({ success: true, data });
};

const sendError = (res, message, status = 500) => {
    res.status(status).json({ success: false, message });
};


// -------------------------------------------------------------
// ANALYTICS MULTI-DATABASE CONNECTIONS
// In data engineering, it's common for an analytics engine
// to query the independent databases of other microservices natively!
// -------------------------------------------------------------

// 1. Connection to User Service Database
const userPool = new Pool({
    user: process.env.DB_USER || 'admin',
    host: process.env.DB_HOST || 'localhost',
    database: 'user_db',
    password: process.env.DB_PASSWORD || 'secretpassword',
    port: process.env.DB_PORT || 5432,
});

// 2. Connection to Product Service Database
const productPool = new Pool({
    user: process.env.DB_USER || 'admin',
    host: process.env.DB_HOST || 'localhost',
    database: 'product_db',
    password: process.env.DB_PASSWORD || 'secretpassword',
    port: process.env.DB_PORT || 5432,
});

// 3. Connection to AI Service Database
const aiPool = new Pool({
    user: process.env.DB_USER || 'admin',
    host: process.env.DB_HOST || 'localhost',
    database: 'ai_db',
    password: process.env.DB_PASSWORD || 'secretpassword',
    port: process.env.DB_PORT || 5432,
});

// Test Connections
userPool.on('connect', () => console.log('Analytics connected to user_db!'));
productPool.on('connect', () => console.log('Analytics connected to product_db!'));
aiPool.on('connect', () => console.log('Analytics connected to ai_db!'));

// -------------------------------------------------------------
// GET /stats API
// -------------------------------------------------------------
app.get('/stats', async (req, res) => {
    console.log(`\n[GET] /stats - Generating Platform Analytics`);

    try {
        const userQuery = 'SELECT COUNT(*) FROM users;';
        const productQuery = 'SELECT COUNT(*) FROM products;';
        const shopQuery = 'SELECT COUNT(*) FROM shops;';

        const [userResult, productResult, shopResult] = await Promise.all([
            userPool.query(userQuery),
            productPool.query(productQuery),
            aiPool.query(shopQuery)
        ]);

        const stats = {
            totalVendors: Number(userResult.rows[0].count),
            totalProducts: Number(productResult.rows[0].count),
            totalShops: Number(shopResult.rows[0].count)
        };

        console.log(`Analytics Success:`, stats);
        sendSuccess(res, stats);

    } catch (error) {
        console.error(`[GET] /stats - Analytics Engine Failure:`, error);
        sendError(res, 'Internal Analytics Error: Database connection failure');
    }
});

// --- GLOBAL ERROR MIDDLEWARE ---
app.use((err, req, res, next) => {
    console.error('ANALYTICS FAILURE:', err);
    sendError(res, 'Unexpected analytics engine failure');
});


// -------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`📊 Analytics Service running on http://localhost:${PORT}`);
});
