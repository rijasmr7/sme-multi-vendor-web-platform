const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // 1. Read token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 2. Verify token using secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-for-beginners');
        
        // 3. Extract userId from token
        // 4. Attach userId to request
        req.userId = decoded.id;
        
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
    }
};

module.exports = authMiddleware;
