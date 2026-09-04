import { Response } from 'express';
import { prisma } from '../../prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { getIO } from '../lib/socket';

// 1. Get or Create Chat
export const getOrCreateConversation = async (req: AuthRequest, res: Response) => {
  const { targetUserId } = req.body;
  const myId = req.user!;

  if (!targetUserId) {
    return res.status(400).json({ error: "targetUserId is required" });
  }
  if (targetUserId === myId) {
    return res.status(400).json({ error: "Cannot chat with yourself" });
  }

  try {
    // Sort IDs to prevent duplicates
    const [user1Id, user2Id] = [myId, targetUserId].sort();

    let conversation = await prisma.conversation.findUnique({
      where: { user1Id_user2Id: { user1Id, user2Id } },
      include: { 
        user1: { select: { name: true, profile: { select: { avatarUrl: true } } } },
        user2: { select: { name: true, profile: { select: { avatarUrl: true } } } }
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { user1Id, user2Id },
        include: { 
            user1: { select: { name: true, profile: { select: { avatarUrl: true } } } },
            user2: { select: { name: true, profile: { select: { avatarUrl: true } } } }
        }
      });
    }
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// 2. Send Message
export const sendMessage = async (req: AuthRequest, res: Response) => {
  const { conversationId, text, isOffer, offerPrice, offerTitle, relatedDesignId } = req.body;
  const senderId = req.user!;

  if (!conversationId) {
    return res.status(400).json({ error: "conversationId is required" });
  }

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
      return res.status(403).json({ error: "Not a participant" });
    }
    if (isOffer && (offerPrice === undefined || offerPrice === null)) {
      return res.status(400).json({ error: "offerPrice is required for offers" });
    }
    const newMessage = await prisma.message.create({
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
        const io = getIO();
        io.to(conversationId).emit("new_message", newMessage);
    } catch(e) { console.log("Socket emit skipped"); }

    // Bump conversation so inbox list ordering (updatedAt desc) stays fresh
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    res.json(newMessage);
  } catch (err) {
    res.status(500).json({ error: "Failed to send" });
  }
};

// 3. Get Messages
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!;
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.conversationId },
    });
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      return res.status(403).json({ error: "Not a participant" });
    }
    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.conversationId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { name: true, id: true } } }
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// 4. Get My Inbox List
export const getMyConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!;
    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      include: {
        user1: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
        user2: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
        messages: { take: 1, orderBy: { createdAt: 'desc' } }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};