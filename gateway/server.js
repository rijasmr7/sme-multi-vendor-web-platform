const express = require('express');
const cors = require('cors');
const axios = require('axios'); // We use Axios to make HTTP requests to other microservices

const app = express();
const PORT = 5000;

// Middleware
app.use(cors()); // Allow frontend to call Gateway without CORS errors
app.use(express.json()); // Parse JSON body from HTTP requests

// -------------------------------------------------------------
// MICROSERVICE ADDRESS BOOK
// -------------------------------------------------------------
const SERVICES = {
    user: process.env.USER_SERVICE_URL || 'http://localhost:5004',
    product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:5001',
    ai: process.env.AI_SERVICE_URL || 'http://localhost:5002',
    analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:5003'
};

// -------------------------------------------------------------
// HELPER FUNCTION: Error Handler
// -------------------------------------------------------------
// We create this function to keep our code clean and avoid writing
// the exact same error logic over and over in every route.
const handleError = (res, error, serviceName) => {
    if (error.response) {
        // The service successfully received the request but returned an error (like 404 Not Found or 400 Bad Request)
        res.status(error.response.status).json(error.response.data);
    } else {
        // The service didn't respond at all (it might be offline, crashed, etc.)
        console.error(`[Gateway Error] ${serviceName} is down:`, error.message);
        res.status(500).json({ error: `${serviceName} is currently unavailable.` });
    }
};

// =============================================================
// USER SERVICE ROUTES
// =============================================================

// 1. POST /register -> Forward to user-service
app.post('/register', async (req, res) => {
    try {
        console.log(`>>> [Gateway] Forwarding POST /register to User Service`);
        const response = await axios.post(`${SERVICES.user}/register`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'User Service');
    }
});

// 2. POST /login -> Forward to user-service
app.post('/login', async (req, res) => {
    try {
        console.log(`>>> [Gateway] Forwarding POST /login to User Service`);
        const response = await axios.post(`${SERVICES.user}/login`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'User Service');
    }
});

// =============================================================
// PRODUCT SERVICE ROUTES
// =============================================================

// 3. POST /products -> Forward to product-service
app.post('/products', async (req, res) => {
    try {
        console.log(`>>> [Gateway] Forwarding POST /products to Product Service`);
        const response = await axios.post(`${SERVICES.product}/products`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Product Service');
    }
});

// 4. GET /products -> Forward to product-service
app.get('/products', async (req, res) => {
    try {
        console.log(`>>> [Gateway] Forwarding GET /products to Product Service`);
        const response = await axios.get(`${SERVICES.product}/products`);
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Product Service');
    }
});

// 5. GET /products/vendor/:vendorId -> Forward to product-service
app.get('/products/vendor/:vendorId', async (req, res) => {
    try {
        const vendorId = req.params.vendorId;
        console.log(`>>> [Gateway] Forwarding GET /products/vendor/${vendorId}`);
        const response = await axios.get(`${SERVICES.product}/products/vendor/${vendorId}`);
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Product Service');
    }
});

// 6. PUT /products/:id -> Forward to product-service
app.put('/products/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`>>> [Gateway] Forwarding PUT /products/${id}`);
        // We must pass req.body here so the product service knows WHAT to update
        const response = await axios.put(`${SERVICES.product}/products/${id}`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Product Service');
    }
});

// 7. DELETE /products/:id -> Forward to product-service
app.delete('/products/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`>>> [Gateway] Forwarding DELETE /products/${id}`);
        const response = await axios.delete(`${SERVICES.product}/products/${id}`);
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Product Service');
    }
});

// =============================================================
// OTHER SERVICES (AI & Analytics)
// =============================================================

// GET /generate-ai/:type -> Forward to AI service
app.get('/generate-ai/:type', async (req, res) => {
    try {
        const type = req.params.type;
        console.log(`>>> [Gateway] Forwarding GET /generate-ai/${type}`);
        const response = await axios.get(`${SERVICES.ai}/generate-ai/${type}`);
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'AI Service');
    }
});

// GET /stats -> Forward to Analytics service
app.get('/stats', async (req, res) => {
    try {
        console.log(`>>> [Gateway] Forwarding GET /stats`);
        const response = await axios.get(`${SERVICES.analytics}/stats`);
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Analytics Service');
    }
});

// -------------------------------------------------------------
// START SERVER
// -------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`🌐 API Gateway is running on http://localhost:${PORT}`);
});
