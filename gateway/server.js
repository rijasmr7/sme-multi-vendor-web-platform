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
    analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:5003',
    order: process.env.ORDER_SERVICE_URL || 'http://localhost:5005',
    recommender: process.env.RECOMMENDER_SERVICE_URL || 'http://localhost:8008',
    hybridRecommender: process.env.HYBRID_RECOMMENDER_URL || 'http://localhost:8009',
    webar: process.env.WEBAR_SERVICE_URL || 'http://localhost:5006'
};

// -------------------------------------------------------------
// HELPER FUNCTION: Error Handler
// -------------------------------------------------------------
// We create this function to keep our code clean and avoid writing
// the exact same error logic over and over in every route.
const handleError = (res, error, serviceName) => {
    if (error.response) {
        // Use the standardized error JSON coming from the microservice
        res.status(error.response.status).json(error.response.data);
    } else {
        // Service is offline or crashed
        console.error(`[Gateway Error] ${serviceName} is down:`, error.message);
        res.status(503).json({ success: false, message: `${serviceName} is currently unavailable.` });
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

// 3. POST /customer/register -> Forward to user-service
app.post('/customer/register', async (req, res) => {
    try {
        console.log(`>>> [Gateway] Forwarding POST /customer/register to User Service`);
        const response = await axios.post(`${SERVICES.user}/customer/register`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'User Service');
    }
});

// 4. POST /customer/login -> Forward to user-service
app.post('/customer/login', async (req, res) => {
    try {
        console.log(`>>> [Gateway] Forwarding POST /customer/login to User Service`);
        const response = await axios.post(`${SERVICES.user}/customer/login`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'User Service');
    }
});

// 5. GET /profile -> Forward to user-service
app.get('/profile', async (req, res) => {
    try {
        console.log(`>>> [Gateway] Forwarding GET /profile to User Service`);
        const response = await axios.get(`${SERVICES.user}/profile`, {
            headers: { Authorization: req.headers['authorization'] }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'User Service');
    }
});

// 6. PUT /profile -> Forward to user-service
app.put('/profile', async (req, res) => {
    try {
        console.log(`>>> [Gateway] Forwarding PUT /profile to User Service`);
        const response = await axios.put(`${SERVICES.user}/profile`, req.body, {
            headers: { Authorization: req.headers['authorization'] }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'User Service');
    }
});

// 7. DELETE /profile -> Forward to user-service
app.delete('/profile', async (req, res) => {
    try {
        console.log(`>>> [Gateway] Forwarding DELETE /profile to User Service`);
        const response = await axios.delete(`${SERVICES.user}/profile`, {
            headers: { Authorization: req.headers['authorization'] }
        });
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
        const response = await axios.post(`${SERVICES.product}/products`, req.body, {
            headers: { Authorization: req.headers['authorization'] }
        });
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
        const response = await axios.get(`${SERVICES.product}/products/vendor/${vendorId}`, {
            headers: { Authorization: req.headers['authorization'] }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Product Service');
    }
});

// Public version for customer site (No Auth)
app.get('/public/products/vendor/:vendorId', async (req, res) => {
    try {
        const vendorId = req.params.vendorId;
        console.log(`>>> [Gateway] Forwarding GET /public/products/vendor/${vendorId}`);
        const response = await axios.get(`${SERVICES.product}/products/public/vendor/${vendorId}`);
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
        const response = await axios.put(`${SERVICES.product}/products/${id}`, req.body, {
            headers: { Authorization: req.headers['authorization'] }
        });
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
        const response = await axios.delete(`${SERVICES.product}/products/${id}`, {
            headers: { Authorization: req.headers['authorization'] }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Product Service');
    }
});

// 8. GET /products/recommendations/:userId/:productId -> Forward to product-service
app.get('/products/recommendations/:userId/:productId', async (req, res) => {
    try {
        const { userId, productId } = req.params;
        console.log(`>>> [Gateway] Forwarding GET /products/recommendations/${userId}/${productId}`);
        const response = await axios.get(`${SERVICES.product}/recommendations/${userId}/${productId}`);
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

// POST /generate-shop -> Forward to AI service (NEW REFACTORED WORKFLOW)
app.post('/generate-shop', async (req, res) => {
    try {
        console.log(`>>> [Gateway] Forwarding POST /generate-shop`);
        const response = await axios.post(`${SERVICES.ai}/generate-shop`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'AI Service');
    }
});

// POST /save-shop -> Forward to AI service
app.post('/save-shop', async (req, res) => {
    try {
        console.log(`>>> [Gateway] Forwarding POST /save-shop`);
        const response = await axios.post(`${SERVICES.ai}/save-shop`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'AI Service');
    }
});

// GET /shops/:vendorId -> Forward to AI service
app.get('/shops/:vendorId', async (req, res) => {
    try {
        const vendorId = req.params.vendorId;
        console.log(`>>> [Gateway] Forwarding GET /shops/${vendorId}`);
        const response = await axios.get(`${SERVICES.ai}/shops/${vendorId}`);
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'AI Service');
    }
});

// GET /shops/published -> Forward to AI service
app.get('/shops/published', async (req, res) => {
    try {
        console.log(`>>> [Gateway] Forwarding GET /shops/published`);
        const response = await axios.get(`${SERVICES.ai}/shops/published`);
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'AI Service');
    }
});

// PUT /shops/publish/:shopId -> Forward to AI service
app.put('/shops/publish/:shopId', async (req, res) => {
    try {
        const shopId = req.params.shopId;
        console.log(`>>> [Gateway] Forwarding PUT /shops/publish/${shopId}`);
        const response = await axios.put(`${SERVICES.ai}/shops/publish/${shopId}`);
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'AI Service');
    }
});

// PUT /shops/:shopId/config -> Forward to AI service
app.put('/shops/:shopId/config', async (req, res) => {
    try {
        const shopId = req.params.shopId;
        console.log(`>>> [Gateway] Forwarding PUT /shops/${shopId}/config`);
        const response = await axios.put(`${SERVICES.ai}/shops/${shopId}/config`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'AI Service');
    }
});

// PUBLIC ENDPOINTS (No Auth)
// GET /public/shops -> Forward to AI service
app.get('/public/shops', async (req, res) => {
    try {
        console.log(`>>> [Gateway] Forwarding GET /public/shops`);
        const response = await axios.get(`${SERVICES.ai}/public/shops`);
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'AI Service');
    }
});

// GET /public/shops/:id -> Forward to AI service
app.get('/public/shops/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`>>> [Gateway] Forwarding GET /public/shops/${id}`);
        const response = await axios.get(`${SERVICES.ai}/public/shops/${id}`);
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'AI Service');
    }
});

// GET /recommend/location-aware -> Forward to Hybrid Recommender service
app.get('/recommend/location-aware', async (req, res) => {
    try {
        console.log(`>>> [Gateway] Forwarding GET /recommend/location-aware with query:`, req.query);
        const response = await axios.get(`${SERVICES.hybridRecommender}/recommend/location-aware`, {
            params: req.query
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Hybrid Recommender Service');
    }
});

// GET /recommend/trending-nearby -> Forward to Hybrid Recommender service
app.get('/recommend/trending-nearby', async (req, res) => {
    try {
        console.log(`>>> [Gateway] Forwarding GET /recommend/trending-nearby with query:`, req.query);
        const response = await axios.get(`${SERVICES.hybridRecommender}/recommend/trending-nearby`, {
            params: req.query
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Hybrid Recommender Service');
    }
});

// GET /recommend/:id -> Forward to Recommender service
app.get('/recommend/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`>>> [Gateway] Forwarding GET /recommend/${id}`);
        const response = await axios.get(`${SERVICES.recommender}/recommend/${id}`);
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Recommender Service');
    }
});

// =============================================================
// ORDER SERVICE ROUTES
// =============================================================

// 1. POST /orders -> Create new order
app.post('/orders', async (req, res) => {
    try {
        console.log(`>>> [Gateway] Forwarding POST /orders`);
        const response = await axios.post(`${SERVICES.order}/orders`, req.body, {
            headers: { Authorization: req.headers['authorization'] }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Order Service');
    }
});

// 2. PUT /orders/:id/status -> Update order status
app.put('/orders/:id/status', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`>>> [Gateway] Forwarding PUT /orders/${id}/status`);
        const response = await axios.put(`${SERVICES.order}/orders/${id}/status`, req.body, {
            headers: { Authorization: req.headers['authorization'] }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Order Service');
    }
});

// 2b. PUT /orders/:id/pay -> Pay/confirm order
app.put('/orders/:id/pay', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`>>> [Gateway] Forwarding PUT /orders/${id}/pay`);
        const response = await axios.put(`${SERVICES.order}/orders/${id}/pay`, req.body, {
            headers: { Authorization: req.headers['authorization'] }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Order Service');
    }
});

// GET /public/orders/stats/shops -> Get order counts per shop
app.get('/public/orders/stats/shops', async (req, res) => {
    try {
        console.log(`>>> [Gateway] Forwarding GET /public/orders/stats/shops`);
        const response = await axios.get(`${SERVICES.order}/orders/public/stats/shops`);
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Order Service');
    }
});

// GET /public/orders/stats/products -> Get order counts per product
app.get('/public/orders/stats/products', async (req, res) => {
    try {
        console.log(`>>> [Gateway] Forwarding GET /public/orders/stats/products`);
        const response = await axios.get(`${SERVICES.order}/orders/public/stats/products`);
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Order Service');
    }
});

// 3. GET /orders/customer/:id -> Get orders for a specific customer
app.get('/orders/customer/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`>>> [Gateway] Forwarding GET /orders/customer/${id}`);
        // Pass query parameters (status, date) along to the service
        const response = await axios.get(`${SERVICES.order}/orders/customer/${id}`, {
            headers: { Authorization: req.headers['authorization'] },
            params: req.query
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Order Service');
    }
});

// GET /orders/customer/:id/address -> Get delivery address
app.get('/orders/customer/:id/address', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`>>> [Gateway] Forwarding GET /orders/customer/${id}/address`);
        const response = await axios.get(`${SERVICES.order}/orders/customer/${id}/address`, {
            headers: { Authorization: req.headers['authorization'] }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Order Service');
    }
});

// 4. GET /orders/vendor/:id -> Get orders for a specific vendor
app.get('/orders/vendor/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`>>> [Gateway] Forwarding GET /orders/vendor/${id}`);
        const response = await axios.get(`${SERVICES.order}/orders/vendor/${id}`, {
            headers: { Authorization: req.headers['authorization'] },
            params: req.query
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Order Service');
    }
});

// =============================================================
// CART ROUTES (Handled by Order Service)
// =============================================================

// 1. POST /cart -> Add item to cart
app.post('/cart', async (req, res) => {
    try {
        console.log(`>>> [Gateway] Forwarding POST /cart`);
        const response = await axios.post(`${SERVICES.order}/cart`, req.body, {
            headers: { Authorization: req.headers['authorization'] }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Order Service (Cart)');
    }
});

// 2. GET /cart/customer/:id -> Get customer cart
app.get('/cart/customer/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`>>> [Gateway] Forwarding GET /cart/customer/${id}`);
        const response = await axios.get(`${SERVICES.order}/cart/customer/${id}`, {
            headers: { Authorization: req.headers['authorization'] }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Order Service (Cart)');
    }
});

// 3. PUT /cart/item/:itemId -> Update cart item quantity
app.put('/cart/item/:itemId', async (req, res) => {
    try {
        const itemId = req.params.itemId;
        console.log(`>>> [Gateway] Forwarding PUT /cart/item/${itemId}`);
        const response = await axios.put(`${SERVICES.order}/cart/item/${itemId}`, req.body, {
            headers: { Authorization: req.headers['authorization'] }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Order Service (Cart)');
    }
});

// 4. DELETE /cart/item/:itemId -> Remove item from cart
app.delete('/cart/item/:itemId', async (req, res) => {
    try {
        const itemId = req.params.itemId;
        console.log(`>>> [Gateway] Forwarding DELETE /cart/item/${itemId}`);
        const response = await axios.delete(`${SERVICES.order}/cart/item/${itemId}`, {
            headers: { Authorization: req.headers['authorization'] }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Order Service (Cart)');
    }
});

// 5. DELETE /cart/customer/:id -> Clear customer cart
app.delete('/cart/customer/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`>>> [Gateway] Forwarding DELETE /cart/customer/${id}`);
        const response = await axios.delete(`${SERVICES.order}/cart/customer/${id}`, {
            headers: { Authorization: req.headers['authorization'] }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Order Service (Cart)');
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

// =============================================================
// LOCATION SERVICE ROUTES
// =============================================================

app.use('/location', async (req, res) => {
    try {
        const method = req.method.toLowerCase();
        console.log(`>>> [Gateway] Forwarding ${req.method} /location${req.url}`);
        
        const url = `${process.env.LOCATION_SERVICE_URL || 'http://localhost:5007'}/shops${req.url}`;
        
        const response = await axios({
            method: method,
            url: url,
            data: req.body,
            params: req.query,
            headers: { Authorization: req.headers['authorization'] }
        });
        
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Location Service');
    }
});
// =============================================================
// ADMIN PROXY ROUTES
// =============================================================

// User admin endpoints
app.use('/admin/users', async (req, res) => {
    try {
        const method = req.method.toLowerCase();
        const subpath = req.url === '/' ? '' : req.url;
        console.log(`>>> [Gateway] Forwarding ${req.method} /admin/users${subpath}`);
        const response = await axios({
            method: method,
            url: `${SERVICES.user}/admin/users${subpath}`,
            data: req.body,
            params: req.query,
            headers: { Authorization: req.headers['authorization'] }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'User Service (Admin)');
    }
});

// Shop admin endpoints
app.use('/admin/shops', async (req, res) => {
    try {
        const method = req.method.toLowerCase();
        const subpath = req.url === '/' ? '' : req.url;
        console.log(`>>> [Gateway] Forwarding ${req.method} /admin/shops${subpath}`);
        const response = await axios({
            method: method,
            url: `${SERVICES.ai}/admin/shops${subpath}`,
            data: req.body,
            params: req.query,
            headers: { Authorization: req.headers['authorization'] }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'AI Service (Admin)');
    }
});

// Product admin endpoints
app.use('/admin/products', async (req, res) => {
    try {
        const method = req.method.toLowerCase();
        const subpath = req.url === '/' ? '' : req.url;
        console.log(`>>> [Gateway] Forwarding ${req.method} /admin/products${subpath}`);
        const response = await axios({
            method: method,
            url: `${SERVICES.product}/products/admin/products${subpath}`,
            data: req.body,
            params: req.query,
            headers: { Authorization: req.headers['authorization'] }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Product Service (Admin)');
    }
});

// Order admin endpoints
app.use('/admin/orders', async (req, res) => {
    try {
        const method = req.method.toLowerCase();
        const subpath = req.url === '/' ? '' : req.url;
        console.log(`>>> [Gateway] Forwarding ${req.method} /admin/orders${subpath}`);
        const response = await axios({
            method: method,
            url: `${SERVICES.order}/orders/admin/orders${subpath}`,
            data: req.body,
            params: req.query,
            headers: { Authorization: req.headers['authorization'] }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        handleError(res, error, 'Order Service (Admin)');
    }
});

// START SERVER
// -------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`🌐 API Gateway is running on http://localhost:${PORT}`);
});
