const { redisClient } = require('./redisClient');

const STREAM_KEY = 'analytics:events';

/**
 * Publishes an event to the Redis Stream.
 * @param {string} eventType - The type of event (e.g., 'product_view', 'order_created')
 * @param {Object} eventData - The event payload
 */
const publishEvent = async (eventType, eventData) => {
    try {
        if (!redisClient.isOpen) {
            console.error('Redis client is not connected. Cannot publish event.');
            return null;
        }

        // We use XADD to add an entry to the stream.
        // MAXLEN ~ 100000 ensures the stream doesn't grow unbounded, capping it at roughly 100,000 entries.
        const messageId = await redisClient.xAdd(
            STREAM_KEY,
            '*', // Auto-generate ID
            {
                event_type: eventType,
                payload: JSON.stringify(eventData), // Convert nested objects to string for Redis Hash
                timestamp: new Date().toISOString()
            },
            {
                TRIM: {
                    strategy: 'MAXLEN',
                    strategyModifier: '~',
                    threshold: 100000
                }
            }
        );

        console.log(`[PRODUCER] Published ${eventType} event to stream with ID: ${messageId}`);
        return messageId;
    } catch (error) {
        console.error(`[PRODUCER] Error publishing ${eventType} event:`, error);
        throw error;
    }
};

module.exports = {
    publishEvent,
    STREAM_KEY
};
