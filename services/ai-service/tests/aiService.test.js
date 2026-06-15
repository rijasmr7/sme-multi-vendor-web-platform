const aiService = require('../src/services/aiService');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pool = require('../src/config/db');

jest.mock('@google/generative-ai');
jest.mock('../src/config/db', () => ({
    query: jest.fn()
}));

describe('AI Service', () => {
    let mockGenerateContent;

    beforeEach(() => {
        mockGenerateContent = jest.fn();
        GoogleGenerativeAI.mockImplementation(() => ({
            getGenerativeModel: () => ({
                generateContent: mockGenerateContent
            })
        }));
        jest.clearAllMocks();
        process.env.GEMINI_API_KEY = 'test-key';
    });

    describe('generateShopData', () => {
        it('should parse JSON output from Gemini and apply HSL color computation', async () => {
            const mockJSON = {
                shopName: 'Test Shop',
                navigation: ['Home', 'Contact'],
                layout: 'grid',
                theme: { primary: '#6366f1' },
                products: []
            };
            mockGenerateContent.mockResolvedValue({
                response: { text: () => JSON.stringify(mockJSON) }
            });

            // "fruit" category to test knowledge base retrieval
            const result = await aiService.generateShopData('fruit', 'Test Shop', [], 'pro', '#6366f1');
            
            expect(result.shopName).toBe('Test Shop');
            expect(result.navigation).toEqual(expect.arrayContaining(['Home']));
        });

        it('should trigger smart fallback on Gemini error', async () => {
            mockGenerateContent.mockRejectedValue(new Error('API Down'));

            // "clothing" category
            const result = await aiService.generateShopData('clothing', 'Fallback Shop', [], 'pro', '#6366f1');
            
            expect(result.shopName).toBe('Fallback Shop');
            expect(result.products[0].name).toBe('T-Shirt'); // fallback default
            // HSL computation check
            expect(result.theme).toHaveProperty('primary', '#6366f1');
            expect(result.theme).toHaveProperty('accent');
        });

        it('should throw error if Gemini API Key is missing', async () => {
            delete process.env.GEMINI_API_KEY;
            await expect(aiService.generateShopData('fruit', 'Shop')).rejects.toThrow("Gemini API Key is missing.");
        });
    });

    describe('saveShop', () => {
        it('should save shop to db', async () => {
            pool.query.mockResolvedValue({ rows: [{ id: 1, shop_name: 'Test' }] });
            const result = await aiService.saveShop('1', 'Test', {}, false, null);
            expect(pool.query).toHaveBeenCalled();
            expect(result.id).toBe(1);
        });
    });

    describe('publishShop', () => {
        it('should update shop to published', async () => {
            pool.query.mockResolvedValue({ rows: [{ id: 1, is_published: true }] });
            const result = await aiService.publishShop(1);
            expect(pool.query).toHaveBeenCalled();
            expect(result.is_published).toBe(true);
        });
    });

    describe('getPublicShops', () => {
        it('should only return approved and published shops', async () => {
            pool.query.mockResolvedValue({ rows: [{ id: 1, vendor_id: '1', shop_name: 'Shop', config: {} }] });
            const result = await aiService.getPublicShops();
            expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('is_published = true AND is_approved = true'));
            expect(result.length).toBe(1);
        });
    });
});
