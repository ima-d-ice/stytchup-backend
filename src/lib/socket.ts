import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:3000", "https://stytchup.vercel.app"], // Update this if your frontend port changes
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket: Socket) => {
    // console.log(`⚡ Client connected: ${socket.id}`);

    // Join a chat room
    socket.on('join_chat', (conversationId: string) => {
      socket.join(conversationId);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};