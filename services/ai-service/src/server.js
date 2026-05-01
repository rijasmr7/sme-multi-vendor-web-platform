require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const aiRoutes = require('./routes/aiRoutes');
const { sendError } = require('./utils/response');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// --- DATABASE INITIALIZATION ---
const createTableQuery = `
CREATE TABLE IF NOT EXISTS shops (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL,
    shop_name TEXT NOT NULL,
    config JSONB,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
`;

pool.query(createTableQuery)
    .then(() => console.log('✓ Shops table ready'))
    .catch(err => console.error('Database connection error:', err));

// --- ROUTES ---
// Gateway forwards /generate-shop and /shops directly.
// We'll map them to the root of the aiRoutes.
app.use('/', aiRoutes);

// --- GLOBAL ERROR HANDLING ---
app.use((err, req, res, next) => {
    console.error('AI SERVICE FAILURE:', err);
    sendError(res, 'Interior AI engine failure', 500);
});

app.listen(PORT, () => {
    console.log(`🚀 AI Service live at http://localhost:${PORT}`);
});
