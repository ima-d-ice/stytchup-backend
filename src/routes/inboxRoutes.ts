import { Router } from 'express';
import { getOrCreateConversation, sendMessage, getMessages, getMyConversations } from '../controllers/inboxControllers';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = Router();
router.use(isAuthenticated);

router.post('/create', getOrCreateConversation);
router.post('/message', sendMessage);
router.get('/:conversationId/messages', getMessages);
router.get('/list', getMyConversations);

export default router;