const { pool } = require('../db/index');

/**
 * Aggregates incoming events into PostgreSQL summary tables using UPSERT logic.
 */
class MetricsAggregator {
    /**
     * Process an event and increment the relevant counters.
     * @param {Object} eventPayload 
     */
    async processEvent(eventPayload) {
        const { event_type, product_id, vendor_id, metadata, timestamp } = eventPayload;
        
        // 1. Determine Time Bucket (Hourly)
        // We truncate the timestamp to the current hour
        const eventTime = timestamp ? new Date(timestamp) : new Date();
        eventTime.setMinutes(0, 0, 0); // start of the hour
        
        try {
            // Begin Transaction if needed, but for simplicity we'll just run concurrent queries.
            
            // --- Update analytics_summary ---
            const summaryQuery = `
                INSERT INTO analytics_summary (
                    time_bucket, total_events, total_views, total_orders, total_ar_opens, total_recommendation_clicks
                )
                VALUES ($1, 1, $2, $3, $4, $5)
                ON CONFLICT (time_bucket) DO UPDATE SET
                    total_events = analytics_summary.total_events + 1,
                    total_views = analytics_summary.total_views + $2,
                    total_orders = analytics_summary.total_orders + $3,
                    total_ar_opens = analytics_summary.total_ar_opens + $4,
                    total_recommendation_clicks = analytics_summary.total_recommendation_clicks + $5;
            `;
            
            const isView = event_type === 'product_view' ? 1 : 0;
            const isOrder = event_type === 'order_created' ? 1 : 0;
            const isAR = event_type === 'ar_opened' ? 1 : 0;
            const isClick = event_type === 'recommendation_clicked' ? 1 : 0;
            
            await pool.query(summaryQuery, [eventTime, isView, isOrder, isAR, isClick]);
            
            // --- Update product_metrics ---
            if (product_id) {
                const productQuery = `
                    INSERT INTO product_metrics (product_id, total_views, total_orders, total_ar_opens, last_event_at)
                    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                    ON CONFLICT (product_id) DO UPDATE SET
                        total_views = product_metrics.total_views + $2,
                        total_orders = product_metrics.total_orders + $3,
                        total_ar_opens = product_metrics.total_ar_opens + $4,
                        last_event_at = CURRENT_TIMESTAMP;
                `;
                await pool.query(productQuery, [product_id, isView, isOrder, isAR]);
            }
            
            // --- Update vendor_metrics ---
            if (vendor_id) {
                let revenueAmount = 0;
                if (isOrder && metadata && metadata.amount) {
                    revenueAmount = parseFloat(metadata.amount);
                }
                
                const vendorQuery = `
                    INSERT INTO vendor_metrics (vendor_id, total_views, total_orders, total_revenue, last_event_at)
                    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                    ON CONFLICT (vendor_id) DO UPDATE SET
                        total_views = vendor_metrics.total_views + $2,
                        total_orders = vendor_metrics.total_orders + $3,
                        total_revenue = vendor_metrics.total_revenue + $4,
                        last_event_at = CURRENT_TIMESTAMP;
                `;
                await pool.query(vendorQuery, [vendor_id, isView, isOrder, revenueAmount]);
            }
            
            // console.log(\`Aggregated event \${event_type} successfully.\`);
        } catch (error) {
            console.error('Error in metrics aggregation:', error);
            // We might want to swallow the error or log it so it doesn't crash the consumer.
        }
    }
}

module.exports = new MetricsAggregator();
