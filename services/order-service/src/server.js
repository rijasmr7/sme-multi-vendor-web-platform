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
const initDatabase = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                vendor_id INTEGER NOT NULL,
                product_id TEXT NOT NULL,
                quantity INTEGER NOT NULL CHECK (quantity > 0) DEFAULT 1,
                unit_price DECIMAL(10, 2) NOT NULL,
                total_price DECIMAL(10, 2) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rejected')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✓ Orders table ready');

        // Add shop_id, updated_at, and delivery_type to orders if they don't exist
        await pool.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS shop_id INTEGER,
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(50);
        `);
        console.log('✓ Orders table schema updated');

        // Update the status check constraint to include new statuses
        await pool.query(`
            ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
            ALTER TABLE orders ADD CONSTRAINT orders_status_check 
            CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'ready_for_pickup', 'delivered', 'rejected'));
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS cart (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                vendor_id INTEGER NOT NULL,
                shop_id INTEGER NOT NULL,
                product_id TEXT NOT NULL,
                quantity INTEGER NOT NULL CHECK (quantity > 0) DEFAULT 1,
                unit_price DECIMAL(10, 2) NOT NULL,
                total_price DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✓ Cart table ready');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS delivery_address (
                id SERIAL PRIMARY KEY,
                order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                customer_id INTEGER NOT NULL,
                customer_name VARCHAR(255) NOT NULL,
                customer_phone VARCHAR(50) NOT NULL,
                address_line TEXT,
                city VARCHAR(100),
                zip_code VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✓ Delivery Address table ready');
    } catch (err) {
        console.error('Database connection error:', err);
    }
};

initDatabase();

// --- ROUTES ---
const cartRoutes = require('./routes/cartRoutes');
app.use('/orders', orderRoutes);
app.use('/cart', cartRoutes);

// --- GLOBAL ERROR HANDLING ---
app.use((err, req, res, next) => {
    console.error('ORDER SERVICE FAILURE:', err);
    sendError(res, 'Interior order engine failure', 500);
});

app.listen(PORT, () => {
    console.log(`🚀 Order Service live at http://localhost:${PORT}`);
});
