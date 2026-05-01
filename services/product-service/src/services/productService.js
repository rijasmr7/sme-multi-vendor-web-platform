const pool = require('../config/db');

/**
 * SERVICE LAYER: Business logic and DB interactions for products.
 */

const getAllProducts = async () => {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY id DESC;');
    return rows;
};

const getProductsByVendor = async (vendorId) => {
    const { rows } = await pool.query('SELECT * FROM products WHERE vendor_id = $1 ORDER BY id DESC;', [vendorId]);
    return rows;
};

const createProduct = async (productData) => {
    const { vendorId, name, price, category, description, extraData } = productData;
    const query = `
        INSERT INTO products (vendor_id, name, price, category, description, extra_data)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [vendorId, name, price, category, description || null, extraData ? JSON.stringify(extraData) : null]);
    return rows[0];
};

const updateProduct = async (id, updateData) => {
    const { name, price, category, description, extraData } = updateData;
    const query = `
        UPDATE products 
        SET name = COALESCE($1, name),
            price = COALESCE($2, price),
            category = COALESCE($3, category),
            description = COALESCE($4, description),
            extra_data = COALESCE($5, extra_data)
        WHERE id = $6
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [name, price, category, description, extraData ? JSON.stringify(extraData) : null, id]);
    return rows[0];
};

const deleteProduct = async (id) => {
    const { rows } = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *;', [id]);
    return rows[0];
};

module.exports = {
    getAllProducts,
    getProductsByVendor,
    createProduct,
    updateProduct,
    deleteProduct
};
