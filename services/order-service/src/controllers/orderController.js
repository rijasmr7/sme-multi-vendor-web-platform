const orderService = require('../services/orderService');
const { sendSuccess, sendError } = require('../utils/response');

const placeOrder = async (req, res) => {
    const { customer_id, shop_id, product_id, quantity, total_price } = req.body;

    if (!customer_id || !shop_id || !product_id || !quantity || !total_price) {
        return sendError(res, 'All order fields are required', 400);
    }

    try {
        const order = await orderService.createOrder({ customer_id, shop_id, product_id, quantity, total_price });
        sendSuccess(res, order, 201);
    } catch (error) {
        console.error('Order Error:', error);
        sendError(res, 'Failed to place order');
    }
};

const getCustomerOrders = async (req, res) => {
    const { customerId } = req.params;
    try {
        const orders = await orderService.getOrdersByCustomer(customerId);
        sendSuccess(res, orders);
    } catch (error) {
        sendError(res, 'Failed to fetch orders');
    }
};

module.exports = {
    placeOrder,
    getCustomerOrders
};
