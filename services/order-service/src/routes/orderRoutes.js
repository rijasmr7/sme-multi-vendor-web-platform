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

// PAY FOR ORDER
router.put(
    '/:id/pay',
    authenticateToken,
    authorizeRole('customer'),
    orderController.payOrder
);

// GET ORDER COUNT PER SHOP FOR LANDING PAGE
router.get(
    '/public/stats/shops',
    orderController.getShopOrderStats
);

// INTERNAL: GET ALL ORDERS FOR AI SVD
router.get(
    '/internal/all',
    orderController.getAllOrdersInternal
);

// --- ADMIN ROUTES ---
router.get(
    '/admin/orders',
    authenticateToken,
    authorizeRole('admin'),
    orderController.getAllOrdersAdmin
);

router.put(
    '/admin/orders/:id',
    authenticateToken,
    authorizeRole('admin'),
    orderController.updateOrderAdmin
);

router.delete(
    '/admin/orders/:id',
    authenticateToken,
    authorizeRole('admin'),
    orderController.deleteOrderAdmin
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
