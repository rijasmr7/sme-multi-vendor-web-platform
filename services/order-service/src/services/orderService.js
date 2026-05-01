const pool = require('../config/db');

const createOrder = async (orderData) => {
    const { customer_id, shop_id, product_id, quantity, total_price } = orderData;
    const query = `
        INSERT INTO orders (customer_id, shop_id, product_id, quantity, total_price)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [customer_id, shop_id, product_id, quantity, total_price]);
    return rows[0];
};

const getOrdersByCustomer = async (customerId) => {
    const query = `SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC;`;
    const { rows } = await pool.query(query, [customerId]);
    return rows;
};

module.exports = {
    createOrder,
    getOrdersByCustomer
};
