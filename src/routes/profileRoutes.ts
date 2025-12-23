import { Router } from 'express';
import { getSettings, updateProfile, addAddress } from '../controllers/profileController';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = Router();

router.use(isAuthenticated); // Protect all routes

router.get('/settings', getSettings);
router.put('/update', updateProfile);
router.post('/address', addAddress);

export default router;