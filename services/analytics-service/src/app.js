const express = require('express');
const cors = require('cors');
const { pool } = require('./db/index');
const { publishEvent } = require('./streams/producer');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { sendError } = require('./utils/response');

const app = express();

app.use(cors());
app.use(express.json());

// Legacy routes
app.use('/', analyticsRoutes);

// Geo Analytics Routes
const geoRoutes = require('./routes/geoRoutes');
app.use('/geo', geoRoutes);

// --- NEW REDIS STREAM API ENDPOINTS ---

/**
 * POST /events/test
 * Test endpoint to manually publish an event to the Redis Stream.
 */
app.post('/events/test', async (req, res) => {
    try {
        const { event_type, ...payload } = req.body;
        
        if (!event_type) {
            return res.status(400).json({ success: false, message: 'event_type is required' });
        }

        const messageId = await publishEvent(event_type, payload);
        
        res.status(200).json({
            success: true,
            message: 'Event published successfully to Redis Stream',
            data: { messageId }
        });
    } catch (error) {
        console.error('Error in /events/test:', error);
        res.status(500).json({ success: false, message: 'Failed to publish event' });
    }
});

/**
 * GET /events
 * Fetches the latest 50 processed events from PostgreSQL.
 */
app.get('/events', async (req, res) => {
    try {
        const query = `
            SELECT * FROM analytics_events 
            ORDER BY created_at DESC 
            LIMIT 50
        `;
        const result = await pool.query(query);
        
        res.status(200).json({
            success: true,
            count: result.rowCount,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching events from DB:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch events' });
    }
});

/**
 * GET /analytics/live-summary
 * Fetches basic live stats for the dashboard.
 */
app.get('/analytics/live-summary', async (req, res) => {
    try {
        const activeUsersQuery = "SELECT COUNT(DISTINCT user_id) as count FROM analytics_events WHERE created_at > NOW() - INTERVAL '5 minutes'";
        const totalEventsQuery = "SELECT COUNT(*) as count FROM analytics_events";
        
        const [activeUsersRes, totalEventsRes] = await Promise.all([
            pool.query(activeUsersQuery),
            pool.query(totalEventsQuery)
        ]);

        res.status(200).json({
            success: true,
            data: {
                activeViewers: Number(activeUsersRes.rows[0].count),
                totalEvents: Number(totalEventsRes.rows[0].count)
            }
        });
    } catch (error) {
        console.error('Error fetching live summary:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch live summary' });
    }
});

/**
 * GET /analytics/recent-events
 * Fetches the most recent events for the live feed.
 */
app.get('/analytics/recent-events', async (req, res) => {
    try {
        const { vendor_id } = req.query;
        let query;
        let params = [];
        if (vendor_id) {
            query = `
                SELECT id, event_type, user_id, product_id, vendor_id, metadata, created_at
                FROM analytics_events 
                WHERE vendor_id = $1
                ORDER BY created_at DESC 
                LIMIT 20
            `;
            params = [vendor_id];
        } else {
            query = `
                SELECT id, event_type, user_id, product_id, vendor_id, metadata, created_at
                FROM analytics_events 
                ORDER BY created_at DESC 
                LIMIT 20
            `;
        }
        const result = await pool.query(query, params);
        
        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching recent events:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch recent events' });
    }
});
/**
 * GET /analytics/kpis
 * Fetches the aggregated KPIs.
 */
app.get('/analytics/kpis', async (req, res) => {
    try {
        const { vendor_id } = req.query;
        let query;
        let params = [];
        if (vendor_id) {
            query = `
                SELECT 
                    COUNT(CASE WHEN event_type = 'product_view' THEN 1 END) as total_views,
                    COUNT(CASE WHEN event_type = 'order_created' THEN 1 END) as total_orders,
                    COUNT(CASE WHEN event_type = 'ar_opened' THEN 1 END) as total_ar_opens,
                    COUNT(CASE WHEN event_type = 'recommendation_clicked' THEN 1 END) as total_clicks
                FROM analytics_events
                WHERE vendor_id = $1
            `;
            params = [vendor_id];
        } else {
            query = `
                SELECT 
                    SUM(total_views) as total_views,
                    SUM(total_orders) as total_orders,
                    SUM(total_ar_opens) as total_ar_opens,
                    SUM(total_recommendation_clicks) as total_clicks
                FROM analytics_summary
            `;
        }
        const result = await pool.query(query, params);
        const data = result.rows[0] || {};
        
        res.status(200).json({
            success: true,
            data: {
                totalViews: Number(data.total_views || 0),
                totalOrders: Number(data.total_orders || 0),
                arOpens: Number(data.total_ar_opens || 0),
                recommendationClicks: Number(data.total_clicks || 0)
            }
        });
    } catch (error) {
        console.error('Error fetching KPIs:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch KPIs' });
    }
});

/**
 * GET /analytics/charts/views
 * Fetches time-series data for views and AR opens.
 */
app.get('/analytics/charts/views', async (req, res) => {
    try {
        const { vendor_id } = req.query;
        let query;
        let params = [];
        if (vendor_id) {
            query = `
                SELECT 
                    TO_CHAR(DATE_TRUNC('hour', created_at), 'HH24:MI') as time,
                    COUNT(CASE WHEN event_type = 'product_view' THEN 1 END) as views,
                    COUNT(CASE WHEN event_type = 'ar_opened' THEN 1 END) as ar_opens
                FROM analytics_events
                WHERE vendor_id = $1 AND created_at > NOW() - INTERVAL '24 hours'
                GROUP BY DATE_TRUNC('hour', created_at)
                ORDER BY DATE_TRUNC('hour', created_at) ASC
            `;
            params = [vendor_id];
        } else {
            query = `
                SELECT 
                    TO_CHAR(time_bucket, 'HH24:MI') as time,
                    total_views as views,
                    total_ar_opens as ar_opens
                FROM analytics_summary
                ORDER BY time_bucket ASC
                LIMIT 24
            `;
        }
        const result = await pool.query(query, params);
        
        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching views chart:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch views chart' });
    }
});

/**
 * GET /analytics/charts/orders
 * Fetches time-series data for orders.
 */
app.get('/analytics/charts/orders', async (req, res) => {
    try {
        const { vendor_id } = req.query;
        let query;
        let params = [];
        if (vendor_id) {
            query = `
                SELECT 
                    TO_CHAR(DATE_TRUNC('hour', created_at), 'HH24:MI') as time,
                    COUNT(CASE WHEN event_type = 'order_created' THEN 1 END) as orders
                FROM analytics_events
                WHERE vendor_id = $1 AND created_at > NOW() - INTERVAL '24 hours'
                GROUP BY DATE_TRUNC('hour', created_at)
                ORDER BY DATE_TRUNC('hour', created_at) ASC
            `;
            params = [vendor_id];
        } else {
            query = `
                SELECT 
                    TO_CHAR(time_bucket, 'HH24:MI') as time,
                    total_orders as orders
                FROM analytics_summary
                ORDER BY time_bucket ASC
                LIMIT 24
            `;
        }
        const result = await pool.query(query, params);
        
        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching orders chart:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch orders chart' });
    }
});

/**
 * GET /analytics/top-products
 * Fetches the top 5 products by views.
 */
app.get('/analytics/top-products', async (req, res) => {
    try {
        const { vendor_id } = req.query;
        let query;
        let params = [];
        if (vendor_id) {
            query = `
                SELECT 
                    product_id as name, 
                    COUNT(CASE WHEN event_type = 'product_view' THEN 1 END) as views,
                    COUNT(CASE WHEN event_type = 'order_created' THEN 1 END) as orders
                FROM analytics_events
                WHERE vendor_id = $1
                GROUP BY product_id
                ORDER BY views DESC
                LIMIT 5
            `;
            params = [vendor_id];
        } else {
            query = `
                SELECT product_id as name, total_views as views, total_orders as orders
                FROM product_metrics
                ORDER BY total_views DESC
                LIMIT 5
            `;
        }
        const result = await pool.query(query, params);
        
        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching top products:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch top products' });
    }
});
// --- GLOBAL ERROR HANDLING ---
app.use((err, req, res, next) => {
    console.error('ANALYTICS FAILURE:', err);
    sendError(res, 'Unexpected analytics engine failure', 500);
});

module.exports = app;
