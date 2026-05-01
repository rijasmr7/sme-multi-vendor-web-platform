const userService = require('../services/userService');
const { sendSuccess, sendError } = require('../utils/response');
const jwt = require('jsonwebtoken');

/**
 * CONTROLLER LAYER: Handles HTTP requests and responses.
 * 
 * Each function here:
 * 1. Reads data from the request (req.body, req.params)
 * 2. Validates the input
 * 3. Calls the Service Layer for business logic
 * 4. Sends back a response
 */

// ---------------------------------------------------------------
// VENDOR REGISTER (existing)
// ---------------------------------------------------------------
const register = async (req, res) => {
    const { name, email, phone, password, role } = req.body;
    
    // 1. Validation
    if (!name || !password || (!email && !phone)) {
        return sendError(res, 'Name, password, and (email or phone) are required', 400);
    }

    if (email && !/\S+@\S+\.\S+/.test(email)) {
        return sendError(res, 'Invalid email format', 400);
    }

    try {
        // 2. Check if user already exists
        const existingUsers = await userService.findByEmailOrPhone(email, phone);
        if (existingUsers.length > 0) {
            return sendError(res, 'User already exists', 400);
        }

        // 3. Create user (password is hashed inside the service)
        const newUser = await userService.createUser({
            name, email, phone, password,
            role: role || 'vendor'
        });
        sendSuccess(res, newUser, 201);
    } catch (error) {
        console.error('Registration Error:', error);
        sendError(res, 'Failed to register user');
    }
};

// ---------------------------------------------------------------
// CUSTOMER REGISTER
// ---------------------------------------------------------------
// Same as vendor register, but forces role = "customer"
const customerRegister = async (req, res) => {
    const { name, email, phone, password } = req.body;

    // 1. Validation
    if (!name) {
        return sendError(res, 'Name is required', 400);
    }
    if (!password) {
        return sendError(res, 'Password is required', 400);
    }
    if (!email && !phone) {
        return sendError(res, 'At least email or phone is required', 400);
    }
    if (email && !/\S+@\S+\.\S+/.test(email)) {
        return sendError(res, 'Invalid email format', 400);
    }
    if (password.length < 6) {
        return sendError(res, 'Password must be at least 6 characters', 400);
    }

    try {
        // 2. Check if user already exists
        const existingUsers = await userService.findByEmailOrPhone(email, phone);
        if (existingUsers.length > 0) {
            return sendError(res, 'A user with this email or phone already exists', 400);
        }

        // 3. Create customer (password gets hashed in service layer)
        const newUser = await userService.createUser({
            name,
            email,
            phone,
            password,
            shop_name: 'Customer Account',
            role: 'customer'
        });

        console.log('✓ Customer registered:', newUser.id, newUser.name);
        sendSuccess(res, newUser, 201);
    } catch (error) {
        console.error('Customer Registration Error:', error);
        sendError(res, 'Failed to register customer');
    }
};

// ---------------------------------------------------------------
// VENDOR LOGIN (existing)
// ---------------------------------------------------------------
const login = async (req, res) => {
    const { email, phone, password } = req.body;
    const identifier = email || phone;

    if (!identifier || !password) {
        return sendError(res, 'Missing credentials', 400);
    }

    try {
        const users = await userService.findByEmailOrPhone(email, phone);
        const user = users[0];

        if (!user) {
            return sendError(res, 'Invalid email/phone or password', 401);
        }

        // Verify password using bcrypt
        const isPasswordValid = await userService.verifyPassword(password, user.password);
        if (!isPasswordValid) {
            return sendError(res, 'Invalid email/phone or password', 401);
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'super-secret-key-for-beginners',
            { expiresIn: '1d' }
        );

        sendSuccess(res, { token });
    } catch (error) {
        console.error('Login Error:', error);
        sendError(res, 'Login failed');
    }
};

// ---------------------------------------------------------------
// CUSTOMER LOGIN
// ---------------------------------------------------------------
// Allows login with email OR phone + password.
// Returns JWT token + user info (without password).
const customerLogin = async (req, res) => {
    const { email, phone, password } = req.body;
    const identifier = email || phone;

    // 1. Validation
    if (!identifier) {
        return sendError(res, 'Email or phone is required', 400);
    }
    if (!password) {
        return sendError(res, 'Password is required', 400);
    }

    try {
        // 2. Find the user
        const users = await userService.findByEmailOrPhone(email, phone);
        const user = users[0];

        if (!user) {
            return sendError(res, 'Invalid credentials. User not found.', 401);
        }

        // 3. Verify password using bcrypt
        const isPasswordValid = await userService.verifyPassword(password, user.password);
        if (!isPasswordValid) {
            return sendError(res, 'Invalid credentials. Wrong password.', 401);
        }

        // 4. Generate JWT token with user id and role
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'super-secret-key-for-beginners',
            { expiresIn: '1d' }  // Token expires in 1 day
        );

        // 5. Return token + user info (never send password back!)
        console.log('✓ Customer logged in:', user.id, user.name);
        sendSuccess(res, {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Customer Login Error:', error);
        sendError(res, 'Login failed');
    }
};

// ---------------------------------------------------------------
// GET USER BY ID
// ---------------------------------------------------------------
const getUser = async (req, res) => {
    const { id } = req.params;
    if (isNaN(id)) return sendError(res, 'Invalid ID format', 400);

    try {
        const user = await userService.findById(id);
        if (!user) return sendError(res, 'User not found', 404);
        sendSuccess(res, user);
    } catch (error) {
        sendError(res, 'Failed to fetch user');
    }
};

// ---------------------------------------------------------------
// GET CURRENT USER PROFILE (Protected route)
// ---------------------------------------------------------------
// Uses req.user (set by authMiddleware) to return the logged-in user's info
const getProfile = async (req, res) => {
    try {
        const user = await userService.findById(req.user.id);
        if (!user) return sendError(res, 'User not found', 404);
        sendSuccess(res, user);
    } catch (error) {
        sendError(res, 'Failed to fetch profile');
    }
};

module.exports = {
    register,
    login,
    getUser,
    customerRegister,
    customerLogin,
    getProfile
};
