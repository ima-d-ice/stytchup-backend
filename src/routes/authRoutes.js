const { Router } = require('express');
const { register, login, changeRole, googleSync } = require('../controllers/authControllers');
const { isAuthenticated } = require('../middleware/authMiddleware');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google-sync', googleSync);

router.post('/change-role', isAuthenticated, changeRole);

module.exports = router;
