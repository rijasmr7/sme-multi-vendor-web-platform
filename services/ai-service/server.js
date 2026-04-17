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

const createTableQuery = `
CREATE TABLE IF NOT EXISTS shops (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL,
    shop_name TEXT NOT NULL,
    config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
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

    if (!businessType || !vendorId) {
        return res.status(400).json({ error: 'businessType and vendorId are required' });
    }

    // 1. Validating Vendor ID with User Service
    try {
        console.log(`[POST] Validating vendorId: ${vendorId}...`);
        await axios.get(`${USER_SERVICE_URL}/users/${vendorId}`);
    } catch (error) {
        console.error(`[POST] Vendor validation failed:`, error.message);
        return res.status(400).json({ error: 'Invalid vendorId: User does not exist' });
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
        res.status(201).json({
            success: true,
            message: "Shop generated and legally saved to database successfully",
            shop: rows[0]
        });

    } catch (error) {
        console.error("[POST] /generate-shop Error:", error);
        res.status(500).json({ success: false, message: "Failed to generate and save shop", error: error.message });
    }
});

// ------------------------------------------------------------------
// GET /shops/:vendorId API
// ------------------------------------------------------------------
app.get('/shops/:vendorId', async (req, res) => {
    const { vendorId } = req.params;
    console.log(`[GET] /shops/${vendorId} - Fetching shops...`);

    try {
        // Find all shops matching the specific vendor, sorting by descending creation time
        const query = `
            SELECT * FROM shops 
            WHERE vendor_id = $1 
            ORDER BY created_at DESC;
        `;
        const { rows } = await pool.query(query, [vendorId]);
        
        console.log(`[GET] /shops/${vendorId} - Fetched ${rows.length} shops`);
        res.status(200).json({ success: true, count: rows.length, shops: rows });
    } catch (error) {
        console.error(`[GET] /shops/${vendorId} Error:`, error);
        res.status(500).json({ success: false, message: "Failed to fetch shops", error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🧠 AI Service is running on http://localhost:${PORT}`);
});
