const express = require('express');
const cors = require('cors');
const axios = require('axios'); // Axios lets us make HTTP requests to our other microservices

const app = express();
const PORT = 5000; // The API Gateway is the central hub, running on Port 5000

// Middleware
app.use(cors()); // Allows frontend to bypass CORS security
app.use(express.json()); // Allows parsing JSON bodies

// ------------------------------------------------------------------
// MICROSERVICE ADDRESS BOOK
// ------------------------------------------------------------------
// To know where to send traffic, the Gateway needs to know the addresses of all services.
const SERVICES = {
    product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:5001',
    ai: process.env.AI_SERVICE_URL || 'http://localhost:5002',
    analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:5003'
};

// ==================================================================
// ROUTE 1: GET /generate-ai/:type 
// Goal: Forward request to the True RAG AI Service
// ==================================================================
app.get('/generate-ai/:type', async (req, res) => {
    try {
        const businessType = req.params.type;
        const response = await axios.get(`${SERVICES.ai}/generate-ai/${businessType}`);
        res.status(response.status).json(response.data);
    } catch (error) {
        const statusCode = error.response ? error.response.status : 500;
        const errorData = error.response ? error.response.data : { success: false, message: 'AI Service is completely down' };
        res.status(statusCode).json(errorData);
    }
});

// ==================================================================
// ROUTE 2: POST /products 
// Goal: Forward new product data to the Product Service
// ==================================================================
app.post('/products', async (req, res) => {
    try {
        const incomingData = req.body; // Example: { name: "Bread", price: 5 }

        // Send the HTTP POST request to the Product Service (port 5001), passing along the data
        const response = await axios.post(`${SERVICES.product}/products`, incomingData);
        
        // Send the result from Product Service back to the user
        res.status(response.status).json(response.data);

    } catch (error) {
        const statusCode = error.response ? error.response.status : 500;
        const errorData = error.response ? error.response.data : { success: false, message: 'Product Service is completely down' };
        res.status(statusCode).json(errorData);
    }
});

// ==================================================================
// ROUTE 3: GET /stats 
// Goal: Forward request to the Analytics Service
// ==================================================================
app.get('/stats', async (req, res) => {
    try {
        const response = await axios.get(`${SERVICES.analytics}/stats`);
        res.status(response.status).json(response.data);
    } catch (error) {
        const statusCode = error.response ? error.response.status : 500;
        const errorData = error.response ? error.response.data : { success: false, message: 'Analytics Service is completely down' };
        res.status(statusCode).json(errorData);
    }
});

// ------------------------------------------------------------------
// START THE GATEWAY
// ------------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`🌐 API Gateway is running on http://localhost:${PORT}`);
});
