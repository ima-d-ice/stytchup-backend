const { Router } = require('express');
const { getOrCreateConversation, sendMessage, getMessages, getMyConversations } = require('../controllers/inboxControllers');
const { isAuthenticated } = require('../middleware/authMiddleware');

const router = Router();
router.use(isAuthenticated);

router.post('/create', getOrCreateConversation);
router.post('/message', sendMessage);
// NOTE: /list must come before /:conversationId or "list" is treated as an ID
router.get('/list', getMyConversations);
router.get('/:conversationId/messages', getMessages);

module.exports = router;
