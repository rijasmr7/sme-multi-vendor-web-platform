require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const orderRoutes = require('./routes/orderRoutes');
const { sendError } = require('./utils/response');

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

// --- DATABASE INITIALIZATION ---
const createTableQuery = `
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    shop_id INTEGER NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

pool.query(createTableQuery)
    .then(() => console.log('✓ Orders table ready'))
    .catch(err => console.error('Database connection error:', err));

// --- ROUTES ---
app.use('/orders', orderRoutes);

// --- GLOBAL ERROR HANDLING ---
app.use((err, req, res, next) => {
    console.error('ORDER SERVICE FAILURE:', err);
    sendError(res, 'Interior order engine failure', 500);
});

app.listen(PORT, () => {
    console.log(`🚀 Order Service live at http://localhost:${PORT}`);
});
