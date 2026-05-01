const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const { sendError } = require('./utils/response');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// --- DATABASE INITIALIZATION ---
const createTableQuery = `
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    extra_data JSONB
);

-- Migration for existing tables
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;

`;

pool.query(createTableQuery)
    .then(() => console.log('✓ Products table ready'))
    .catch(err => console.error('Database connection error:', err));

// --- ROUTES ---
app.use('/products', productRoutes);

// --- GLOBAL ERROR HANDLING ---
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    sendError(res, 'Internal backend failure', 500);
});

app.listen(PORT, () => {
    console.log(`🚀 Product Service live at http://localhost:${PORT}`);
});
