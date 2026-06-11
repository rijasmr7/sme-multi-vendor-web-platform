const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

/**
 * ROUTE LAYER: Maps URL endpoints to controller functions.
 * 
 * PUBLIC ROUTES (no token needed):
 *   POST /register           → Vendor registration
 *   POST /login              → Vendor login
 *   POST /customer/register  → Customer registration
 *   POST /customer/login     → Customer login
 * 
 * PROTECTED ROUTES (token required):
 *   GET /profile             → Get logged-in user's profile
 *   GET /:id                 → Get any user by ID
 */

// --- PUBLIC ROUTES ---
router.post('/register', userController.register);
router.post('/login', userController.login);

router.post('/customer/register', userController.customerRegister);
router.post('/customer/login', userController.customerLogin);

// --- INTERNAL ROUTES ---
router.get('/internal/:id', userController.getInternalUser);
router.get('/internal-bulk/users', userController.getAllUsersInternal);

// --- PROTECTED ROUTES ---
// These routes require a valid JWT token in the Authorization header
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);
router.delete('/profile', authenticateToken, userController.deleteProfile);

// --- ADMIN ROUTES ---
router.get('/admin/users', authenticateToken, authorizeRole('admin'), userController.getAllUsersAdmin);
router.post('/admin/users', authenticateToken, authorizeRole('admin'), userController.createUserAdmin);
router.put('/admin/users/:id', authenticateToken, authorizeRole('admin'), userController.updateUserAdmin);
router.delete('/admin/users/:id', authenticateToken, authorizeRole('admin'), userController.deleteUserAdmin);

router.get('/:id', userController.getUser);

module.exports = router;
