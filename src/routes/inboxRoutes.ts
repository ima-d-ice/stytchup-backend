import { Router } from 'express';
import { getOrCreateConversation, sendMessage, getMessages, getMyConversations } from '../controllers/inboxControllers';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = Router();
router.use(isAuthenticated);

router.post('/create', getOrCreateConversation);
router.post('/message', sendMessage);
// NOTE: /list must come before /:conversationId or "list" is treated as an ID
router.get('/list', getMyConversations);
router.get('/:conversationId/messages', getMessages);

export default router;