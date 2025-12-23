import { Router } from 'express';
import { createPaymentOrder, verifyPayment } from '../controllers/paymentControllers';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = Router();
router.post('/create-order', isAuthenticated, createPaymentOrder);
router.post('/verify', isAuthenticated, verifyPayment);
export default router;