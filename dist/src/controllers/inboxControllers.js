"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyConversations = exports.getMessages = exports.sendMessage = exports.getOrCreateConversation = void 0;
const prisma_1 = require("../../prisma");
const socket_1 = require("../lib/socket");
// 1. Get or Create Chat
const getOrCreateConversation = async (req, res) => {
    const { targetUserId } = req.body;
    const myId = req.user;
    try {
        // Sort IDs to prevent duplicates
        const [user1Id, user2Id] = [myId, targetUserId].sort();
        let conversation = await prisma_1.prisma.conversation.findUnique({
            where: { user1Id_user2Id: { user1Id, user2Id } },
            include: {
                user1: { select: { name: true, profile: { select: { avatarUrl: true } } } },
                user2: { select: { name: true, profile: { select: { avatarUrl: true } } } }
            }
        });
        if (!conversation) {
            conversation = await prisma_1.prisma.conversation.create({
                data: { user1Id, user2Id },
                include: {
                    user1: { select: { name: true, profile: { select: { avatarUrl: true } } } },
                    user2: { select: { name: true, profile: { select: { avatarUrl: true } } } }
                }
            });
        }
        res.json(conversation);
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};
exports.getOrCreateConversation = getOrCreateConversation;
// 2. Send Message
const sendMessage = async (req, res) => {
    const { conversationId, text, isOffer, offerPrice, offerTitle, relatedDesignId } = req.body;
    const senderId = req.user;
    try {
        const newMessage = await prisma_1.prisma.message.create({
            data: {
                conversationId,
                senderId,
                text: text || (isOffer ? "Custom Offer" : ""),
                // Custom Offer Fields
                isOffer: !!isOffer,
                offerPrice: isOffer ? Number(offerPrice) : null,
                offerTitle: isOffer ? offerTitle : null,
                offerStatus: isOffer ? 'PENDING' : null,
                relatedDesignId: relatedDesignId || null,
            },
            include: { sender: { select: { name: true, id: true } } }
        });
        // Real-time Emit
        try {
            const io = (0, socket_1.getIO)();
            io.to(conversationId).emit("new_message", newMessage);
        }
        catch (e) {
            console.log("Socket emit skipped");
        }
        res.json(newMessage);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to send" });
    }
};
exports.sendMessage = sendMessage;
// 3. Get Messages
const getMessages = async (req, res) => {
    try {
        const messages = await prisma_1.prisma.message.findMany({
            where: { conversationId: req.params.conversationId },
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: { name: true, id: true } } }
        });
        res.json(messages);
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};
exports.getMessages = getMessages;
// 4. Get My Inbox List
const getMyConversations = async (req, res) => {
    try {
        const userId = req.user;
        const conversations = await prisma_1.prisma.conversation.findMany({
            where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
            include: {
                user1: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
                user2: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
                messages: { take: 1, orderBy: { createdAt: 'desc' } }
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(conversations);
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};
exports.getMyConversations = getMyConversations;
