const userService = require('../src/services/userService');
const bcrypt = require('bcrypt');
const pool = require('../src/config/db');

jest.mock('bcrypt');
jest.mock('../src/config/db', () => ({
    query: jest.fn()
}));

describe('User Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('findByEmailOrPhone', () => {
        it('should return user by email', async () => {
            const mockUser = [{ id: 1, email: 'test@test.com' }];
            pool.query.mockResolvedValue({ rows: mockUser });
            const result = await userService.findByEmailOrPhone('test@test.com', null);
            expect(pool.query).toHaveBeenCalled();
            expect(result).toEqual(mockUser);
        });
    });

    describe('createUser', () => {
        it('should hash password and create user', async () => {
            const userData = { name: 'Test', email: 'test@test.com', password: 'plain', role: 'vendor' };
            const mockCreatedUser = { id: 1, name: 'Test' };
            
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashed_password');
            pool.query.mockResolvedValue({ rows: [mockCreatedUser] });

            const result = await userService.createUser(userData);

            expect(bcrypt.hash).toHaveBeenCalledWith('plain', 10);
            expect(pool.query).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining(['Test', 'test@test.com', null, 'hashed_password', 'vendor'])
            );
            expect(result).toEqual(mockCreatedUser);
        });
    });

    describe('verifyPassword', () => {
        it('should return true if password matches (bcrypt hash verification)', async () => {
            bcrypt.compare.mockResolvedValue(true);
            const result = await userService.verifyPassword('plain', 'hashed');
            expect(bcrypt.compare).toHaveBeenCalledWith('plain', 'hashed');
            expect(result).toBe(true);
        });

        it('should return false if password does not match', async () => {
            bcrypt.compare.mockResolvedValue(false);
            const result = await userService.verifyPassword('plain', 'hashed');
            expect(result).toBe(false);
        });
    });

    describe('findById', () => {
        it('should return user without password', async () => {
            const mockUser = { id: 1, name: 'Test' };
            pool.query.mockResolvedValue({ rows: [mockUser] });
            const result = await userService.findById(1);
            expect(result).not.toHaveProperty('password');
            expect(result.id).toBe(1);
        });
    });
    
    describe('CRUD operations', () => {
        it('should fetch all users', async () => {
            pool.query.mockResolvedValue({ rows: [{ id: 1 }] });
            const result = await userService.findAllUsers();
            expect(result.length).toBe(1);
        });
        
        it('should delete user', async () => {
            pool.query.mockResolvedValue({ rows: [{ id: 1 }] });
            const result = await userService.deleteUser(1);
            expect(result).toHaveProperty('id', 1);
        });
    });
});
