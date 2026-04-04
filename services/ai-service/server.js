require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // The official package

const app = express();
const PORT = 5002;

app.use(cors());
app.use(express.json());

// Initialize the Gemini AI Toolkit using the key from our .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ------------------------------------------------------------------
// ROUTE 1: ORIGINAL MOCK SUGGEST (Step 3)
// ------------------------------------------------------------------
const productSuggestionsDB = {
    "fruit": ["Apple", "Banana", "Mango", "Orange", "Pineapple"],
    "clothing": ["T-Shirt", "Jeans", "Jacket", "Sneakers", "Hat"],
    "electronics": ["Smartphone", "Laptop", "Headphones", "Charger", "Power Bank"],
    "bakery": ["Croissant", "Sourdough Bread", "Baguette", "Muffin", "Cake"]
};

app.get('/suggest/:type', (req, res) => {
    const businessType = req.params.type.toLowerCase();
    const suggestions = productSuggestionsDB[businessType];

    if (!suggestions) {
        return res.status(404).json({ success: false, message: `No suggestions found for: '${businessType}'.` });
    }
    res.status(200).json({ success: true, businessType, suggestions });
});

// ==================================================================
// ROUTE 2: REAL GEMINI AI INTEGRATION API (Step 8)
// Goal: Talk to Google Gemini to architect a shop dynamically
// ==================================================================
app.get('/generate-ai/:type', async (req, res) => {
    try {
        const businessType = req.params.type;
        
        // 1. Safety Check: Ensure the developer has added their API key
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_actual_api_key_here') {
            return res.status(500).json({
                success: false,
                message: "A Gemini API Key is missing. Please grab one from Google AI Studio and put it in your AI Service's .env file."
            });
        }

        // 2. Select the most stable model that works universally for free tiers
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // Step 9: RAG (Retrieval) - We fetch base suggestions from our local "database"
        const baseSuggestions = productSuggestionsDB[businessType.toLowerCase()] || [];
        const ragContextText = baseSuggestions.length > 0 
            ? `\nHere is a list of base products you MUST include and significantly expand/beautify: ${baseSuggestions.join(', ')}.` 
            : ``;

        // 3. Craft our Prompt: We explicitly teach it to return JSON
        const prompt = `
            You are an expert business consultant helping an SME platform.
            A user is opening a new business of type: "${businessType}".
            ${ragContextText}

            Please generate a highly creative, short shop name and a list of 5 to 7 diverse, highly detailed initial products they should sell. 
            If base products were provided, use them but make their names sound much more premium and appealing. Include realistic starting prices (in dollars) for all items.
            
            CRITICAL INSTRUCTION: You MUST respond ONLY with a raw JSON object. 
            Do NOT wrap it in markdown blockticks like \`\`\`json.
            
            The JSON structure must be exactly this:
            {
              "shopName": "Your Creative Name",
              "products": [
                { "name": "Detailed Premium Product 1", "price": 10.50 },
                { "name": "Detailed Premium Product 2", "price": 5.00 }
              ]
            }
        `;

        // 4. Send the prompt across the internet to Google's servers
        const result = await model.generateContent(prompt);
        let aiTextResponse = result.response.text();

        // 5. Cleanup: Sometimes LLMs still add markdown. We erase it just in case.
        aiTextResponse = aiTextResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        // 6. Convert the pure text string back into a javascript object!
        const generatedData = JSON.parse(aiTextResponse);

        // 7. Send the beautiful AI results back successfully
        res.status(200).json({
            success: true,
            data: generatedData
        });

    } catch (error) {
        console.error("Gemini AI API Error:", error);
        
        // Did we hit an error parsing the JSON? Check for that.
        if (error instanceof SyntaxError) {
             return res.status(500).json({
                 success: false,
                 message: "Gemini sent back malformed JSON data.",
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to generate suggestions using AI.",
            error: error.message
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🧠 AI Service is running on http://localhost:${PORT}`);
});
