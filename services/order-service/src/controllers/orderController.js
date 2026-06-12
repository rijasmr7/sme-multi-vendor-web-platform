const orderService = require('../services/orderService');
const { sendSuccess, sendError } = require('../utils/response');

const placeOrder = async (req, res) => {
    // 1. Extract customer_id from JWT (populated by authMiddleware)
    const customer_id = req.user.id;
    
    console.log('>>> [Order Service] Incoming Request Body:', req.body);
    const { vendor_id, shop_id, product_id, quantity, unit_price, delivery_type, customer_name, customer_phone, address_line, city, zip_code } = req.body;

    // 2. Validate input
    if (!product_id || !vendor_id || !shop_id || quantity === undefined) {
        return sendError(res, 'product_id, vendor_id, shop_id, and quantity are required', 400);
    }
    
    if (!delivery_type || !customer_name || !customer_phone) {
        return sendError(res, 'delivery_type, customer_name, and customer_phone are required', 400);
    }

    if (quantity <= 0) {
        return sendError(res, 'Quantity must be greater than 0', 400);
    }

    try {
        const order = await orderService.createOrder({ 
            customer_id, 
            vendor_id, 
            shop_id,
            product_id, 
            quantity,
            unit_price,
            delivery_type,
            customer_name,
            customer_phone,
            address_line,
            city,
            zip_code
        });
        
        sendSuccess(res, order, 201);
    } catch (error) {
        console.error('Order Creation Error:', error.message);
        sendError(res, 'Failed to place order: ' + error.message, 500);
    }
};

const updateStatus = async (req, res) => {
    const { id } = req.params; // order id
    const { status } = req.body;
    const vendor_id = req.user.id; // From JWT

    if (!status) {
        return sendError(res, 'Status is required', 400);
    }

    try {
        const updatedOrder = await orderService.updateOrderStatus(id, vendor_id, status);
        sendSuccess(res, updatedOrder, 200);
    } catch (error) {
        console.error('Status Update Error:', error.message);
        
        if (error.message.includes('Unauthorized')) {
            return sendError(res, error.message, 403);
        }
        if (error.message.includes('Invalid status') || error.message.includes('Cannot change status')) {
            return sendError(res, error.message, 400);
        }
        if (error.message.includes('not found')) {
            return sendError(res, error.message, 404);
        }

        sendError(res, 'Failed to update order status', 500);
    }
};

const getCustomerOrders = async (req, res) => {
    const { id } = req.params; // customer id
    const { status, date } = req.query;

    // Security: Users can only access their own orders
    if (parseInt(id) !== req.user.id) {
        return sendError(res, 'Unauthorized to view these orders', 403);
    }

    try {
        const orders = await orderService.getOrdersByCustomer(id, status, date);
        sendSuccess(res, orders, 200);
    } catch (error) {
        console.error('Fetch Orders Error:', error.message);
        sendError(res, 'Failed to fetch customer orders', 500);
    }
};

const getVendorOrders = async (req, res) => {
    const { id } = req.params; // vendor id
    const { status, date } = req.query;

    // Security: Vendors can only access their own orders
    if (parseInt(id) !== req.user.id) {
        return sendError(res, 'Unauthorized to view these orders', 403);
    }

    try {
        const orders = await orderService.getOrdersByVendor(id, status, date);
        sendSuccess(res, orders, 200);
    } catch (error) {
        console.error('Fetch Vendor Orders Error:', error.message);
        sendError(res, 'Failed to fetch vendor orders', 500);
    }
};

const getDeliveryAddress = async (req, res) => {
    const { id } = req.params;

    if (parseInt(id) !== req.user.id) {
        return sendError(res, 'Unauthorized', 403);
    }

    try {
        const address = await orderService.getLastDeliveryAddress(id);
        sendSuccess(res, address || {}, 200);
    } catch (error) {
        console.error('Fetch Address Error:', error.message);
        sendError(res, 'Failed to fetch delivery address', 500);
    }
};

const getAllOrdersInternal = async (req, res) => {
    try {
        const pool = require('../config/db');
        const query = `
            SELECT customer_id as user_id, product_id 
            FROM orders
        `;
        const { rows } = await pool.query(query);
        sendSuccess(res, rows, 200);
    } catch (error) {
        console.error('Fetch Internal Orders Error:', error.message);
        sendError(res, 'Failed to fetch all orders', 500);
    }
};

const getAllOrdersAdmin = async (req, res) => {
    try {
        const orders = await orderService.getAllOrdersAdmin();
        sendSuccess(res, orders, 200);
    } catch (error) {
        console.error('Fetch Admin Orders Error:', error.message);
        sendError(res, 'Failed to fetch all orders', 500);
    }
};

const updateOrderAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        const order = await orderService.updateOrderAdmin(id, req.body);
        if (!order) return sendError(res, 'Order not found', 404);
        sendSuccess(res, order, 200);
    } catch (error) {
        console.error('Admin Update Order Error:', error.message);
        sendError(res, 'Failed to update order', 500);
    }
};

const deleteOrderAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        const order = await orderService.deleteOrderAdmin(id);
        if (!order) return sendError(res, 'Order not found', 404);
        sendSuccess(res, { message: 'Order deleted successfully', order }, 200);
    } catch (error) {
        console.error('Admin Delete Order Error:', error.message);
        sendError(res, 'Failed to delete order', 500);
    }
};

const payOrder = async (req, res) => {
    const { id } = req.params; // order id
    const customer_id = req.user.id; // From JWT

    try {
        const updatedOrder = await orderService.payOrder(id, customer_id);
        sendSuccess(res, updatedOrder, 200);
    } catch (error) {
        console.error('Payment Error:', error.message);
        
        if (error.message.includes('Unauthorized')) {
            return sendError(res, error.message, 403);
        }
        if (error.message.includes('not pending') || error.message.includes('Cannot change status')) {
            return sendError(res, error.message, 400);
        }
        if (error.message.includes('not found')) {
            return sendError(res, error.message, 404);
        }

        sendError(res, 'Failed to pay/confirm order', 500);
    }
};

const getShopOrderStats = async (req, res) => {
    try {
        const stats = await orderService.getShopOrderStats();
        sendSuccess(res, stats, 200);
    } catch (error) {
        console.error('Fetch Shop Order Stats Error:', error.message);
        sendError(res, 'Failed to fetch shop order stats', 500);
    }
};

module.exports = {
    placeOrder,
    updateStatus,
    getCustomerOrders,
    getVendorOrders,
    getDeliveryAddress,
    getAllOrdersInternal,
    getAllOrdersAdmin,
    updateOrderAdmin,
    deleteOrderAdmin,
    payOrder,
    getShopOrderStats
};
