const modelService = require('../services/modelService');
const compressionService = require('../services/compressionService');

exports.uploadModel = async (req, res) => {
    try {
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ success: false, message: 'No file provided or invalid file type' });
        }

        const vendor_id = parseInt(req.body.vendor_id);
        const shop_id = parseInt(req.body.shop_id);
        const product_id = parseInt(req.body.product_id);
        const model_name = req.body.model_name || file.originalname;

        if (!vendor_id || !shop_id || !product_id) {
            return res.status(400).json({ success: false, message: 'vendor_id, shop_id, and product_id are required' });
        }

        const file_url = `/uploads/original/${file.filename}`;

        // Run compression pipeline
        const optimizationResult = await compressionService.compressModel(file.path, file.filename);

        const savedModel = await modelService.saveModelMetadata({
            vendor_id,
            shop_id,
            product_id,
            model_name,
            file_url,
            original_size: optimizationResult.originalSize,
            optimized_size: optimizationResult.optimizedSize,
            optimized_file_url: optimizationResult.optimizedFileUrl,
            compression_ratio: optimizationResult.compressionRatio,
            file_format: 'glb'
        });

        res.status(201).json({
            success: true,
            message: 'Model uploaded and optimized successfully',
            data: savedModel
        });
    } catch (error) {
        console.error('Error uploading model:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getModel = async (req, res) => {
    try {
        const { product_id } = req.params;
        console.log(`[WebAR] Requesting model for Product ID: ${product_id}`);

        if (!product_id || product_id === 'undefined' || isNaN(parseInt(product_id))) {
            console.warn(`[WebAR] Invalid Product ID received: ${product_id}`);
            return res.status(404).json({ success: false, message: 'Invalid product ID' });
        }

        const model = await modelService.getModelByProductId(product_id);
        
        if (!model) {
            console.log(`[WebAR] No model found in database for Product ID: ${product_id}`);
            return res.status(404).json({ success: false, message: 'No AR model found for this product' });
        }
        
        console.log(`[WebAR] Found model for Product ID: ${product_id} -> ${model.model_name}`);
        res.status(200).json({ success: true, data: model });
    } catch (error) {
        console.error(`[WebAR] Error fetching model for ${req.params.product_id}:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.trackAnalytics = async (req, res) => {
    try {
        const { product_id } = req.params;
        const { type } = req.body; // 'ar' or '3d'
        
        const updated = await modelService.trackAnalytics(product_id, type);
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        const stats = await modelService.getAnalytics();
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
