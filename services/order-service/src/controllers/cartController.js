const cartService = require('../services/cartService');
const { sendSuccess, sendError } = require('../utils/response');

const addToCart = async (req, res) => {
    const customer_id = req.user.id;
    const { vendor_id, shop_id, product_id, quantity, unit_price } = req.body;

    if (!vendor_id || !shop_id || !product_id || quantity === undefined) {
        return sendError(res, 'vendor_id, shop_id, product_id, and quantity are required', 400);
    }

    if (quantity <= 0) {
        return sendError(res, 'Quantity must be greater than 0', 400);
    }

    try {
        const cartItem = await cartService.addToCart({
            customer_id,
            vendor_id,
            shop_id,
            product_id,
            quantity,
            unit_price
        });
        sendSuccess(res, cartItem, 201);
    } catch (error) {
        console.error('Add to Cart Error:', error.message);
        sendError(res, 'Failed to add item to cart: ' + error.message, 500);
    }
};

const getCustomerCart = async (req, res) => {
    const { id } = req.params; // customer id

    if (parseInt(id) !== req.user.id) {
        return sendError(res, 'Unauthorized to view this cart', 403);
    }

    try {
        const cartItems = await cartService.getCartByCustomer(id);
        sendSuccess(res, cartItems, 200);
    } catch (error) {
        console.error('Fetch Cart Error:', error.message);
        sendError(res, 'Failed to fetch cart', 500);
    }
};

const updateCartItem = async (req, res) => {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const customer_id = req.user.id;

    if (quantity === undefined || quantity <= 0) {
        return sendError(res, 'Valid quantity is required', 400);
    }

    try {
        const updatedItem = await cartService.updateCartItemQuantity(itemId, customer_id, quantity);
        sendSuccess(res, updatedItem, 200);
    } catch (error) {
        console.error('Update Cart Item Error:', error.message);
        if (error.message.includes('not found or unauthorized')) {
            return sendError(res, error.message, 404);
        }
        sendError(res, 'Failed to update cart item', 500);
    }
};

const removeCartItem = async (req, res) => {
    const { itemId } = req.params;
    const customer_id = req.user.id;

    try {
        await cartService.removeCartItem(itemId, customer_id);
        sendSuccess(res, { message: 'Item removed from cart' }, 200);
    } catch (error) {
        console.error('Remove Cart Item Error:', error.message);
        if (error.message.includes('not found or unauthorized')) {
            return sendError(res, error.message, 404);
        }
        sendError(res, 'Failed to remove cart item', 500);
    }
};

const clearCustomerCart = async (req, res) => {
    const { id } = req.params; // customer id

    if (parseInt(id) !== req.user.id) {
        return sendError(res, 'Unauthorized to clear this cart', 403);
    }

    try {
        await cartService.clearCart(id);
        sendSuccess(res, { message: 'Cart cleared' }, 200);
    } catch (error) {
        console.error('Clear Cart Error:', error.message);
        sendError(res, 'Failed to clear cart', 500);
    }
};

module.exports = {
    addToCart,
    getCustomerCart,
    updateCartItem,
    removeCartItem,
    clearCustomerCart
};
