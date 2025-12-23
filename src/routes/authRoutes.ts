import { Router } from 'express';
import { register, login, changeRole, googleSync } from '../controllers/authControllers';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google-sync', googleSync); // 👈 Add this line

// Protect this route with middleware
router.post('/change-role', isAuthenticated, changeRole);

export default router;