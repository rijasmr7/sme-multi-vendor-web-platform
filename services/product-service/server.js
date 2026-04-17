const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
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


// 1. POST /products API
app.post('/products', async (req, res) => {
    console.log(`[POST] /products - Request Body:`, req.body);
    const { vendorId, name, price, category, extraData } = req.body;

    if (!vendorId || !name || !price || !category) {
        return res.status(400).json({ error: 'vendorId, name, price, and category are required' });
    }

    try {
        const query = `
            INSERT INTO products (vendor_id, name, price, category, extra_data)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [vendorId, name, price, category, extraData ? JSON.stringify(extraData) : null]);
        
        console.log(`[POST] /products - Success:`, rows[0]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error(`[POST] /products - Error:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 2. GET /products API (All products)
app.get('/products', async (req, res) => {
    console.log(`[GET] /products - Fetching all products`);
    try {
        const query = `SELECT * FROM products ORDER BY id DESC;`;
        const { rows } = await pool.query(query);
        console.log(`[GET] /products - Fetched ${rows.length} products`);
        res.status(200).json(rows);
    } catch (error) {
        console.error(`[GET] /products - Error:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 3. GET /products/vendor/:vendorId API
app.get('/products/vendor/:vendorId', async (req, res) => {
    console.log(`[GET] /products/vendor/${req.params.vendorId} - Fetching vendor products`);
    const { vendorId } = req.params;

    try {
        const query = `SELECT * FROM products WHERE vendor_id = $1 ORDER BY id DESC;`;
        const { rows } = await pool.query(query, [vendorId]);
        console.log(`[GET] /products/vendor/${vendorId} - Fetched ${rows.length} products`);
        res.status(200).json(rows);
    } catch (error) {
        console.error(`[GET] /products/vendor/${vendorId} - Error:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 4. PUT /products/:id API
app.put('/products/:id', async (req, res) => {
    console.log(`[PUT] /products/${req.params.id} - Request Body:`, req.body);
    const { id } = req.params;
    const { name, price, category, extraData } = req.body;

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
        const values = [name, price, category, extraData ? JSON.stringify(extraData) : null, id];
        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            console.log(`[PUT] /products/${id} - Product Not Found`);
            return res.status(404).json({ error: 'Product not found' });
        }

        console.log(`[PUT] /products/${id} - Success:`, rows[0]);
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(`[PUT] /products/${id} - Error:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 5. DELETE /products/:id API
app.delete('/products/:id', async (req, res) => {
    console.log(`[DELETE] /products/${req.params.id} - Deleting product`);
    const { id } = req.params;

    try {
        const query = `DELETE FROM products WHERE id = $1 RETURNING *;`;
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) {
            console.log(`[DELETE] /products/${id} - Product Not Found`);
            return res.status(404).json({ error: 'Product not found' });
        }

        console.log(`[DELETE] /products/${id} - Successfully deleted`);
        res.status(200).json({ message: 'Product deleted successfully', deletedProduct: rows[0] });
    } catch (error) {
        console.error(`[DELETE] /products/${id} - Error:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Product Service running on http://localhost:${PORT}`);
});
