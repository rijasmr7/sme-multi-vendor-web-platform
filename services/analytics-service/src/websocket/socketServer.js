const { Server } = require('socket.io');
const socketHandlers = require('./socketHandlers');

let io;

const initSocketServer = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*", // Adjust in production to match frontend domains
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        socketHandlers.handleConnection(io, socket);
    });

    console.log('✅ Socket.io server initialized');
    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

module.exports = {
    initSocketServer,
    getIo
};
