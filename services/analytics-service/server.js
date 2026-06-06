const http = require('http');
const app = require('./src/app');
const { initDB } = require('./src/db/index');
const { connectRedis } = require('./src/streams/redisClient');
const { startConsumer } = require('./src/streams/consumer');
const { initSocketServer } = require('./src/websocket/socketServer');

const PORT = process.env.PORT || 5003;

const startServer = async () => {
    try {
        console.log('⏳ Starting Analytics Service...');
        
        // 1. Initialize PostgreSQL Database
        await initDB();
        
        // 2. Connect to Redis
        await connectRedis();
        
        // 3. Start Redis Streams Consumer
        // We run this in the background, non-blocking
        startConsumer().catch(err => {
            console.error('❌ Fatal error in consumer:', err);
        });
        
        // 4. Create HTTP Server and bind Socket.io
        const server = http.createServer(app);
        initSocketServer(server);
        
        // 5. Start HTTP Server
        server.listen(PORT, () => {
            console.log(`🚀 Analytics Service & WebSockets live at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start Analytics Service:', error);
        process.exit(1);
    }
};

startServer();
