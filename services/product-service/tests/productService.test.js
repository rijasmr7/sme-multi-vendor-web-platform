const productService = require('../src/services/productService');
const pool = require('../src/config/db');

jest.mock('../src/config/db', () => ({
    query: jest.fn()
}));

describe('Product Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllProducts', () => {
        it('should fetch all products from DB', async () => {
            pool.query.mockResolvedValue({ rows: [{ id: 1, name: 'Test' }] });
            const result = await productService.getAllProducts();
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM products ORDER BY id DESC;');
            expect(result).toEqual([{ id: 1, name: 'Test' }]);
        });
    });

    describe('getProductsByVendor', () => {
        it('should fetch products for a specific vendor', async () => {
            pool.query.mockResolvedValue({ rows: [{ id: 1, vendor_id: '123' }] });
            const result = await productService.getProductsByVendor('123');
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM products WHERE vendor_id = $1 ORDER BY id DESC;', ['123']);
            expect(result.length).toBe(1);
        });
    });

    describe('createProduct', () => {
        it('should create product with JSONB extra_data storage mock', async () => {
            const productData = {
                vendorId: '1',
                name: 'Product',
                price: 10,
                category: 'cat',
                description: 'desc',
                extraData: { color: 'red' }
            };
            pool.query.mockResolvedValue({ rows: [{ id: 1, ...productData }] });
            
            const result = await productService.createProduct(productData);
            
            expect(pool.query).toHaveBeenCalledWith(
                expect.any(String),
                ['1', 'Product', 10, 'cat', 'desc', '{"color":"red"}']
            );
            expect(result).toHaveProperty('id', 1);
        });

        it('should handle null extraData and description', async () => {
            const productData = { vendorId: '1', name: 'Product', price: 10, category: 'cat' };
            pool.query.mockResolvedValue({ rows: [{ id: 1 }] });
            
            await productService.createProduct(productData);
            
            expect(pool.query).toHaveBeenCalledWith(
                expect.any(String),
                ['1', 'Product', 10, 'cat', null, null]
            );
        });
    });

    describe('updateProduct', () => {
        it('should update product with JSONB extraData', async () => {
            const updateData = { name: 'New Name', extraData: { size: 'M' } };
            pool.query.mockResolvedValue({ rows: [{ id: 1, name: 'New Name' }] });
            
            const result = await productService.updateProduct(1, updateData);
            
            expect(pool.query).toHaveBeenCalledWith(
                expect.any(String),
                ['New Name', undefined, undefined, undefined, '{"size":"M"}', 1]
            );
            expect(result).toHaveProperty('name', 'New Name');
        });
    });

    describe('deleteProduct', () => {
        it('should delete product by id', async () => {
            pool.query.mockResolvedValue({ rows: [{ id: 1 }] });
            const result = await productService.deleteProduct(1);
            expect(pool.query).toHaveBeenCalledWith('DELETE FROM products WHERE id = $1 RETURNING *;', [1]);
            expect(result).toHaveProperty('id', 1);
        });
    });
});
