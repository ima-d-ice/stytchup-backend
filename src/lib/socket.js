let io;

const { prisma } = require('../../prisma');

function tokenUserId(token) {
  if (!token) return null;
  const raw = String(token).startsWith('Bearer ') ? String(token).slice(7) : String(token);
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(raw, process.env.JWT_SECRET || 'jwt_secret');
    return decoded.id || null;
  } catch {
    return null;
  }
}

const initSocket = (httpServer) => {
  const { Server } = require('socket.io');
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:3000", "https://stytchup.vercel.app"], // Update this if your frontend port changes
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Attach userId from the client's auth token (sent via `auth: { token }`).
  io.use((socket, next) => {
    socket.userId = tokenUserId(socket.handshake.auth?.token);
    next();
  });

  io.on('connection', (socket) => {
    // Join a chat room (participants only — verified against the DB)
    socket.on('join_chat', async (conversationId) => {
      if (typeof conversationId !== 'string' || !conversationId.trim()) return;
      if (!socket.userId) return;
      try {
        const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
        if (!convo) return;
        if (convo.user1Id !== socket.userId && convo.user2Id !== socket.userId) return;
        socket.join(conversationId);
      } catch { /* ignore */ }
    });

    // Join an order room for live status sync (buyer, designer, or admin)
    socket.on('join_order', async (orderId) => {
      if (typeof orderId !== 'string' || !orderId.trim()) return;
      if (!socket.userId) return;
      try {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { buyer: { select: { id: true } } },
        });
        if (!order) return;
        const me = await prisma.user.findUnique({ where: { id: socket.userId }, select: { role: true } });
        const isAdmin = me?.role === 'ADMIN';
        if (order.buyerId !== socket.userId && order.designerId !== socket.userId && !isAdmin) return;
        socket.join(`order:${orderId}`);
      } catch { /* ignore */ }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};

function emitOrderUpdated(orderId, status, extra = {}) {
  try {
    getIO().to(`order:${orderId}`).emit('order_updated', { orderId, status, ...extra });
  } catch { /* socket not initialized (tests) */ }
}

module.exports = { initSocket, getIO, emitOrderUpdated };
