const { Router } = require('express');
const { getOrCreateConversation, sendMessage, getMessages, getMyConversations } = require('../controllers/inboxControllers');
const { isAuthenticated } = require('../middleware/authMiddleware');

const router = Router();
router.use(isAuthenticated);

/**
 * @openapi
 * /inbox/create:
 *   post:
 *     tags: [Inbox]
 *     summary: Get or create a 1:1 conversation (IDs sorted to dedupe)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetUserId]
 *             properties:
 *               targetUserId: { type: string }
 *     responses:
 *       200:
 *         description: Conversation
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Conversation' }
 */
router.post('/create', getOrCreateConversation);
/**
 * @openapi
 * /inbox/message:
 *   post:
 *     tags: [Inbox]
 *     summary: Send a text message or custom offer (emits socket new_message)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [conversationId]
 *             properties:
 *               conversationId: { type: string }
 *               text: { type: string }
 *               isOffer: { type: boolean }
 *               offerPrice: { type: integer, description: 'Paise' }
 *               offerTitle: { type: string }
 *               relatedDesignId: { type: string }
 *     responses:
 *       200:
 *         description: Created message
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Message' }
 */
router.post('/message', sendMessage);
// NOTE: /list must come before /:conversationId or "list" is treated as an ID
/**
 * @openapi
 * /inbox/list:
 *   get:
 *     tags: [Inbox]
 *     summary: List my conversations with last message
 *     responses:
 *       200:
 *         description: Conversations ordered by updatedAt desc
 */
router.get('/list', getMyConversations);
/**
 * @openapi
 * /inbox/{conversationId}/messages:
 *   get:
 *     tags: [Inbox]
 *     summary: Message history for a conversation (participants only)
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Messages ascending
 */
router.get('/:conversationId/messages', getMessages);

module.exports = router;
