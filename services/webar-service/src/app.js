const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const modelRoutes = require('./routes/modelRoutes');

const app = express();
const PORT = process.env.PORT || 5006;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDirOriginal = path.join(__dirname, 'uploads', 'original');
const uploadDirOptimized = path.join(__dirname, 'uploads', 'optimized');
if (!fs.existsSync(uploadDirOriginal)) {
    fs.mkdirSync(uploadDirOriginal, { recursive: true });
}
if (!fs.existsSync(uploadDirOptimized)) {
    fs.mkdirSync(uploadDirOptimized, { recursive: true });
}

app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
}, express.static(path.join(__dirname, 'uploads')));
app.use('/models', modelRoutes);

app.use((err, req, res, next) => {
    // Custom error handler for multer limits
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File is too large. Max size is 200MB.' });
    }
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

app.listen(PORT, () => {
    console.log(`WebAR Service running on port ${PORT}`);
});
