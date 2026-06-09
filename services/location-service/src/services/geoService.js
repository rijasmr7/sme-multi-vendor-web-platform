const { pool } = require('../database/db');

class GeoService {
    /**
     * Upserts a shop's location.
     * Uses ST_MakePoint(longitude, latitude) to create the geography object.
     * Note: PostGIS expects coordinates in Longitude, Latitude order.
     */
    async updateShopLocation(shopId, shopName, lat, lon) {
        const query = `
            INSERT INTO shop_locations (shop_id, shop_name, latitude, longitude, location)
            VALUES ($1, $2, $3::double precision, $4::double precision, ST_MakePoint($4::double precision, $3::double precision)::geography)
            ON CONFLICT (shop_id) DO UPDATE SET
                shop_name = $2,
                latitude = $3::double precision,
                longitude = $4::double precision,
                location = ST_MakePoint($4::double precision, $3::double precision)::geography,
                updated_at = CURRENT_TIMESTAMP
            RETURNING shop_id, shop_name, latitude, longitude;
        `;
        const { rows } = await pool.query(query, [shopId, shopName, lat, lon]);
        return rows[0];
    }

    /**
     * Finds shops within a specific radius.
     * Uses ST_DWithin which utilizes the GiST index for extremely fast bounding-box filtering.
     * Uses ST_Distance to return the exact distance in meters.
     * @param {number} lat - User latitude
     * @param {number} lon - User longitude
     * @param {number} radiusKm - Search radius in kilometers
     */
    async findNearbyShops(lat, lon, radiusKm = 10) {
        const radiusMeters = radiusKm * 1000;
        
        const query = `
            SELECT 
                shop_id, 
                shop_name, 
                latitude, 
                longitude,
                ST_Distance(location, ST_MakePoint($2, $1)::geography) as distance_meters
            FROM shop_locations
            WHERE ST_DWithin(location, ST_MakePoint($2, $1)::geography, $3)
            ORDER BY distance_meters ASC
            LIMIT 50;
        `;
        
        // $1 = lat, $2 = lon. PostGIS functions generally take (lon, lat).
        const { rows } = await pool.query(query, [lat, lon, radiusMeters]);
        
        // Format response for the frontend
        return rows.map(row => ({
            shopId: row.shop_id,
            shopName: row.shop_name,
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
            distanceKm: parseFloat((row.distance_meters / 1000).toFixed(2)) // Convert to km with 2 decimals
        }));
    }

    /**
     * Calculates the distance from the user to a specific shop.
     */
    async getDistanceToShop(shopId, lat, lon) {
        const query = `
            SELECT 
                shop_id,
                shop_name,
                ST_Distance(location, ST_MakePoint($2, $1)::geography) as distance_meters
            FROM shop_locations
            WHERE shop_id = $3;
        `;
        
        const { rows } = await pool.query(query, [lat, lon, shopId]);
        if (rows.length === 0) return null;
        
        const row = rows[0];
        return {
            shopId: row.shop_id,
            shopName: row.shop_name,
            distanceKm: parseFloat((row.distance_meters / 1000).toFixed(2))
        };
    }

    async deleteShopLocation(shopId) {
        const query = `DELETE FROM shop_locations WHERE shop_id = $1 RETURNING *;`;
        const { rows } = await pool.query(query, [shopId]);
        return rows[0];
    }
}

module.exports = new GeoService();
