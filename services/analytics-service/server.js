const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 5003;

app.use(cors());
app.use(express.json());

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
        // Use SQL COUNT(*) aggregation function to pull exact row sizes
        const userQuery = 'SELECT COUNT(*) FROM users;';
        const productQuery = 'SELECT COUNT(*) FROM products;';
        const shopQuery = 'SELECT COUNT(*) FROM shops;';

        // Promise.all runs all 3 SQL queries SIMULTANEOUSLY for extreme speed!
        const [userResult, productResult, shopResult] = await Promise.all([
            userPool.query(userQuery),
            productPool.query(productQuery),
            aiPool.query(shopQuery)
        ]);

        // PostgreSQL COUNT() returns data as a String (to prevent integer overflow natively),
        // so we must safely parse it back into a JavaScript Number!
        const totalVendors = Number(userResult.rows[0].count);
        const totalProducts = Number(productResult.rows[0].count);
        const totalShops = Number(shopResult.rows[0].count);

        console.log(`Analytics Success: ${totalVendors} Vendors, ${totalProducts} Products, ${totalShops} Shops`);
        
        // Return exactly the requested JSON layout
        res.status(200).json({
            totalVendors,
            totalProducts,
            totalShops
        });

    } catch (error) {
        console.error(`[GET] /stats - Analytics Engine Failure:`, error);
        res.status(500).json({ error: 'Internal Analytics Error' });
    }
});

// -------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`📊 Analytics Service running on http://localhost:${PORT}`);
});
