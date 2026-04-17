const express = require('express');
const app = express();
const PORT = 5004;

// Middleware to parse JSON bodies
app.use(express.json());

// In-memory array to store users (for vendors right now)
const users = [];

// 1. POST /register API
app.post('/register', (req, res) => {
    console.log('--- Register Request Received ---');
    console.log('Request Body:', req.body);

    const { name, email, phone, password } = req.body;

    // Simple validation: Name, password, and at least email or phone are required
    if (!name || (!email && !phone) || !password) {
        console.log('Error: Missing required fields');
        return res.status(400).json({ error: 'Name, password, and at least one of email or phone are required' });
    }

    // Check if user already exists via email or phone
    const existingUser = users.find(u => 
        (email && u.email === email) || 
        (phone && u.phone === phone)
    );
    
    if (existingUser) {
         console.log('Error: User already exists with the given email or phone');
         return res.status(400).json({ error: 'User already exists with this email or phone' });
    }

    // Create new user with a unique id (using Date.now() for beginner-friendly simplicity)
    const newUser = {
        id: Date.now().toString(),
        name,
        email: email || null,
        phone: phone || null,
        // WARNING: Storing plain text password for beginner-friendly learning purposes. 
        // In a real application, always hash passwords using a library like bcrypt!
        password 
    };

    // Store in array
    users.push(newUser);
    
    console.log('Success: New Vendor/User created:', newUser);

    // Return created user
    res.status(201).json({ message: 'User registered successfully', user: newUser });
});

// 2. POST /login API
app.post('/login', (req, res) => {
    console.log('--- Login Request Received ---');
    console.log('Request Body:', req.body);

    // Accept either email or phone from the request body
    const { email, phone, password } = req.body;
    
    // Determine the identifier used for login
    const loginIdentifier = email || phone;

    // Simple validation
    if (!loginIdentifier || !password) {
        console.log('Error: Missing required fields');
        return res.status(400).json({ error: 'Email or phone, alongside the password are required' });
    }

    // Check if user exists (match against either email or phone)
    const user = users.find(u => 
        (u.email && u.email === loginIdentifier) || 
        (u.phone && u.phone === loginIdentifier)
    );

    // If user not found, return error
    if (!user) {
        console.log('Error: Invalid credentials (User not found)');
        return res.status(401).json({ error: 'Invalid email/phone or password' });
    }

    // Check if password matches (Plain text comparison for simplicity)
    if (user.password !== password) {
        console.log('Error: Invalid credentials (Password mismatch)');
        return res.status(401).json({ error: 'Invalid email/phone or password' });
    }

    // If valid, return user
    console.log('Success: User logged in:', user);
    res.status(200).json({ message: 'Login successful', user });
});

// Start the server
app.listen(PORT, () => {
    console.log(`User Service is running on http://localhost:${PORT}`);
});
