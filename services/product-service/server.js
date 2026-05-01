const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const axios = require('axios');

const app = express();

// We hit the user service inside Docker
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user:5004';
const PORT = 5001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER || 'admin',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'product_db',
    password: process.env.DB_PASSWORD || 'secretpassword',
    port: process.env.DB_PORT || 5432,
});

pool.on('connect', () => {
    console.log('Connected to PostgreSQL Database (product_db)');
});

// --- API RESPONSE HELPERS ---
const sendSuccess = (res, data, status = 200) => {
    res.status(status).json({ success: true, data });
};

const sendError = (res, message, status = 500) => {
    res.status(status).json({ success: false, message });
};


const createTableQuery = `
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    category TEXT NOT NULL,
    extra_data JSONB
);
`;

pool.query(createTableQuery)
    .then(() => console.log('Products table checked/created successfully!'))
    .catch(err => console.error('Error creating products table:', err));


app.post('/products', async (req, res) => {
    console.log(`[POST] /products - Request Body:`, req.body);
    const { vendorId, name, price, category, extraData } = req.body;

    // 1. Basic Validation
    if (!vendorId || !name || price === undefined || !category) {
        return sendError(res, 'vendorId, name, price, and category are required', 400);
    }

    if (isNaN(price) || Number(price) < 0) {
        return sendError(res, 'Price must be a valid positive number', 400);
    }

    // 2. Cross-Service Validation
    try {
        console.log(`[POST] Validating vendorId: ${vendorId}...`);
        await axios.get(`${USER_SERVICE_URL}/users/${vendorId}`);
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return sendError(res, 'Invalid vendorId: User not found', 400);
        }
        return sendError(res, 'Validation error: Could not reach user-service', 503);
    }

    // 3. Database Operation
    try {
        const query = `
            INSERT INTO products (vendor_id, name, price, category, extra_data)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [vendorId, name, price, category, extraData ? JSON.stringify(extraData) : null]);

        
        console.log(`[POST] /products - Success`);
        sendSuccess(res, rows[0], 201);
    } catch (error) {
        console.error(`[POST] /products - Database Error:`, error);
        sendError(res, 'Failed to create product in database');
    }
});


app.get('/products', async (req, res) => {
    try {
        const { rows } = await pool.query(`SELECT * FROM products ORDER BY id DESC;`);
        sendSuccess(res, rows);
    } catch (error) {
        sendError(res, 'Failed to fetch catalog');
    }
});

app.get('/products/vendor/:vendorId', async (req, res) => {
    const { vendorId } = req.params;
    try {
        const { rows } = await pool.query(`SELECT * FROM products WHERE vendor_id = $1 ORDER BY id DESC;`, [vendorId]);
        sendSuccess(res, rows);
    } catch (error) {
        sendError(res, 'Failed to fetch products for vendor');
    }
});

app.put('/products/:id', async (req, res) => {
    const { id } = req.params;
    const { name, price, category, extraData } = req.body;

    // Validation for partial updates
    if (price !== undefined && (isNaN(price) || Number(price) < 0)) {
        return sendError(res, 'Price must be a valid positive number', 400);
    }

    try {
        const query = `
            UPDATE products 
            SET name = COALESCE($1, name),
                price = COALESCE($2, price),
                category = COALESCE($3, category),
                extra_data = COALESCE($4, extra_data)
            WHERE id = $5
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [name, price, category, extraData ? JSON.stringify(extraData) : null, id]);

        if (rows.length === 0) return sendError(res, 'Product not found', 404);
        sendSuccess(res, rows[0]);
    } catch (error) {
        sendError(res, 'Failed to update product');
    }
});

app.delete('/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query(`DELETE FROM products WHERE id = $1 RETURNING *;`, [id]);
        if (rows.length === 0) return sendError(res, 'Product not found', 404);
        sendSuccess(res, { message: 'Deleted successfully', product: rows[0] });
    } catch (error) {
        sendError(res, 'Failed to delete product');
    }
});

// --- GLOBAL ERROR MIDDLEWARE ---
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    sendError(res, 'Internal backend failure');
});


app.listen(PORT, () => {
    console.log(`Product Service running on http://localhost:${PORT}`);
});
