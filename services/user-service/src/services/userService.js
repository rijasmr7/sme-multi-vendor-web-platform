const pool = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * SERVICE LAYER: Focuses purely on data retrieval and business rules.
 * 
 * This layer handles:
 * - Database queries
 * - Password hashing (bcrypt)
 * - Data formatting
 */

// ---------------------------------------------------------------
// FIND USER BY EMAIL OR PHONE
// ---------------------------------------------------------------
// Used during registration (to check duplicates) and login (to find the user).
const findByEmailOrPhone = async (email, phone) => {
    const query = `
        SELECT * FROM users 
        WHERE (email IS NOT NULL AND email = $1) 
           OR (phone IS NOT NULL AND phone = $2);
    `;
    const { rows } = await pool.query(query, [email || null, phone || null]);
    return rows;
};

// ---------------------------------------------------------------
// FIND USER BY ID
// ---------------------------------------------------------------
const findById = async (id) => {
    const query = `SELECT id, name, email, phone, shop_name, role, city FROM users WHERE id = $1;`;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
};

// ---------------------------------------------------------------
// FIND ALL USERS (For AI Recommendations)
// ---------------------------------------------------------------
const findAllUsers = async () => {
    const query = `SELECT id, city FROM users;`;
    const { rows } = await pool.query(query);
    return rows;
};

// ---------------------------------------------------------------
// CREATE A NEW USER (Vendor or Customer)
// ---------------------------------------------------------------
// - Hashes the password before saving to the database
// - Returns the new user WITHOUT the password
const createUser = async (userData) => {
    const { name, email, phone, shop_name, password, role, city } = userData;

    // Hash the password using bcrypt (10 salt rounds)
    // This converts "myPassword123" → "$2b$10$..." (irreversible hash)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const query = `
        INSERT INTO users (name, email, phone, shop_name, password, role, city)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, name, email, phone, shop_name, role, city;
    `;
    const { rows } = await pool.query(query, [
        name,
        email || null,
        phone || null,
        shop_name || 'My Shop',
        hashedPassword,  // Store the HASHED password, never the plain text
        role || 'vendor',
        city || 'Unknown'
    ]);
    return rows[0];
};

// ---------------------------------------------------------------
// VERIFY PASSWORD
// ---------------------------------------------------------------
// Compares a plain-text password with the hashed password from the database.
// bcrypt.compare handles the hashing internally and returns true/false.
const verifyPassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};

const findAllUsersAdmin = async () => {
    const query = `SELECT id, name, email, phone, shop_name, role, city FROM users ORDER BY id DESC;`;
    const { rows } = await pool.query(query);
    return rows;
};

const updateUser = async (id, userData) => {
    const { name, email, phone, shop_name, role, city, password } = userData;
    let query;
    let params;
    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        query = `
            UPDATE users 
            SET name = $1, email = $2, phone = $3, shop_name = $4, role = $5, city = $6, password = $7
            WHERE id = $8
            RETURNING id, name, email, phone, shop_name, role, city;
        `;
        params = [name, email || null, phone || null, shop_name || 'My Shop', role || 'vendor', city || 'Unknown', hashedPassword, id];
    } else {
        query = `
            UPDATE users 
            SET name = $1, email = $2, phone = $3, shop_name = $4, role = $5, city = $6
            WHERE id = $7
            RETURNING id, name, email, phone, shop_name, role, city;
        `;
        params = [name, email || null, phone || null, shop_name || 'My Shop', role || 'vendor', city || 'Unknown', id];
    }
    const { rows } = await pool.query(query, params);
    return rows[0];
};

const deleteUser = async (id) => {
    const query = `DELETE FROM users WHERE id = $1 RETURNING id, name;`;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
};

module.exports = {
    findByEmailOrPhone,
    findById,
    createUser,
    verifyPassword,
    findAllUsers,
    findAllUsersAdmin,
    updateUser,
    deleteUser
};
