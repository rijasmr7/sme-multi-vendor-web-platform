require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
    console.log("Using API Key:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    try {
        console.log("Calling Gemini...");
        const result = await model.generateContent("Say hello");
        console.log("Response:", result.response.text());
    } catch (err) {
        console.error("TEST FAIL:", err.message);
        if (err.stack) console.error(err.stack);
    }
}

test();
