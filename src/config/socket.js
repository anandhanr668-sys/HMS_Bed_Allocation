let ioInstance = null;

/**
 * Initialize Socket.IO
 */
const initSocket = (server) => {
  const { Server } = require("socket.io");

  ioInstance = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  ioInstance.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });

  console.log("✅ Socket.IO initialized");
  return ioInstance;
};

/**
 * Get socket instance anywhere in app
 */
const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized");
  }
  return ioInstance;
};

module.exports = {
  initSocket,
  getIO,
};
