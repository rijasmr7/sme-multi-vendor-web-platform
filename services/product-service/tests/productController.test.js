const productController = require('../src/controllers/productController');
const productService = require('../src/services/productService');
const axios = require('axios');
const { sendSuccess, sendError } = require('../src/utils/response');

jest.mock('../src/services/productService');
jest.mock('axios');
jest.mock('../src/utils/response', () => ({
    sendSuccess: jest.fn(),
    sendError: jest.fn()
}));

describe('Product Controller', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = { body: {}, params: {}, userId: '1' };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('createProduct', () => {
        it('should return error for missing required fields', async () => {
            mockReq.body = { name: 'Test' };
            await productController.createProduct(mockReq, mockRes);
            expect(sendError).toHaveBeenCalledWith(mockRes, 'Missing required product fields', 400);
        });

        it('should return error for invalid price format', async () => {
            mockReq.body = { name: 'Test', price: -5, category: 'cat' };
            await productController.createProduct(mockReq, mockRes);
            expect(sendError).toHaveBeenCalledWith(mockRes, 'Invalid price format', 400);
        });

        it('should return error if user not found (Cross-service validation mock)', async () => {
            mockReq.body = { name: 'Test', price: 10, category: 'cat' };
            axios.get.mockRejectedValue({ response: { status: 404 } });
            
            await productController.createProduct(mockReq, mockRes);
            
            expect(sendError).toHaveBeenCalledWith(mockRes, 'Invalid vendor: User not found', 400);
        });

        it('should return error if user service is unreachable', async () => {
            mockReq.body = { name: 'Test', price: 10, category: 'cat' };
            axios.get.mockRejectedValue(new Error('Network error'));
            
            await productController.createProduct(mockReq, mockRes);
            
            expect(sendError).toHaveBeenCalledWith(mockRes, 'Validation error: User service unreachable', 503);
        });

        it('should create product on success', async () => {
            mockReq.body = { name: 'Test', price: 10, category: 'cat' };
            axios.get.mockResolvedValue({});
            productService.createProduct.mockResolvedValue({ id: 1, name: 'Test' });
            
            await productController.createProduct(mockReq, mockRes);
            
            expect(productService.createProduct).toHaveBeenCalled();
            expect(sendSuccess).toHaveBeenCalledWith(mockRes, { id: 1, name: 'Test' }, 201);
        });
    });

    describe('getVendorProducts', () => {
        it('should reject access if vendorId !== req.userId (Ownership guard BOLA)', async () => {
            mockReq.params = { vendorId: '2' };
            await productController.getVendorProducts(mockReq, mockRes);
            expect(sendError).toHaveBeenCalledWith(mockRes, 'Unauthorized: You can only view your own products', 403);
        });

        it('should return products if vendorId === req.userId', async () => {
            mockReq.params = { vendorId: '1' };
            productService.getProductsByVendor.mockResolvedValue([{ id: 1 }]);
            await productController.getVendorProducts(mockReq, mockRes);
            expect(sendSuccess).toHaveBeenCalledWith(mockRes, [{ id: 1 }]);
        });
    });

    describe('getPublicVendorProducts', () => {
        it('should allow public access to vendor products without ownership guard (Public vs Protected endpoint)', async () => {
            mockReq.params = { vendorId: '2' };
            productService.getProductsByVendor.mockResolvedValue([{ id: 1 }]);
            await productController.getPublicVendorProducts(mockReq, mockRes);
            expect(sendSuccess).toHaveBeenCalledWith(mockRes, [{ id: 1 }]);
        });
    });

    describe('updateProduct', () => {
        it('should return error for invalid price', async () => {
            mockReq.params = { id: '1' };
            mockReq.body = { price: 'abc' };
            await productController.updateProduct(mockReq, mockRes);
            expect(sendError).toHaveBeenCalledWith(mockRes, 'Invalid price format', 400);
        });

        it('should return 404 if product not found', async () => {
            mockReq.params = { id: '1' };
            mockReq.body = { price: 20 };
            productService.updateProduct.mockResolvedValue(null);
            await productController.updateProduct(mockReq, mockRes);
            expect(sendError).toHaveBeenCalledWith(mockRes, 'Product not found', 404);
        });

        it('should update product', async () => {
            mockReq.params = { id: '1' };
            mockReq.body = { price: 20 };
            productService.updateProduct.mockResolvedValue({ id: 1, price: 20 });
            await productController.updateProduct(mockReq, mockRes);
            expect(sendSuccess).toHaveBeenCalledWith(mockRes, { id: 1, price: 20 });
        });
    });

    describe('deleteProduct', () => {
        it('should return 404 if product not found', async () => {
            mockReq.params = { id: '1' };
            productService.deleteProduct.mockResolvedValue(null);
            await productController.deleteProduct(mockReq, mockRes);
            expect(sendError).toHaveBeenCalledWith(mockRes, 'Product not found', 404);
        });

        it('should delete product successfully', async () => {
            mockReq.params = { id: '1' };
            productService.deleteProduct.mockResolvedValue({ id: 1 });
            await productController.deleteProduct(mockReq, mockRes);
            expect(sendSuccess).toHaveBeenCalledWith(mockRes, { message: 'Deleted successfully', product: { id: 1 } });
        });
    });

    describe('getAllProducts', () => {
        it('should fetch all products', async () => {
            productService.getAllProducts.mockResolvedValue([{ id: 1 }]);
            await productController.getAllProducts(mockReq, mockRes);
            expect(sendSuccess).toHaveBeenCalledWith(mockRes, [{ id: 1 }]);
        });
    });

    describe('Admin operations', () => {
        it('should fetch all products as admin', async () => {
            productService.getAllProducts.mockResolvedValue([{ id: 1 }]);
            await productController.getAllProductsAdmin(mockReq, mockRes);
            expect(sendSuccess).toHaveBeenCalledWith(mockRes, [{ id: 1 }]);
        });
        
        it('should fail create product admin if missing vendorId', async () => {
            mockReq.body = { name: 'test', price: 10, category: 'cat' };
            await productController.createProductAdmin(mockReq, mockRes);
            expect(sendError).toHaveBeenCalledWith(mockRes, 'Missing required product fields (vendorId, name, price, category)', 400);
        });

        it('should update product as admin', async () => {
            mockReq.params = { id: '1' };
            mockReq.body = { name: 'Admin update' };
            productService.updateProduct.mockResolvedValue({ id: 1, name: 'Admin update' });
            await productController.updateProductAdmin(mockReq, mockRes);
            expect(sendSuccess).toHaveBeenCalledWith(mockRes, { id: 1, name: 'Admin update' });
        });

        it('should delete product as admin', async () => {
            mockReq.params = { id: '1' };
            productService.deleteProduct.mockResolvedValue({ id: 1 });
            await productController.deleteProductAdmin(mockReq, mockRes);
            expect(sendSuccess).toHaveBeenCalledWith(mockRes, { message: 'Deleted successfully', product: { id: 1 } });
        });
    });
});
