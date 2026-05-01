const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');

// ---------------------------------------------------------------
// JWT AUTHENTICATION MIDDLEWARE
// ---------------------------------------------------------------
// HOW IT WORKS:
// 1. Client sends a request with header: Authorization: Bearer <token>
// 2. This middleware reads the token from the header
// 3. It verifies the token using the same secret key used to sign it
// 4. If valid, it attaches the decoded user data to `req.user`
// 5. The next route handler can then use `req.user` to know WHO is making the request

const authenticateToken = (req, res, next) => {
    // Step 1: Get the Authorization header
    const authHeader = req.headers['authorization'];

    // Step 2: Extract the token (format: "Bearer <token>")
    const token = authHeader && authHeader.split(' ')[1];

    // Step 3: If no token was provided, reject the request
    if (!token) {
        return sendError(res, 'Access denied. No token provided.', 401);
    }

    try {
        // Step 4: Verify the token using our secret key
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'super-secret-key-for-beginners'
        );

        // Step 5: Attach decoded user info to the request object
        // Now any route handler after this can access req.user
        req.user = decoded; // Contains: { id, role, iat, exp }

        // Step 6: Continue to the next middleware / route handler
        next();
    } catch (error) {
        // Token is expired or invalid
        return sendError(res, 'Invalid or expired token.', 403);
    }
};

// ---------------------------------------------------------------
// ROLE-BASED AUTHORIZATION MIDDLEWARE
// ---------------------------------------------------------------
// Use AFTER authenticateToken to restrict routes to specific roles.
// Example: authorizeRole('customer') → only customers can access this route

const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return sendError(res, 'Authentication required.', 401);
        }

        if (!allowedRoles.includes(req.user.role)) {
            return sendError(res, 'You do not have permission to access this resource.', 403);
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRole
};
