const { GoogleGenerativeAI } = require('@google/generative-ai');
const pool = require('../config/db');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const knowledgeBase = {
    fruit: {
        navigation: ["Home", "Fresh Fruits", "Offers", "offers", "Contact"],
        layout: "grid"
    },
    clothing: {
        navigation: ["Home", "Men", "Women", "Collections", "offers", "Contact"],
        layout: "modern-grid"
    }
};

// --- COLOR UTILITIES (Simple HSL Math) ---
const hexToHSL = (hex) => {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
};

const hslToHex = (h, s, l) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
};

const generatePalette = (primaryHex) => {
    const { h, s, l } = hexToHSL(primaryHex);
    return {
        primary: primaryHex,
        secondary: hslToHex(h, s, Math.min(l + 25, 95)),
        accent: hslToHex(h, s, Math.max(l - 20, 5)),
        background: "#f9fafb",
        text: "#111827"
    };
};

/**
 * SERVICE LAYER: AI generation and database logic.
 */

const generateShopData = async (businessType, shopName, products = [], theme = "professional", primaryColor = "#6366f1") => {
    const finalShopName = shopName || `${businessType.charAt(0).toUpperCase() + businessType.slice(1)} Store`;
    console.log(`--- Starting Full Shop Configuration Pipeline [Type: ${businessType}, Shop: ${finalShopName}] ---`);

    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Gemini API Key is missing.");
    }

    // --- STEP 1: RAG (Retrieval-Augmented Generation) ---
    console.log("[Step 1/4] Retrieving Industry Context from Knowledge Base...");
    const typeKey = businessType.toLowerCase();
    const retrievedData = knowledgeBase[typeKey] || {
        navigation: ["Home", "Shop", "About Us", "offers", "Contact"],
        layout: "standard"
    };
    console.log(` >> Retrieved RAG Data: Nav=[${retrievedData.navigation.join(', ')}], Layout='${retrievedData.layout}'`);

    // --- STEP 2: DYNAMIC THEMING LOGIC ---
    console.log("[Step 2/4] Generating Synchronized Color Palette...");
    const palette = generatePalette(primaryColor);
    console.log(` >> Derived Palette: Primary=${palette.primary}, Accent=${palette.accent}, Secondary=${palette.secondary}`);

    // --- STEP 3: AI SYNTHESIS (Gemini Prompt) ---
    console.log("[Step 3/4] Synthesizing Creative Content with Gemini AI...");
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const context = [];
    if (products.length > 0) context.push(`Focus on these core items: ${products.join(', ')}.`);
    if (theme) context.push(`Applying vibe/theme override: '${theme}'.`);

    const prompt = `
        System: Creative Business Consultant
        Task: Configuration for "${businessType}" shop.
        Context: ${context.join(' ')}

        RAG Constraints (STRICT):
        - Navigation: ${JSON.stringify(retrievedData.navigation)}
        - Layout Pattern: "${retrievedData.layout}"
        - Brand Tone: Determined by UI Palette (Primary: ${primaryColor})

        Deliverable: Return a JSON object for a professional shop.
        IMPORTANT: 
        1. Generate short, standard, generic product names (e.g., "Apple", "T-Shirt"). Do NOT generate long innovative names.
        2. Do NOT generate prices. Leave the price as an empty string ("").
        3. For each product, generate a compelling, professional description (2-3 sentences) that highlights its benefits and quality.
        
        {
          "shopName": "${finalShopName}",
          "navigation": ${JSON.stringify(retrievedData.navigation)},
          "layout": "${retrievedData.layout}",
          "theme": ${JSON.stringify(palette)},
          "products": [
            { "name": "Generic Item A", "price": "", "description": "High-quality item perfect for daily use." },
            { "name": "Generic Item B", "price": "", "description": "Durable and stylish, designed with comfort in mind." },
            { "name": "Generic Item C", "price": "", "description": "Premium selection crafted from the finest materials." },
            { "name": "Generic Item D", "price": "", "description": "Versatile and elegant, a must-have for your collection." }
          ]
        }
    `;

    try {
        console.log(" >> Invoking Gemini Generative Model...");
        const result = await model.generateContent(prompt);
        let aiTextResponse = result.response.text();
        aiTextResponse = aiTextResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        const finalConfig = JSON.parse(aiTextResponse);
        // Force the shopName from our side just in case AI deviates
        finalConfig.shopName = finalShopName;
        console.log(`[Step 4/4] Final Assembly Complete: Shop Name='${finalConfig.shopName}'`);
        return finalConfig;

    } catch (error) {
        console.warn(` >> AI synthesis failed: ${error.message}. Triggering Smart Fallback.`);

        // --- STEP 1x: SMART FALLBACK (Backup Assembly) ---
        const fallbacks = {
            fruit: ["Apple", "Banana", "Mango", "Orange"],
            clothing: ["T-Shirt", "Jeans", "Sweater", "Jacket"],
            electronics: ["Headphones", "Watch", "Charger", "Cable"],
            bakery: ["Bread", "Croissant", "Muffin", "Cake"]
        };

        const defaultItems = fallbacks[typeKey] || ["Item A", "Item B", "Item C", "Item D"];

        const fallbackConfig = {
            shopName: finalShopName,
            navigation: retrievedData.navigation,
            layout: retrievedData.layout,
            theme: palette,
            products: defaultItems.map((name, i) => ({
                name,
                price: "",
                description: `Fresh and high-quality ${name} sourced from top suppliers.`
            }))
        };

        console.log(`[Step 4/4] Fallback Assembly Complete: Shop Name='${fallbackConfig.shopName}'`);
        return fallbackConfig;
    }
};

const pushShopLocation = async (shop) => {
    if (shop) {
        try {
            const axios = require('axios');

            let lat, lon;
            if (shop.location) {
                const locObj = typeof shop.location === 'string' ? JSON.parse(shop.location) : shop.location;
                if (locObj && locObj.lat !== undefined && (locObj.lon !== undefined || locObj.lng !== undefined)) {
                    lat = parseFloat(locObj.lat);
                    lon = parseFloat(locObj.lon || locObj.lng);
                }
            }

            // If no location was given, do not set default hardcoded location, keep it null
            if (lat === undefined || lon === undefined) {
                console.log(`[AI Service] No location provided for shop ${shop.id}. Skipping Location Service update.`);
                return;
            }

            const locationServiceUrl = process.env.LOCATION_SERVICE_URL || 'http://location:5007';
            await axios.post(`${locationServiceUrl}/shops/location`, {
                shopId: shop.id,
                shopName: shop.shop_name,
                lat: lat,
                lon: lon
            });
            console.log(`[AI Service] Successfully pushed location data for shop ${shop.id} to Location Service.`);
        } catch (error) {
            console.error(`[AI Service] Failed to push location to Location Service:`, error.message);
        }
    }
};

const saveShop = async (vendorId, shopName, config, isPublished = false, location = null) => {
    const query = `
        INSERT INTO shops (vendor_id, shop_name, config, is_published, location)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [
        vendorId,
        shopName,
        JSON.stringify(config),
        isPublished,
        location ? JSON.stringify(location) : null
    ]);
    const shop = rows[0];
    if (shop && isPublished) {
        await pushShopLocation(shop);
    }
    return shop;
};

const findShopsByVendor = async (vendorId) => {
    const query = `SELECT * FROM shops WHERE vendor_id = $1 ORDER BY created_at DESC;`;
    const { rows } = await pool.query(query, [vendorId]);
    return rows;
};

const publishShop = async (shopId) => {
    const query = `
        UPDATE shops 
        SET is_published = true 
        WHERE id = $1 
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [shopId]);
    const shop = rows[0];

    if (shop) {
        await pushShopLocation(shop);
    }

    return shop;
};

const getPublishedShops = async () => {
    const query = `SELECT * FROM shops WHERE is_published = true ORDER BY created_at DESC;`;
    const { rows } = await pool.query(query);
    return rows;
};

const getPublicShops = async () => {
    // 🔒 Security Check: Only display shops that are published AND approved by admin
    const query = `SELECT id, vendor_id, shop_name, config, location FROM shops WHERE is_published = true AND is_approved = true ORDER BY created_at DESC;`;
    const { rows } = await pool.query(query);

    return rows.map(shop => ({
        id: shop.id,
        vendor_id: shop.vendor_id,
        shopName: shop.shop_name,
        navigation: shop.config?.navigation || [],
        navigationContent: shop.config?.navigationContent || {},
        products: shop.config?.products || [],
        theme: shop.config?.theme || {},
        location: shop.location || null
    }));
};

const getPublicShopById = async (id) => {
    // 🔒 Security Check: Only allow viewing a shop if it is published AND approved
    const query = `SELECT id, vendor_id, shop_name, config, location FROM shops WHERE id = $1 AND is_published = true AND is_approved = true;`;
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) return null;

    const shop = rows[0];
    return {
        id: shop.id,
        vendor_id: shop.vendor_id,
        shopName: shop.shop_name,
        navigation: shop.config?.navigation || [],
        navigationContent: shop.config?.navigationContent || {},
        products: shop.config?.products || [],
        theme: shop.config?.theme || {},
        location: shop.location || null
    };
};

const findAllShopsAdmin = async () => {
    const query = `SELECT * FROM shops ORDER BY id DESC;`;
    const { rows } = await pool.query(query);
    return rows;
};

const toggleShopApproval = async (shopId, isApproved) => {
    const query = `
        UPDATE shops 
        SET is_approved = $1 
        WHERE id = $2 
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [isApproved, shopId]);
    return rows[0];
};

const updateShopAdmin = async (shopId, updateData) => {
    const { shop_name, config, is_published, is_approved, location } = updateData;
    const query = `
        UPDATE shops
        SET shop_name = COALESCE($1, shop_name),
            config = COALESCE($2, config),
            is_published = COALESCE($3, is_published),
            is_approved = COALESCE($4, is_approved),
            location = COALESCE($5, location)
        WHERE id = $6
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [
        shop_name,
        config ? JSON.stringify(config) : null,
        is_published,
        is_approved,
        location ? JSON.stringify(location) : null,
        shopId
    ]);
    return rows[0];
};

const updateShopConfig = async (shopId, config) => {
    const query = `
        UPDATE shops
        SET config = $1
        WHERE id = $2
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [
        JSON.stringify(config),
        shopId
    ]);
    return rows[0];
};

const deleteShopAdmin = async (shopId) => {
    const query = `DELETE FROM shops WHERE id = $1 RETURNING *;`;
    const { rows } = await pool.query(query, [shopId]);
    const shop = rows[0];
    if (shop) {
        try {
            const axios = require('axios');
            const locationServiceUrl = process.env.LOCATION_SERVICE_URL || 'http://location:5007';
            await axios.delete(`${locationServiceUrl}/shops/${shopId}/location`);
            console.log(`[AI Service] Cleaned up location for deleted shop ${shopId}`);
        } catch (error) {
            console.error(`[AI Service] Failed to clean up location for shop ${shopId}:`, error.message);
        }
    }
    return shop;
};

module.exports = {
    generateShopData,
    saveShop,
    findShopsByVendor,
    publishShop,
    getPublishedShops,
    getPublicShops,
    getPublicShopById,
    findAllShopsAdmin,
    toggleShopApproval,
    updateShopAdmin,
    updateShopConfig,
    deleteShopAdmin
};
