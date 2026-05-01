const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = 5004;

app.use(express.json());

// 1. Database Connection Setup
// We use a "Pool" which manages multiple database connections dynamically.
const pool = new Pool({
    user: process.env.DB_USER || 'admin',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'user_db',
    password: process.env.DB_PASSWORD || 'secretpassword',
    port: process.env.DB_PORT || 5432,
});

pool.on('connect', () => {
    console.log('Connected to PostgreSQL Database (user_db)');
});

// --- API RESPONSE HELPERS ---
const sendSuccess = (res, data, status = 200) => {
    res.status(status).json({ success: true, data });
};

const sendError = (res, message, status = 500) => {
    res.status(status).json({ success: false, message });
};

// --- VALIDATION HELPERS ---
const isValidEmail = (email) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
};


// 2. Initialize the Users Table Automatically on Start
const createTableQuery = `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password TEXT NOT NULL
);
`;

pool.query(createTableQuery)
    .then(() => console.log('Users table checked/created successfully!'))
    .catch(err => console.error('Error creating table:', err));


app.post('/register', async (req, res) => {
    console.log('--- Register Request Received ---');
    const { name, email, phone, password } = req.body;

    // 1. Required Field Validation
    if (!name || !password || (!email && !phone)) {
        return sendError(res, 'Name, password, and at least (email or phone) are required', 400);
    }

    // 2. Type/Format Validation
    if (email && !isValidEmail(email)) {
        return sendError(res, 'Invalid email format', 400);
    }

    if (name.length < 2) {
        return sendError(res, 'Name must be at least 2 characters', 400);
    }

    try {
        // Check for existing user
        const checkUserQuery = `SELECT * FROM users WHERE (email IS NOT NULL AND email = $1) OR (phone IS NOT NULL AND phone = $2);`;
        const { rows: existingUsers } = await pool.query(checkUserQuery, [email || null, phone || null]);

        if (existingUsers.length > 0) {
            return sendError(res, 'A user with this email or phone already exists', 400);
        }

        const insertUserQuery = `
            INSERT INTO users (name, email, phone, password)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, phone;
        `;
        const { rows: newUsers } = await pool.query(insertUserQuery, [name, email, phone, password]);
        
        console.log('Success: New User created:', newUsers[0]);
        sendSuccess(res, newUsers[0], 201);

    } catch (error) {
        console.error('Registration Error:', error);
        sendError(res, 'Database error during registration');
    }
});


app.post('/login', async (req, res) => {
    const { email, phone, password } = req.body;
    const identifier = email || phone;

    if (!identifier || !password) {
        return sendError(res, 'Missing credentials', 400);
    }

    try {
        const query = `SELECT * FROM users WHERE email = $1 OR phone = $1;`;
        const { rows } = await pool.query(query, [identifier]);
        
        if (rows.length === 0 || rows[0].password !== password) {
            return sendError(res, 'Invalid credentials', 401);
        }

        const user = { ...rows[0] };
        delete user.password; // Don't send password back

        sendSuccess(res, user);
    } catch (error) {
        sendError(res, 'Database error during login');
    }
});

app.get('/users/:id', async (req, res) => {
    const { id } = req.params;
    
    // Validate that ID is a number
    if (isNaN(id)) {
        return sendError(res, 'Invalid user ID format', 400);
    }

    try {
        const query = `SELECT id, name, email, phone FROM users WHERE id = $1;`;
        const { rows } = await pool.query(query, [id]);
        
        if (rows.length === 0) {
            return sendError(res, 'User not found', 404);
        }
        
        sendSuccess(res, rows[0]);
    } catch (error) {
        sendError(res, 'Error fetching user data');
    }
});

// --- GLOBAL ERROR MIDDLEWARE ---
app.use((err, req, res, next) => {
    console.error('Unexpected Global Error:', err);
    sendError(res, 'An unexpected server error occurred');
});


// Start the server
app.listen(PORT, () => {
    console.log(`User Service is running on http://localhost:${PORT}`);
});
