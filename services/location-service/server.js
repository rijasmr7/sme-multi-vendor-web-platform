require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./src/database/db');
const vendorRoutes = require('./src/routes/vendorRoutes');

const app = express();
const PORT = process.env.PORT || 5007;

app.use(cors());
app.use(express.json());

app.use('/vendors', vendorRoutes);
app.use('/shops', vendorRoutes); // Alias for shops as requested by user

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'location-service' });
});

app.use((err, req, res, next) => {
    console.error('[Location Service] Error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

const startServer = async () => {
    try {
        await initDB();
        app.listen(PORT, () => {
            console.log(`🌍 Location Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start Location Service:', error);
        process.exit(1);
    }
};

startServer();
