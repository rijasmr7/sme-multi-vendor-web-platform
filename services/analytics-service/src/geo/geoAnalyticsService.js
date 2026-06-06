const { pool } = require('../db');

class GeoAnalyticsService {
    /**
     * Insert a new geo-tagged event into the analytics database.
     */
    async recordGeoEvent(eventType, userId, vendorId, lat, lon) {
        if (!lat || !lon) return null;
        
        try {
            const query = `
                INSERT INTO geo_events (event_type, user_id, vendor_id, latitude, longitude, location)
                VALUES ($1, $2, $3, $4::double precision, $5::double precision, ST_MakePoint($5::double precision, $4::double precision)::geography)
                RETURNING *;
            `;
            const { rows } = await pool.query(query, [eventType, userId, vendorId, lat, lon]);
            return rows[0];
        } catch (error) {
            console.error('[GeoAnalyticsService] Error recording geo event:', error);
            throw error;
        }
    }

    /**
     * Get recent geo events (e.g. for heatmap).
     */
    async getRecentActivity(limit = 100) {
        try {
            const query = `
                SELECT event_type, latitude, longitude, created_at
                FROM geo_events
                WHERE created_at >= NOW() - INTERVAL '24 hours'
                ORDER BY created_at DESC
                LIMIT $1;
            `;
            const { rows } = await pool.query(query, [limit]);
            return rows;
        } catch (error) {
            console.error('[GeoAnalyticsService] Error fetching recent activity:', error);
            throw error;
        }
    }

    /**
     * Get vendor specific geo traffic (nearby active users).
     * Calculates distance to the vendor.
     */
    async getVendorTraffic(vendorLat, vendorLon, radiusKm = 10) {
        if (!vendorLat || !vendorLon) return [];
        const radiusMeters = radiusKm * 1000;

        try {
            const query = `
                SELECT 
                    event_type, 
                    latitude, 
                    longitude,
                    ST_Distance(location, ST_MakePoint($2::double precision, $1::double precision)::geography) as distance_meters,
                    created_at
                FROM geo_events
                WHERE ST_DWithin(location, ST_MakePoint($2::double precision, $1::double precision)::geography, $3)
                  AND created_at >= NOW() - INTERVAL '1 hour'
                ORDER BY distance_meters ASC
                LIMIT 50;
            `;
            const { rows } = await pool.query(query, [vendorLat, vendorLon, radiusMeters]);
            
            return rows.map(row => ({
                eventType: row.event_type,
                latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude),
                distanceKm: parseFloat((row.distance_meters / 1000).toFixed(2)),
                createdAt: row.created_at
            }));
        } catch (error) {
            console.error('[GeoAnalyticsService] Error fetching vendor traffic:', error);
            throw error;
        }
    }
    
    /**
     * Simple hotspot aggregation based on rounded coordinates.
     */
    async getHotspots() {
        try {
            // Group by approximate 1km blocks (~0.01 degrees)
            const query = `
                SELECT 
                    ROUND(latitude, 2) as center_lat,
                    ROUND(longitude, 2) as center_lon,
                    COUNT(*) as intensity
                FROM geo_events
                WHERE created_at >= NOW() - INTERVAL '12 hours'
                GROUP BY ROUND(latitude, 2), ROUND(longitude, 2)
                ORDER BY intensity DESC
                LIMIT 20;
            `;
            const { rows } = await pool.query(query);
            return rows;
        } catch (error) {
            console.error('[GeoAnalyticsService] Error fetching hotspots:', error);
            throw error;
        }
    }
}

module.exports = new GeoAnalyticsService();
