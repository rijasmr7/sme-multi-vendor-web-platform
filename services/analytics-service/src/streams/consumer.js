const { redisClient } = require('./redisClient');
const { pool } = require('../db/index');
const { STREAM_KEY } = require('./producer');
const { getIo } = require('../websocket/socketServer');
const metricsAggregator = require('../aggregation/metricsAggregator');
const geoAnalyticsService = require('../geo/geoAnalyticsService');

const GROUP_NAME = 'analytics-group';
const CONSUMER_NAME = `consumer-${process.pid}`;

/**
 * Initializes the consumer group if it doesn't exist.
 */
const initConsumerGroup = async () => {
    try {
        await redisClient.xGroupCreate(STREAM_KEY, GROUP_NAME, '0', {
            MKSTREAM: true
        });
        console.log(`[CONSUMER] Created group ${GROUP_NAME} for stream ${STREAM_KEY}`);
    } catch (error) {
        if (error.message.includes('BUSYGROUP')) {
            console.log(`[CONSUMER] Group ${GROUP_NAME} already exists.`);
        } else {
            console.error('[CONSUMER] Error creating group:', error);
            throw error;
        }
    }
};

/**
 * Processes a single event message.
 */
const processEvent = async (message) => {
    try {
        // Parse the message data
        const messageId = message.id;
        const messageData = message.message;
        
        const eventType = messageData.event_type;
        const payloadStr = messageData.payload;
        let payload = {};
        
        try {
            if (payloadStr) {
                payload = JSON.parse(payloadStr);
            }
        } catch (e) {
            console.warn(`[CONSUMER] Invalid JSON in payload for event ${messageId}`);
        }

        const { user_id, product_id, vendor_id, ...metadata } = payload;

        // Insert into PostgreSQL
        const insertQuery = `
            INSERT INTO analytics_events (event_type, user_id, product_id, vendor_id, metadata)
            VALUES ($1, $2, $3, $4, $5)
        `;
        const values = [
            eventType, 
            user_id || null, 
            product_id || null, 
            vendor_id || null, 
            Object.keys(metadata).length ? metadata : null
        ];

        await pool.query(insertQuery, values);

        // --- GEO ANALYTICS PROCESSING ---
        const lat = metadata.latitude || metadata.lat;
        const lon = metadata.longitude || metadata.lon || metadata.lng;
        
        if (lat && lon) {
            try {
                await geoAnalyticsService.recordGeoEvent(eventType, user_id, vendor_id, lat, lon);
            } catch (geoErr) {
                console.error('[CONSUMER] Error recording geo event:', geoErr.message);
            }
        }

        const livePayload = {
            id: messageId,
            event_type: eventType,
            user_id,
            product_id,
            vendor_id,
            metadata,
            latitude: lat,
            longitude: lon,
            timestamp: new Date().toISOString()
        };

        // --- TRIGGER REAL-TIME AGGREGATION ---
        await metricsAggregator.processEvent(livePayload);
        
        // Acknowledge the message so it's removed from pending entries
        await redisClient.xAck(STREAM_KEY, GROUP_NAME, messageId);
        
        console.log(`[CONSUMER] Processed and acknowledged event: ${messageId}`);

        // --- BROADCAST REAL-TIME EVENT ---
        try {
            const io = getIo();
            // Broadcast to everyone (Dashboard feed)
            io.emit('live_event', livePayload);

            // Broadcast to specific vendor room if vendor_id exists
            if (vendor_id) {
                io.to(`vendor_${vendor_id}`).emit('vendor_event', livePayload);
            }
        } catch (ioError) {
            console.error('[CONSUMER] Socket.io broadcast failed:', ioError.message);
        }

    } catch (error) {
        console.error(`[CONSUMER] Failed to process event ${message.id}:`, error);
        // Do not ack the message if it fails, allowing it to be retried via XPENDING/XCLAIM if needed
    }
};

/**
 * Starts polling the Redis Stream for new messages.
 */
const startConsumer = async () => {
    await initConsumerGroup();
    
    console.log(`[CONSUMER] ${CONSUMER_NAME} is listening for events...`);
    
    while (true) {
        try {
            // Read from the stream. BLOCK 5000 means wait up to 5 seconds if stream is empty.
            // '>' means get new messages that have never been delivered to other consumers in this group.
            const response = await redisClient.xReadGroup(
                GROUP_NAME,
                CONSUMER_NAME,
                [
                    {
                        key: STREAM_KEY,
                        id: '>'
                    }
                ],
                {
                    COUNT: 10,
                    BLOCK: 5000
                }
            );

            if (response && response.length > 0) {
                const stream = response[0];
                const messages = stream.messages;
                
                for (const message of messages) {
                    await processEvent(message);
                }
            }
        } catch (error) {
            console.error('[CONSUMER] Error reading from stream:', error);
            // Brief pause before retrying on error to avoid tight loops on disconnect
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
};

module.exports = {
    startConsumer
};
