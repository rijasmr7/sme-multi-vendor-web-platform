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

    // Send order_created event asynchronously to Analytics Service
    const analyticsUrl = process.env.ANALYTICS_SERVICE_URL || 'http://analytics:5003';
    axios.post(`${analyticsUrl}/events/test`, {
        event_type: 'order_created',
        vendor_id: String(vendor_id),
        product_id: String(product_id),
        user_id: String(customer_id),
        quantity: quantity,
        price: total_price
    }).catch(err => {
        console.error(`[Order Service] Failed to send order_created event to analytics:`, err.message);
    });
    
    return order;
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

const getAllOrdersAdmin = async () => {
    const query = `
        SELECT o.*, 
               da.customer_name, da.customer_phone, da.address_line, da.city, da.zip_code
        FROM orders o
        LEFT JOIN delivery_address da ON o.id = da.order_id
        ORDER BY o.created_at DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
};

const updateOrderAdmin = async (orderId, updateData) => {
    const { status, quantity, total_price, delivery_type, customer_name, customer_phone, address_line, city, zip_code } = updateData;
    
    // Update order
    const query = `
        UPDATE orders
        SET status = COALESCE($1, status),
            quantity = COALESCE($2, quantity),
            total_price = COALESCE($3, total_price),
            delivery_type = COALESCE($4, delivery_type),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [status, quantity, total_price, delivery_type, orderId]);
    const order = rows[0];

    if (order && (customer_name || customer_phone || address_line || city || zip_code)) {
        // Update delivery address
        const addressQuery = `
            UPDATE delivery_address
            SET customer_name = COALESCE($1, customer_name),
                customer_phone = COALESCE($2, customer_phone),
                address_line = COALESCE($3, address_line),
                city = COALESCE($4, city),
                zip_code = COALESCE($5, zip_code)
            WHERE order_id = $6
            RETURNING *;
        `;
        await pool.query(addressQuery, [customer_name, customer_phone, address_line, city, zip_code, orderId]);
    }
    return order;
};

const deleteOrderAdmin = async (orderId) => {
    const query = `DELETE FROM orders WHERE id = $1 RETURNING *;`;
    const { rows } = await pool.query(query, [orderId]);
    return rows[0];
};

module.exports = {
    createOrder,
    updateOrderStatus,
    getOrdersByCustomer,
    getOrdersByVendor,
    getLastDeliveryAddress,
    getAllOrdersAdmin,
    updateOrderAdmin,
    deleteOrderAdmin
};
