const userController = require('../src/controllers/userController');
const userService = require('../src/services/userService');
const jwt = require('jsonwebtoken');
const { sendSuccess, sendError } = require('../src/utils/response');

jest.mock('../src/services/userService');
jest.mock('jsonwebtoken');
jest.mock('../src/utils/response', () => ({
    sendSuccess: jest.fn(),
    sendError: jest.fn()
}));

describe('User Controller', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = { body: {}, params: {}, user: {} };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should return error if required fields are missing', async () => {
            mockReq.body = { name: 'Test' };
            await userController.register(mockReq, mockRes);
            expect(sendError).toHaveBeenCalledWith(mockRes, 'Name, password, and (email or phone) are required', 400);
        });

        it('should return error for invalid email', async () => {
            mockReq.body = { name: 'Test', password: 'pass', email: 'invalid' };
            await userController.register(mockReq, mockRes);
            expect(sendError).toHaveBeenCalledWith(mockRes, 'Invalid email format', 400);
        });

        it('should reject duplicate email (duplicate email rejection)', async () => {
            mockReq.body = { name: 'Test', email: 'test@test.com', password: 'password123' };
            userService.findByEmailOrPhone.mockResolvedValue([{ id: 1 }]); 
            
            await userController.register(mockReq, mockRes);
            
            expect(sendError).toHaveBeenCalledWith(mockRes, 'User already exists', 400);
        });

        it('should assign role correctly (role assignment)', async () => {
            mockReq.body = { name: 'Test', email: 'new@test.com', password: 'password123', role: 'vendor' };
            userService.findByEmailOrPhone.mockResolvedValue([]); 
            userService.createUser.mockResolvedValue({ id: 2, role: 'vendor' });
            
            await userController.register(mockReq, mockRes);
            
            expect(userService.createUser).toHaveBeenCalledWith(expect.objectContaining({ role: 'vendor' }));
            expect(sendSuccess).toHaveBeenCalledWith(mockRes, { id: 2, role: 'vendor' }, 201);
        });
    });

    describe('customerRegister', () => {
        it('should assign customer role automatically', async () => {
            mockReq.body = { name: 'Cust', email: 'c@c.com', password: 'password123' };
            userService.findByEmailOrPhone.mockResolvedValue([]); 
            userService.createUser.mockResolvedValue({ id: 3, role: 'customer' });

            await userController.customerRegister(mockReq, mockRes);

            expect(userService.createUser).toHaveBeenCalledWith(expect.objectContaining({ role: 'customer' }));
            expect(sendSuccess).toHaveBeenCalledWith(mockRes, { id: 3, role: 'customer' }, 201);
        });
    });

    describe('login', () => {
        it('should return error if credentials missing', async () => {
            await userController.login(mockReq, mockRes);
            expect(sendError).toHaveBeenCalledWith(mockRes, 'Missing credentials', 400);
        });

        it('should verify password (bcrypt mock check)', async () => {
            mockReq.body = { email: 'test@test.com', password: 'wrong' };
            userService.findByEmailOrPhone.mockResolvedValue([{ id: 1, password: 'hashed' }]);
            userService.verifyPassword.mockResolvedValue(false);
            
            await userController.login(mockReq, mockRes);
            
            expect(userService.verifyPassword).toHaveBeenCalledWith('wrong', 'hashed');
            expect(sendError).toHaveBeenCalledWith(mockRes, 'Invalid email/phone or password', 401);
        });

        it('should generate JWT token (JWT sign verify)', async () => {
            mockReq.body = { email: 'test@test.com', password: 'correct' };
            userService.findByEmailOrPhone.mockResolvedValue([{ id: 1, role: 'vendor', password: 'hashed' }]);
            userService.verifyPassword.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mock-token');
            
            await userController.login(mockReq, mockRes);
            
            expect(jwt.sign).toHaveBeenCalled();
            expect(sendSuccess).toHaveBeenCalledWith(mockRes, { token: 'mock-token' });
        });
    });

    describe('customerLogin', () => {
        it('should login customer and return token and user info', async () => {
            mockReq.body = { email: 'test@test.com', password: 'correct' };
            userService.findByEmailOrPhone.mockResolvedValue([{ id: 1, name: 'Test', role: 'customer', password: 'hashed' }]);
            userService.verifyPassword.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mock-token-cust');

            await userController.customerLogin(mockReq, mockRes);

            expect(sendSuccess).toHaveBeenCalledWith(mockRes, {
                token: 'mock-token-cust',
                user: { id: 1, name: 'Test', email: undefined, phone: undefined }
            });
        });
    });

    describe('getUser', () => {
        it('should return error for invalid id', async () => {
            mockReq.params = { id: 'abc' };
            await userController.getUser(mockReq, mockRes);
            expect(sendError).toHaveBeenCalledWith(mockRes, 'Invalid ID format', 400);
        });
    });

    describe('getProfile', () => {
        it('should return user profile', async () => {
            mockReq.user = { id: 1 };
            userService.findById.mockResolvedValue({ id: 1, name: 'Test' });
            await userController.getProfile(mockReq, mockRes);
            expect(sendSuccess).toHaveBeenCalledWith(mockRes, { id: 1, name: 'Test' });
        });
    });
});
