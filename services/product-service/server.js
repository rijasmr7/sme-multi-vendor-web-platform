const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001; // We use 5001 specifically for the Product Service

// Middleware
app.use(cors()); // Allows our frontend to make requests to this backend without errors
app.use(express.json()); // Allows Express to understand JSON data sent in the request body

// In-memory array to store products (Temporary database for now)
let products = [
    {
        id: 1,
        name: "Sample Coffee Beans",
        price: 15.99,
        category: "Cafe"
    }
];

// ------------------------------------------------------------------
// ROUTE 1: GET /products
// Purpose: Retrieve all products in the database
// ------------------------------------------------------------------
app.get('/products', (req, res) => {
    res.status(200).json({
        success: true,
        count: products.length,
        data: products
    });
});

// ------------------------------------------------------------------
// ROUTE 2: POST /products
// Purpose: Add a new product to the database
// ------------------------------------------------------------------
app.post('/products', (req, res) => {
    // 1. Extract data from the request body
    const { name, price, category } = req.body;

    // 2. Basic validation: ensure required fields are provided
    if (!name || price === undefined || price === null) {
        return res.status(400).json({
            success: false,
            message: "Please provide both 'name' and 'price' for the product."
        });
    }

    // 3. Create the new product object
    const newProduct = {
        id: products.length + 1, // Generate a simple incremental ID
        name: name,
        price: price,
        category: category || "Uncategorized" // Default category if none is provided
    };

    // 4. Save the product to our in-memory array
    products.push(newProduct);

    // 5. Send a success response back to the client
    res.status(201).json({
        success: true,
        data: newProduct
    });
});

// ------------------------------------------------------------------
// START THE SERVER
// ------------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`✅ Product Service is running on http://localhost:${PORT}`);
});
