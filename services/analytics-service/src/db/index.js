const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'admin',
    host: process.env.DB_HOST || 'postgres', // docker service name
    database: process.env.DB_NAME || 'analytics_db',
    password: process.env.DB_PASSWORD || 'secretpassword',
    port: process.env.DB_PORT || 5432,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle analytics_db client', err);
    process.exit(-1);
});

const initDB = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS analytics_events (
            id SERIAL PRIMARY KEY,
            event_type VARCHAR(50) NOT NULL,
            user_id VARCHAR(50),
            product_id VARCHAR(50),
            vendor_id VARCHAR(50),
            metadata JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS analytics_summary (
            time_bucket TIMESTAMP PRIMARY KEY,
            total_views INT DEFAULT 0,
            total_orders INT DEFAULT 0,
            total_ar_opens INT DEFAULT 0,
            total_recommendation_clicks INT DEFAULT 0,
            total_events INT DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS product_metrics (
            product_id VARCHAR(50) PRIMARY KEY,
            total_views INT DEFAULT 0,
            total_orders INT DEFAULT 0,
            total_ar_opens INT DEFAULT 0,
            last_event_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vendor_metrics (
            vendor_id VARCHAR(50) PRIMARY KEY,
            total_views INT DEFAULT 0,
            total_orders INT DEFAULT 0,
            total_revenue DECIMAL(10, 2) DEFAULT 0.00,
            last_event_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Geospatial Analytics Tables
        CREATE TABLE IF NOT EXISTS geo_events (
            id SERIAL PRIMARY KEY,
            event_type VARCHAR(50) NOT NULL,
            user_id VARCHAR(50),
            vendor_id VARCHAR(50),
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            location geography(Point, 4326),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS geo_events_location_idx ON geo_events USING GIST (location);
        CREATE INDEX IF NOT EXISTS geo_events_vendor_idx ON geo_events (vendor_id);
        CREATE INDEX IF NOT EXISTS geo_events_type_idx ON geo_events (event_type);

        CREATE TABLE IF NOT EXISTS regional_metrics (
            region_name VARCHAR(100) PRIMARY KEY,
            center_lat DECIMAL(10, 8),
            center_lon DECIMAL(11, 8),
            active_users INT DEFAULT 0,
            event_count INT DEFAULT 0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vendor_geo_analytics (
            vendor_id VARCHAR(50) PRIMARY KEY,
            nearby_users INT DEFAULT 0,
            hotspot_score DECIMAL(5, 2) DEFAULT 0.00,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
        console.log('✅ PostGIS extension enabled in analytics_db.');
        await pool.query(createTableQuery);
        console.log('✅ PostgreSQL: analytics tables (events, summary, product_metrics, vendor_metrics) are ready.');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    }
};

module.exports = {
    pool,
    initDB
};
