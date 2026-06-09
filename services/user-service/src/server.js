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

            // Seed Admin User
            const adminCheck = await pool.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1;");
            if (adminCheck.rows.length === 0) {
                const bcrypt = require('bcrypt');
                const adminPasswordHash = await bcrypt.hash('adminpassword', 10);
                await pool.query(`
                    INSERT INTO users (name, email, phone, shop_name, password, role, city)
                    VALUES ($1, $2, $3, $4, $5, $6, $7);
                `, ['System Admin', 'admin@sme.com', '0000000000', 'Admin Workspace', adminPasswordHash, 'admin', 'Colombo']);
                console.log('✓ Seeded default admin user: admin@sme.com / adminpassword');
            }
        } catch (err) {
            console.error('Migration/Seeding error:', err);
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
