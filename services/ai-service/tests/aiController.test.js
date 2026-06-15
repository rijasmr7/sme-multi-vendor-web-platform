const aiController = require('../src/controllers/aiController');
const aiService = require('../src/services/aiService');
const axios = require('axios');
const { sendSuccess, sendError } = require('../src/utils/response');

jest.mock('../src/services/aiService');
jest.mock('axios');
jest.mock('../src/utils/response', () => ({
    sendSuccess: jest.fn(),
    sendError: jest.fn()
}));

describe('AI Controller', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = { body: {}, params: {} };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('generateShop', () => {
        it('should return error if businessType or vendorId is missing', async () => {
            mockReq.body = { businessType: 'fruit' };
            await aiController.generateShop(mockReq, mockRes);
            expect(sendError).toHaveBeenCalledWith(mockRes, 'businessType and vendorId are required', 400);
        });

        it('should return error if vendor validation fails', async () => {
            mockReq.body = { businessType: 'fruit', vendorId: '1' };
            axios.get.mockRejectedValue(new Error('Network error'));
            
            await aiController.generateShop(mockReq, mockRes);
            
            expect(sendError).toHaveBeenCalledWith(mockRes, 'Validation error: User service unreachable or vendor invalid', 400);
        });

        it('should successfully generate shop via AI Service', async () => {
            mockReq.body = { businessType: 'fruit', vendorId: '1', shopName: 'Shop' };
            axios.get.mockResolvedValue({});
            aiService.generateShopData.mockResolvedValue({ shopName: 'Shop' });
            
            await aiController.generateShop(mockReq, mockRes);
            
            expect(aiService.generateShopData).toHaveBeenCalledWith('fruit', 'Shop', undefined, undefined, undefined);
            expect(sendSuccess).toHaveBeenCalledWith(mockRes, { shopName: 'Shop' }, 201);
        });
    });

    describe('saveShop', () => {
        it('should require vendorId, shopName, and config', async () => {
            mockReq.body = { vendorId: '1', shopName: 'Shop' };
            await aiController.saveShop(mockReq, mockRes);
            expect(sendError).toHaveBeenCalledWith(mockRes, 'vendorId, shopName, and config are required', 400);
        });

        it('should save shop successfully', async () => {
            mockReq.body = { vendorId: '1', shopName: 'Shop', config: {} };
            aiService.saveShop.mockResolvedValue({ id: 1 });
            await aiController.saveShop(mockReq, mockRes);
            expect(sendSuccess).toHaveBeenCalledWith(mockRes, { id: 1 }, 201);
        });
    });

    describe('getVendorShops', () => {
        it('should fetch shops by vendor', async () => {
            mockReq.params = { vendorId: '1' };
            aiService.findShopsByVendor.mockResolvedValue([{ id: 1 }]);
            await aiController.getVendorShops(mockReq, mockRes);
            expect(sendSuccess).toHaveBeenCalledWith(mockRes, [{ id: 1 }]);
        });
    });

    describe('publishShop', () => {
        it('should return 404 if shop not found', async () => {
            mockReq.params = { shopId: '1' };
            aiService.publishShop.mockResolvedValue(null);
            await aiController.publishShop(mockReq, mockRes);
            expect(sendError).toHaveBeenCalledWith(mockRes, 'Shop not found', 404);
        });

        it('should publish shop successfully', async () => {
            mockReq.params = { shopId: '1' };
            aiService.publishShop.mockResolvedValue({ id: 1, is_published: true });
            await aiController.publishShop(mockReq, mockRes);
            expect(sendSuccess).toHaveBeenCalledWith(mockRes, { id: 1, is_published: true });
        });
    });

    describe('getPublicShops', () => {
        it('should fetch public shops', async () => {
            aiService.getPublicShops.mockResolvedValue([{ id: 1 }]);
            await aiController.getPublicShops(mockReq, mockRes);
            expect(sendSuccess).toHaveBeenCalledWith(mockRes, [{ id: 1 }]);
        });
    });

    describe('Admin operations', () => {
        it('should toggle approval status', async () => {
            mockReq.params = { id: '1' };
            mockReq.body = { isApproved: true };
            aiService.toggleShopApproval.mockResolvedValue({ id: 1, is_approved: true });
            await aiController.toggleShopApprovalAdmin(mockReq, mockRes);
            expect(sendSuccess).toHaveBeenCalledWith(mockRes, { id: 1, is_approved: true });
        });

        it('should fail toggle approval if isApproved missing', async () => {
            mockReq.params = { id: '1' };
            await aiController.toggleShopApprovalAdmin(mockReq, mockRes);
            expect(sendError).toHaveBeenCalledWith(mockRes, 'isApproved field is required', 400);
        });

        it('should delete shop as admin', async () => {
            mockReq.params = { id: '1' };
            aiService.deleteShopAdmin.mockResolvedValue({ id: 1 });
            await aiController.deleteShopAdmin(mockReq, mockRes);
            expect(sendSuccess).toHaveBeenCalledWith(mockRes, { message: 'Shop deleted successfully', shop: { id: 1 } });
        });
    });
});
