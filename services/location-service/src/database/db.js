const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'admin',
    host: process.env.DB_HOST || 'postgres',
    database: process.env.DB_NAME || 'location_db',
    password: process.env.DB_PASSWORD || 'secretpassword',
    port: process.env.DB_PORT || 5432,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle location_db client', err);
    process.exit(-1);
});

const initDB = async () => {
    try {
        // 1. Enable PostGIS Extension
        await pool.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
        console.log('✅ PostGIS extension enabled.');

        // 2. Create Shop Locations Table
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS shop_locations (
                shop_id VARCHAR(50) PRIMARY KEY,
                shop_name VARCHAR(100),
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                location geography(Point, 4326),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await pool.query(createTableQuery);
        console.log('✅ PostgreSQL: shop_locations table is ready.');

        // 3. Create GiST Index for fast spatial queries
        const createIndexQuery = `
            CREATE INDEX IF NOT EXISTS shop_locations_geo_idx 
            ON shop_locations USING GIST (location);
        `;
        await pool.query(createIndexQuery);
        console.log('✅ PostgreSQL: GiST spatial index created.');

    } catch (error) {
        console.error('❌ Error initializing location database:', error);
        throw error;
    }
};

module.exports = {
    pool,
    initDB
};
