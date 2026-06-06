/**
 * Handles individual socket connections and events.
 */
const handleConnection = (io, socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);

    // Optional: Clients can join specific rooms (e.g., room for their vendor_id)
    socket.on('join_vendor_room', (vendorId) => {
        socket.join(`vendor_${vendorId}`);
        console.log(`[SOCKET] Client ${socket.id} joined room vendor_${vendorId}`);
    });

    socket.on('leave_vendor_room', (vendorId) => {
        socket.leave(`vendor_${vendorId}`);
        console.log(`[SOCKET] Client ${socket.id} left room vendor_${vendorId}`);
    });

    socket.on('disconnect', () => {
        console.log(`[SOCKET] Client disconnected: ${socket.id}`);
    });
};

module.exports = {
    handleConnection
};
