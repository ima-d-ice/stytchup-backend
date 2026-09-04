let io;

const initSocket = (httpServer) => {
  const { Server } = require('socket.io');
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:3000", "https://stytchup.vercel.app"], // Update this if your frontend port changes
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    // console.log(`⚡ Client connected: ${socket.id}`);

    // Join a chat room
    socket.on('join_chat', (conversationId) => {
      if (typeof conversationId !== 'string' || !conversationId.trim()) return;
      socket.join(conversationId);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};

module.exports = { initSocket, getIO };
