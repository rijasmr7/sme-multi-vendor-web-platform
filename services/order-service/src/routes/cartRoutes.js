const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// Add item to cart
router.post(
    '/',
    authenticateToken,
    authorizeRole('customer'),
    cartController.addToCart
);

// Get customer cart
router.get(
    '/customer/:id',
    authenticateToken,
    authorizeRole('customer'),
    cartController.getCustomerCart
);

// Update cart item quantity
router.put(
    '/item/:itemId',
    authenticateToken,
    authorizeRole('customer'),
    cartController.updateCartItem
);

// Remove item from cart
router.delete(
    '/item/:itemId',
    authenticateToken,
    authorizeRole('customer'),
    cartController.removeCartItem
);

// Clear cart
router.delete(
    '/customer/:id',
    authenticateToken,
    authorizeRole('customer'),
    cartController.clearCustomerCart
);

module.exports = router;
