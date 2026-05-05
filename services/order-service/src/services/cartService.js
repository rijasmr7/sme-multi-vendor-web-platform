const pool = require('../config/db');
const axios = require('axios');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product:5001';

const addToCart = async ({ customer_id, vendor_id, shop_id, product_id, quantity, unit_price: requested_price }) => {
    let unit_price = 0;

    try {
        const response = await axios.get(`${PRODUCT_SERVICE_URL}/products/${product_id}`);
        unit_price = response.data.data.price;
    } catch (error) {
        console.warn(`Product ${product_id} not in catalog. Using provided/fallback price.`);
        unit_price = requested_price || 10.00;
    }

    // Check if the item already exists in the cart for this customer and shop
    const checkQuery = `SELECT * FROM cart WHERE customer_id = $1 AND shop_id = $2 AND product_id = $3`;
    const { rows: existingRows } = await pool.query(checkQuery, [customer_id, shop_id, product_id]);

    if (existingRows.length > 0) {
        // Update quantity
        const cartItem = existingRows[0];
        const newQuantity = cartItem.quantity + quantity;
        const total_price = unit_price * newQuantity;

        const updateQuery = `
            UPDATE cart 
            SET quantity = $1, total_price = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *;
        `;
        const { rows: updatedRows } = await pool.query(updateQuery, [newQuantity, total_price, cartItem.id]);
        return updatedRows[0];
    } else {
        // Insert new item
        const total_price = unit_price * quantity;

        const insertQuery = `
            INSERT INTO cart (customer_id, vendor_id, shop_id, product_id, quantity, unit_price, total_price)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const { rows } = await pool.query(insertQuery, [
            customer_id, vendor_id, shop_id, product_id, quantity, unit_price, total_price
        ]);
        return rows[0];
    }
};

const getCartByCustomer = async (customerId) => {
    const query = `SELECT * FROM cart WHERE customer_id = $1 ORDER BY updated_at DESC;`;
    const { rows } = await pool.query(query, [customerId]);
    return rows;
};

const updateCartItemQuantity = async (cartItemId, customerId, quantity) => {
    // Verify ownership
    const checkQuery = `SELECT * FROM cart WHERE id = $1 AND customer_id = $2`;
    const { rows: existingRows } = await pool.query(checkQuery, [cartItemId, customerId]);

    if (existingRows.length === 0) {
        throw new Error('Cart item not found or unauthorized');
    }

    const item = existingRows[0];
    const total_price = item.unit_price * quantity;

    const updateQuery = `
        UPDATE cart 
        SET quantity = $1, total_price = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *;
    `;
    const { rows } = await pool.query(updateQuery, [quantity, total_price, cartItemId]);
    return rows[0];
};

const removeCartItem = async (cartItemId, customerId) => {
    const deleteQuery = `
        DELETE FROM cart 
        WHERE id = $1 AND customer_id = $2
        RETURNING *;
    `;
    const { rows } = await pool.query(deleteQuery, [cartItemId, customerId]);
    if (rows.length === 0) {
        throw new Error('Cart item not found or unauthorized');
    }
    return rows[0];
};

const clearCart = async (customerId) => {
    const deleteQuery = `DELETE FROM cart WHERE customer_id = $1`;
    await pool.query(deleteQuery, [customerId]);
    return { success: true };
};

module.exports = {
    addToCart,
    getCartByCustomer,
    updateCartItemQuantity,
    removeCartItem,
    clearCart
};
