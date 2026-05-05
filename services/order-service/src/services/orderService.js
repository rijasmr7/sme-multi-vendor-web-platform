const pool = require('../config/db');
const axios = require('axios');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product:5001';

const createOrder = async ({ customer_id, vendor_id, shop_id, product_id, quantity, unit_price: requested_price, delivery_type, customer_name, customer_phone, address_line, city, zip_code }) => {
    let unit_price = 0;

    // 1. Try to fetch the "Official" price from Product Service first (Security Best Practice)
    try {
        const response = await axios.get(`${PRODUCT_SERVICE_URL}/products/${product_id}`);
        // If product exists in catalog, we use the catalog price
        unit_price = response.data.data.price;
    } catch (error) {
        console.warn(`Product ${product_id} not in catalog. Using provided/fallback price.`);
        // 2. If not in catalog, use the price sent by the frontend (useful for AI-generated mock products)
        // or fallback to 10.00 if nothing was provided.
        unit_price = requested_price || 10.00;
    }

    const total_price = unit_price * quantity;

    const query = `
        INSERT INTO orders (customer_id, vendor_id, shop_id, product_id, quantity, unit_price, total_price, status, delivery_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
        RETURNING *;
    `;
    
    const { rows } = await pool.query(query, [
        customer_id, vendor_id, shop_id, product_id, quantity, unit_price, total_price, delivery_type
    ]);
    
    const order = rows[0];

    // Insert delivery address
    const addressQuery = `
        INSERT INTO delivery_address (order_id, customer_id, customer_name, customer_phone, address_line, city, zip_code)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
    `;
    await pool.query(addressQuery, [
        order.id, customer_id, customer_name, customer_phone, address_line, city, zip_code
    ]);
    
    return rows[0];
};

const updateOrderStatus = async (orderId, vendorId, newStatus) => {
    // 1. Fetch current order to check existence and ownership
    const checkQuery = `SELECT status, vendor_id FROM orders WHERE id = $1`;
    const { rows } = await pool.query(checkQuery, [orderId]);
    
    if (rows.length === 0) {
        throw new Error('Order not found');
    }

    const order = rows[0];

    // Verify ownership
    if (order.vendor_id !== parseInt(vendorId)) {
        throw new Error('Unauthorized: You do not own this order');
    }

    const currentStatus = order.status;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'ready_for_pickup', 'delivered'];

    if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}`);
    }

    // Optional: Validate transitions (e.g. cannot change if cancelled)
    if (currentStatus === 'cancelled' || currentStatus === 'completed') {
        throw new Error(`Cannot change status of a ${currentStatus} order`);
    }

    const updateQuery = `
        UPDATE orders 
        SET status = $1 
        WHERE id = $2 
        RETURNING *;
    `;
    const updated = await pool.query(updateQuery, [newStatus, orderId]);
    return updated.rows[0];
};

const getOrdersByCustomer = async (customerId, status, date) => {
    let query = `SELECT * FROM orders WHERE customer_id = $1`;
    const params = [customerId];
    let paramCount = 1;

    if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
    }
    
    // date filter example: expecting 'YYYY-MM-DD'
    if (date) {
        paramCount++;
        query += ` AND DATE(created_at) = $${paramCount}`;
        params.push(date);
    }

    query += ` ORDER BY created_at DESC;`;

    const { rows } = await pool.query(query, params);
    return rows;
};

const getOrdersByVendor = async (vendorId, status, date) => {
    let query = `SELECT * FROM orders WHERE vendor_id = $1`;
    const params = [vendorId];
    let paramCount = 1;

    if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
    }
    
    if (date) {
        paramCount++;
        query += ` AND DATE(created_at) = $${paramCount}`;
        params.push(date);
    }

    query += ` ORDER BY created_at DESC;`;

    const { rows } = await pool.query(query, params);
    return rows;
};

const getLastDeliveryAddress = async (customerId) => {
    const query = `
        SELECT * FROM delivery_address 
        WHERE customer_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1;
    `;
    const { rows } = await pool.query(query, [customerId]);
    return rows.length > 0 ? rows[0] : null;
};

module.exports = {
    createOrder,
    updateOrderStatus,
    getOrdersByCustomer,
    getOrdersByVendor,
    getLastDeliveryAddress
};
