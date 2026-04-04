const express = require('express');
const cors = require('cors');
const axios = require('axios'); // We use axios to fetch data from the other microservices

const app = express();
const PORT = 5003; // Dedicated port for the Analytics Service

app.use(cors());
app.use(express.json());

// In a real microservices architecture, analytics data might be pushed via events (like RabbitMQ or Kafka),
// but for our simple REST architecture, the Analytics Service will ask the Product Service for its data directly!
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:5001';

// ------------------------------------------------------------------
// ROUTE: GET /stats
// Purpose: Compile and return dashboard metrics for the SME owner
// ------------------------------------------------------------------
app.get('/stats', async (req, res) => {
    try {
        // Fetch the current product database from the Product Service
        const productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/products`);
        
        // Extract the data array
        const allProducts = productResponse.data.data;
        
        // Calculate our simple analytics
        const totalProducts = allProducts.length;
        
        // Calculate the total value of the inventory (summing up all the prices)
        let totalInventoryValue = 0;
        allProducts.forEach(product => {
             totalInventoryValue += (product.price || 0);
        });

        // Calculate average price
        const averagePrice = totalProducts > 0 ? (totalInventoryValue / totalProducts).toFixed(2) : 0;

        // Send the stats back!
        res.status(200).json({
            success: true,
            dashboard: {
                totalProducts: totalProducts,
                totalInventoryValue: `$${totalInventoryValue.toFixed(2)}`,
                averageProductPrice: `$${averagePrice}`
            }
        });

    } catch (error) {
        console.error("Analytics Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to gather statistics. Is the Product Service (5001) running?",
            error: error.message
        });
    }
});

// ------------------------------------------------------------------
// START SERVER
// ------------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`📊 Analytics Service is running on http://localhost:${PORT}`);
});
