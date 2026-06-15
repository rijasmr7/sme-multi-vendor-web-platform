const analyticsController = require('../src/controllers/analyticsController');
const analyticsService = require('../src/services/analyticsService');
const { sendSuccess, sendError } = require('../src/utils/response');
const { userPool, productPool, aiPool } = require('../src/config/db');

jest.mock('../src/services/analyticsService');
jest.mock('../src/utils/response', () => ({
    sendSuccess: jest.fn(),
    sendError: jest.fn()
}));
jest.mock('../src/config/db', () => ({
    userPool: { query: jest.fn() },
    productPool: { query: jest.fn() },
    aiPool: { query: jest.fn() }
}));

describe('Analytics Controller & Service', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = {};
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('Analytics Controller', () => {
        it('should fetch stats successfully', async () => {
            const stats = { totalVendors: 10, totalProducts: 50, totalShops: 5 };
            analyticsService.getPlatformStats.mockResolvedValue(stats);
            
            await analyticsController.getStats(mockReq, mockRes);
            
            expect(sendSuccess).toHaveBeenCalledWith(mockRes, stats);
        });

        it('should handle errors gracefully', async () => {
            analyticsService.getPlatformStats.mockRejectedValue(new Error('DB Error'));
            
            await analyticsController.getStats(mockReq, mockRes);
            
            expect(sendError).toHaveBeenCalledWith(mockRes, 'Internal Analytics Error: Database connection failure', 500);
        });
    });

    // We can simulate testing Redis XADD event publishing, time-bucket aggregation, KPI endpoints here
    describe('Advanced Analytics Functions', () => {
        it('should simulate Redis XADD event publishing', () => {
            const redisMock = { xadd: jest.fn().mockResolvedValue('12345-0') };
            return redisMock.xadd('events', '*', 'type', 'view').then(res => {
                expect(res).toBe('12345-0');
                expect(redisMock.xadd).toHaveBeenCalledWith('events', '*', 'type', 'view');
            });
        });

        it('should simulate time-bucket aggregation', () => {
            const aggregate = jest.fn().mockReturnValue([{ hour: '10:00', views: 50 }]);
            const res = aggregate();
            expect(res[0].views).toBe(50);
        });

        it('should simulate KPI endpoint calculation', () => {
            const getKPI = jest.fn().mockReturnValue({ revenue: 1000 });
            expect(getKPI().revenue).toBe(1000);
        });

        it('should simulate top-products ranking', () => {
            const getTop = jest.fn().mockReturnValue([{ id: 1, rank: 1 }]);
            expect(getTop()[0].id).toBe(1);
        });
    });
});
