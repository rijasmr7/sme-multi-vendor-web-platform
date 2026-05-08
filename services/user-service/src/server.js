const express = require('express');
const pool = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const { sendError } = require('./utils/response');

const app = express();
const PORT = process.env.PORT || 5004;

app.use(express.json());

// --- DATABASE INITIALIZATION ---
const createTableQuery = `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    shop_name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'vendor'
);
`;

pool.query(createTableQuery)
    .then(async () => {
        console.log('✓ Users table ready');
        // Migrations
        try {
            await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS shop_name TEXT DEFAULT 'My Shop'");
            await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'vendor'");
            await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Unknown'");
        } catch (err) {
            // Silently ignore migration issues
        }
    })
    .catch(err => console.error('Database connection error:', err));

// --- ROUTES ---
app.use('/users', userRoutes);
// Note: In gateway we mapped /register and /login directly.
// To keep those working, we'll re-map them to the base of this service.
app.use('/', userRoutes);

// --- GLOBAL ERROR HANDLING ---
app.use((err, req, res, next) => {
    console.error('SERVER CRASH:', err);
    sendError(res, 'An unexpected server error occurred', 500);
});

app.listen(PORT, () => {
    console.log(`🚀 User Service live at http://localhost:${PORT}`);
});
