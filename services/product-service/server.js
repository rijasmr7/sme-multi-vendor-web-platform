const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors()); // Allow frontend to call APIs without CORS errors
app.use(express.json()); // Allow reading JSON body from HTTP requests

// In-memory basic array to act as our database for now
let products = [
    {
        id: 1,
        vendorId: 101, // Vendor who owns this product
        name: "Premium Coffee Beans",
        price: 15.99,
        category: "Beverages"
    }
];

// Helper Function: Generate a unique ID for new products
function getNewId() {
    if (products.length === 0) return 1;
    // Map through array to get all IDs, then find the max value
    const ids = products.map(product => product.id);
    const maxId = Math.max(...ids);
    return maxId + 1;
}

// -------------------------------------------------------------
// 1. POST /products - Create a new product
// -------------------------------------------------------------
app.post('/products', (req, res) => {
    console.log(">>> [POST /products] Creating new product:", req.body);
    
    // Get data directly from request body
    const { vendorId, name, price, category } = req.body;

    // Check if essential fields are provided
    if (!vendorId || !name || price === undefined) {
        console.log(">>> ERROR: Missing required fields");
        return res.status(400).json({ error: "vendorId, name, and price are required." });
    }

    // Create the new product object
    const newProduct = {
        id: getNewId(),
        vendorId: Number(vendorId), // Convert to number representation
        name: name,
        price: Number(price),
        category: category || "General" // Provide a fallback default
    };

    // Add to our 'products' array database
    products.push(newProduct);
    
    console.log(">>> SUCCESS: Product added", newProduct);
    res.status(201).json(newProduct);
});

// -------------------------------------------------------------
// 2. GET /products - Get all products
// -------------------------------------------------------------
app.get('/products', (req, res) => {
    console.log(">>> [GET /products] Fetching all products...");
    console.log(`>>> Sending ${products.length} products`);
    
    // Return the whole array
    res.status(200).json(products);
});

// -------------------------------------------------------------
// 3. GET /products/vendor/:vendorId - Get products by vendor
// -------------------------------------------------------------
app.get('/products/vendor/:vendorId', (req, res) => {
    const vendorId = Number(req.params.vendorId);
    console.log(`>>> [GET /products/vendor/${vendorId}] Fetching products for vendor...`);

    // Use .filter() array method to find all products matching this vendorId
    const vendorProducts = products.filter(product => product.vendorId === vendorId);
    
    console.log(`>>> Found ${vendorProducts.length} items for this vendor`);
    res.status(200).json(vendorProducts);
});

// -------------------------------------------------------------
// 4. PUT /products/:id - Update product details
// -------------------------------------------------------------
app.put('/products/:id', (req, res) => {
    const id = Number(req.params.id);
    const { name, price, category } = req.body;
    console.log(`>>> [PUT /products/${id}] Updating product with new data:`, req.body);

    // Find if the product exists before trying to update it
    const productExists = products.find(product => product.id === id);

    if (!productExists) {
        console.log(">>> ERROR: Product not found");
        return res.status(404).json({ error: "Product not found" });
    }

    // Use .map() array method to iterate and construct an updated array
    products = products.map(product => {
        if (product.id === id) {
            // Match found: return a new updated version of this product
            return {
                id: product.id,
                vendorId: product.vendorId, // Never update vendorId, tied to user
                name: name || product.name, // Keep existing name if no new name provided
                price: price !== undefined ? Number(price) : product.price,
                category: category || product.category
            };
        }
        // If this product doesn't match the ID, return it unchanged
        return product;
    });

    // Grab updated product out of the array specifically to return to frontend
    const updatedProduct = products.find(product => product.id === id);
    console.log(">>> SUCCESS: Product updated:", updatedProduct);
    res.status(200).json(updatedProduct);
});

// -------------------------------------------------------------
// 5. DELETE /products/:id - Delete product by ID
// -------------------------------------------------------------
app.delete('/products/:id', (req, res) => {
    const id = Number(req.params.id);
    console.log(`>>> [DELETE /products/${id}] Deleting product...`);

    const initialLength = products.length;

    // Use .filter() to keep everything EXCEPT the item that matches the ID
    products = products.filter(product => product.id !== id);

    // Check if the length remains the same. If so, nothing matched the ID!
    if (products.length === initialLength) {
        console.log(">>> ERROR: Product not found");
        return res.status(404).json({ error: "Product not found" });
    }

    console.log(">>> SUCCESS: Product deleted");
    res.status(200).json({ message: "Product deleted successfully" });
});

// -------------------------------------------------------------
// START SERVER
// -------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`✅ Product Service is running on http://localhost:${PORT}`);
});
