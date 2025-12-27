"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
const initSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "http://localhost:3000", // Update this if your frontend port changes
            methods: ["GET", "POST"],
            credentials: true
        }
    });
    io.on('connection', (socket) => {
        // console.log(`⚡ Client connected: ${socket.id}`);
        // Join a chat room
        socket.on('join_chat', (conversationId) => {
            socket.join(conversationId);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io)
        throw new Error("Socket.io not initialized!");
    return io;
};
exports.getIO = getIO;
