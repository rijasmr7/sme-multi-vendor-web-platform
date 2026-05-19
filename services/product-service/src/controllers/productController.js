const productService = require('../services/productService');
const { sendSuccess, sendError } = require('../utils/response');
const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5004';

/**
 * CONTROLLER LAYER: Request handling for products.
 */

const createProduct = async (req, res) => {
    const { name, price, category, extraData } = req.body;
    const vendorId = req.userId; // 🔒 Securely extracted from JWT

    // 1. Validation
    if (!name || price === undefined || !category) {
        return sendError(res, 'Missing required product fields', 400);
    }
    if (isNaN(price) || Number(price) < 0) {
        return sendError(res, 'Invalid price format', 400);
    }

    // 2. Cross-Service Validation
    try {
        await axios.get(`${USER_SERVICE_URL}/users/${vendorId}`);
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return sendError(res, 'Invalid vendor: User not found', 400);
        }
        return sendError(res, 'Validation error: User service unreachable', 503);
    }

    // 3. Service Call
    try {
        const product = await productService.createProduct({ vendorId, name, price, category, extraData });
        sendSuccess(res, product, 201);
    } catch (error) {
        sendError(res, 'Database error during product creation');
    }
};

const getAllProducts = async (req, res) => {
    try {
        const products = await productService.getAllProducts();
        sendSuccess(res, products);
    } catch (error) {
        sendError(res, 'Failed to fetch catalog');
    }
};

const getVendorProducts = async (req, res) => {
    const { vendorId } = req.params;

    // 🔒 Security Check: Ensure they are only fetching their own products
    if (String(vendorId) !== String(req.userId)) {
        return sendError(res, 'Unauthorized: You can only view your own products', 403);
    }

    try {
        const products = await productService.getProductsByVendor(vendorId);
        sendSuccess(res, products);
    } catch (error) {
        sendError(res, 'Failed to fetch vendor products');
    }
};

const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, price, category, extraData } = req.body;

    if (price !== undefined && (isNaN(price) || Number(price) < 0)) {
        return sendError(res, 'Invalid price format', 400);
    }

    try {
        const product = await productService.updateProduct(id, { name, price, category, extraData });
        if (!product) return sendError(res, 'Product not found', 404);
        sendSuccess(res, product);
    } catch (error) {
        sendError(res, 'Failed to update product');
    }
};

const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await productService.deleteProduct(id);
        if (!product) return sendError(res, 'Product not found', 404);
        sendSuccess(res, { message: 'Deleted successfully', product });
    } catch (error) {
        sendError(res, 'Failed to delete product');
    }
};

const getPublicVendorProducts = async (req, res) => {
    const { vendorId } = req.params;
    try {
        const products = await productService.getProductsByVendor(vendorId);
        sendSuccess(res, products);
    } catch (error) {
        sendError(res, 'Failed to fetch public vendor products');
    }
};

module.exports = {
    createProduct,
    getAllProducts,
    getVendorProducts,
    getPublicVendorProducts,
    updateProduct,
    deleteProduct
};
