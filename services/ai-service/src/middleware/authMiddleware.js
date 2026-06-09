const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return sendError(res, 'Access denied. No token provided.', 401);
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'super-secret-key-for-beginners'
        );
        req.user = decoded; // { id, role, iat, exp }
        next();
    } catch (error) {
        return sendError(res, 'Invalid or expired token.', 403);
    }
};

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
