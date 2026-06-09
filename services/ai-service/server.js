require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Pool } = require('pg');
const axios = require('axios'); 

const app = express();
const PORT = 5002;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5004';

app.use(cors());
app.use(express.json());

// ------------------------------------------------------------------
// DATABASE CONNECTION SETUP
// ------------------------------------------------------------------
const pool = new Pool({
    user: process.env.DB_USER || 'admin',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'ai_db',
    password: process.env.DB_PASSWORD || 'secretpassword',
    port: process.env.DB_PORT || 5432,
});

pool.on('connect', () => {
    console.log('Connected to PostgreSQL Database (ai_db)');
});

// --- API RESPONSE HELPERS ---
const sendSuccess = (res, data, status = 200) => {
    res.status(status).json({ success: true, data });
};

const sendError = (res, message, status = 500) => {
    res.status(status).json({ success: false, message });
};


const createTableQuery = `
CREATE TABLE IF NOT EXISTS shops (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL,
    shop_name TEXT NOT NULL,
    config JSONB,
    location JSONB,
    is_published BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS location JSONB;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;
`;

pool.query(createTableQuery)
    .then(() => console.log('Shops table checked/created successfully!'))
    .catch(err => console.error('Error creating shops table:', err));


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ------------------------------------------------------------------
// POST /generate-shop API
// ------------------------------------------------------------------
app.post('/generate-shop', async (req, res) => {
    console.log(`[POST] /generate-shop - Request received`);
    const { businessType, vendorId, products, theme } = req.body;

    // 1. Validation
    if (!businessType || !vendorId) {
        return sendError(res, 'businessType and vendorId are required', 400);
    }

    // 2. Cross-Service Validation
    try {
        console.log(`[POST] Validating vendorId: ${vendorId}...`);
        await axios.get(`${USER_SERVICE_URL}/users/${vendorId}`);
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return sendError(res, 'Invalid vendorId: User not found', 400);
        }
        return sendError(res, 'Validation error: User service unreachable', 503);
    }


    // 2. Generating Shop Config with Gemini AI
    try {
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_actual_api_key_here') {
            return res.status(500).json({ success: false, message: "A Gemini API Key is missing." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // Add user preferences if provided
        const extraContext = [];
        if (products && products.length > 0) extraContext.push(`Include these core products: ${products.join(', ')}.`);
        if (theme) extraContext.push(`The store must follow a '${theme}' visual theme/vibe.`);

        const prompt = `
            You are a business consultant configuring a digital shop.
            Business Type: "${businessType}".
            ${extraContext.join(' ')}

            Generate a highly creative, short shop name and full UI configuration.
            CRITICAL INSTRUCTION: Respond ONLY with a raw JSON object. Do not wrap in markdown.
            
            JSON structure:
            {
              "shopName": "Creative Name",
              "config": {
                  "theme": "color scheme and style rules here",
                  "layout": "header/footer layout properties",
                  "navigation": ["Home", "Shop", "About Us", "Contact"],
                  "products": [
                    { "name": "Premium Product 1", "price": 10.50 }
                  ]
              }
            }
        `;

        const result = await model.generateContent(prompt);
        let aiTextResponse = result.response.text();
        aiTextResponse = aiTextResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        const generatedData = JSON.parse(aiTextResponse);
        const { shopName, config } = generatedData;

        // 3. Save to PostgreSQL Database
        const query = `
            INSERT INTO shops (vendor_id, shop_name, config)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [vendorId, shopName, JSON.stringify(config)]);
        
        console.log(`[POST] /generate-shop - Success: Shop saved!`);
        sendSuccess(res, {
            message: "Shop generated and saved successfully",
            shop: rows[0]
        }, 201);

    } catch (error) {
        console.error("[POST] /generate-shop Error:", error);
        sendError(res, "Failed to generate AI shop: " + (error.message || 'Unknown error'));
    }
});

app.get('/shops/:vendorId', async (req, res) => {
    const { vendorId } = req.params;
    try {
        const query = `SELECT * FROM shops WHERE vendor_id = $1 ORDER BY created_at DESC;`;
        const { rows } = await pool.query(query, [vendorId]);
        sendSuccess(res, rows);
    } catch (error) {
        sendError(res, "Failed to fetch shops");
    }
});

// --- GLOBAL ERROR MIDDLEWARE ---
app.use((err, req, res, next) => {
    console.error('AI SERVICE CRASH:', err);
    sendError(res, 'Interior AI engine failure');
});


// Start the server
app.listen(PORT, () => {
    console.log(`🧠 AI Service is running on http://localhost:${PORT}`);
});
