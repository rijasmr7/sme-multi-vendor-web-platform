const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// CREATE ORDER - Only authenticated customers can place orders
router.post(
    '/',
    authenticateToken,
    authorizeRole('customer'),
    orderController.placeOrder
);

// UPDATE ORDER STATUS - Only authenticated vendors can update
router.put(
    '/:id/status',
    authenticateToken,
    authorizeRole('vendor'),
    orderController.updateStatus
);

// GET CUSTOMER ORDERS
router.get(
    '/customer/:id',
    authenticateToken,
    authorizeRole('customer'),
    orderController.getCustomerOrders
);

// GET CUSTOMER DELIVERY ADDRESS
router.get(
    '/customer/:id/address',
    authenticateToken,
    authorizeRole('customer'),
    orderController.getDeliveryAddress
);

// GET VENDOR ORDERS
router.get(
    '/vendor/:id',
    authenticateToken,
    authorizeRole('vendor'),
    orderController.getVendorOrders
);

module.exports = router;
