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


// 3. POST /register API
app.post('/register', async (req, res) => {
    console.log('--- Register Request Received ---');
    console.log('Request Body:', req.body);

    const { name, email, phone, password } = req.body;

    // Simple validation
    if (!name || (!email && !phone) || !password) {
        return res.status(400).json({ error: 'Name, password, and at least one of email or phone are required' });
    }

    try {
        // Parameterized query ($1, $2) to prevent SQL Injection
        const checkUserQuery = `
            SELECT * FROM users 
            WHERE email = $1 OR phone = $2;
        `;
        
        // Wait for the query to finish using "await"
        const { rows: existingUsers } = await pool.query(checkUserQuery, [email, phone]);

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'User already exists with this email or phone' });
        }

        // Insert new user query
        const insertUserQuery = `
            INSERT INTO users (name, email, phone, password)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        // RETURNING * gives us the newly created row including its generated ID

        const { rows: newUsers } = await pool.query(insertUserQuery, [name, email, phone, password]);
        const newUser = newUsers[0];

        console.log('Success: New User created:', newUser);
        res.status(201).json({ message: 'User registered successfully', user: newUser });

    } catch (error) {
        console.error('Database Error during registration:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 4. POST /login API
app.post('/login', async (req, res) => {
    console.log('--- Login Request Received ---');
    console.log('Request Body:', req.body);

    const { email, phone, password } = req.body;
    const loginIdentifier = email || phone;

    if (!loginIdentifier || !password) {
        return res.status(400).json({ error: 'Email or phone, alongside the password are required' });
    }

    try {
        // Find user by either email or phone
        const findUserQuery = `
            SELECT * FROM users 
            WHERE email = $1 OR phone = $1;
        `;
        
        const { rows } = await pool.query(findUserQuery, [loginIdentifier]);
        
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email/phone or password' });
        }

        const user = rows[0];

        // Check password match (Plain text for beginner-friendly illustration)
        // Note: In real apps, ALWAYS use bcrypt!
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid email/phone or password' });
        }

        console.log('Success: User logged in:', user);
        res.status(200).json({ message: 'Login successful', user });

    } catch (error) {
        console.error('Database Error during login:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 5. GET /users/:id API
app.get('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `SELECT id, name, email, phone FROM users WHERE id = $1;`;
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`User Service is running on http://localhost:${PORT}`);
});
