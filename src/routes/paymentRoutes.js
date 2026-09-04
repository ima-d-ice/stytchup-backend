const { Router } = require('express');
const { createPaymentOrder, verifyPayment } = require('../controllers/paymentControllers');
const { isAuthenticated } = require('../middleware/authMiddleware');

const router = Router();
/**
 * @openapi
 * /payments/create-order:
 *   post:
 *     tags: [Payments]
 *     summary: Create a Razorpay order + PENDING DB order (amount derived server-side in paise)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sourceId, type]
 *             properties:
 *               sourceId: { type: string, description: 'Design ID (CATALOG) or message ID (CHAT_OFFER)' }
 *               type: { type: string, enum: [CATALOG, CHAT_OFFER] }
 *     responses:
 *       200:
 *         description: Razorpay order + dbOrderId
 */
router.post('/create-order', isAuthenticated, createPaymentOrder);
/**
 * @openapi
 * /payments/verify:
 *   post:
 *     tags: [Payments]
 *     summary: Verify Razorpay signature, move order to AWAITING_REQUIREMENTS
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId]
 *             properties:
 *               razorpay_order_id: { type: string }
 *               razorpay_payment_id: { type: string }
 *               razorpay_signature: { type: string }
 *               dbOrderId: { type: string }
 *     responses:
 *       200:
 *         description: '{ success: true }'
 *       400:
 *         description: Invalid signature
 */
router.post('/verify', isAuthenticated, verifyPayment);

module.exports = router;
