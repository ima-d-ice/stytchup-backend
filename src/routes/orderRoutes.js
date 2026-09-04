const { Router } = require('express');
const {
    createOrderFromOffer,
    markOrderAsShipped,
    completeOrder,
    getMyOrders,
    getDesignerOrders,
    submitMeasurements
} = require('../controllers/orderController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/requireRole');

const router = Router();
router.use(isAuthenticated);

// Chat Offer -> Order
/**
 * @openapi
 * /orders/accept-offer:
 *   post:
 *     tags: [Orders]
 *     summary: Legacy direct order-from-offer (payment flow preferred)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [messageId]
 *             properties:
 *               messageId: { type: string }
 *     responses:
 *       200:
 *         description: Created order
 */
router.post('/accept-offer', requireRole('CUSTOMER', 'ADMIN'), createOrderFromOffer);

// The Main "Slow Fashion" Workflow
/**
 * @openapi
 * /orders/submit-measurements:
 *   post:
 *     tags: [Orders]
 *     summary: Buyer submits sizing, AWAITING_REQUIREMENTS → IN_PROGRESS
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, measurements]
 *             properties:
 *               orderId: { type: string }
 *               measurements:
 *                 type: object
 *                 properties:
 *                   chest: { type: number }
 *                   waist: { type: number }
 *                   hips: { type: number }
 *                   height: { type: number }
 *                   unit: { type: string }
 *                   notes: { type: string }
 *     responses:
 *       200:
 *         description: Updated order
 */
router.post('/submit-measurements', requireRole('CUSTOMER', 'ADMIN'), submitMeasurements); // Step 2: User adds size
/**
 * @openapi
 * /orders/ship:
 *   post:
 *     tags: [Orders]
 *     summary: Designer ships, IN_PROGRESS → SHIPPED
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, trackingNumber, carrier]
 *             properties:
 *               orderId: { type: string }
 *               trackingNumber: { type: string }
 *               carrier: { type: string }
 *     responses:
 *       200:
 *         description: Updated order
 */
router.post('/ship', requireRole('DESIGNER', 'ADMIN'), markOrderAsShipped);               // Step 3: Designer ships
/**
 * @openapi
 * /orders/complete:
 *   post:
 *     tags: [Orders]
 *     summary: Buyer confirms delivery, SHIPPED → COMPLETED
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId: { type: string }
 *     responses:
 *       200:
 *         description: Updated order
 */
router.post('/complete', requireRole('CUSTOMER', 'ADMIN'), completeOrder);                // Step 4: User accepts

// Dashboards
/**
 * @openapi
 * /orders/my-orders:
 *   get:
 *     tags: [Orders]
 *     summary: Orders I bought
 *     responses:
 *       200:
 *         description: Order list desc
 */
router.get('/my-orders', getMyOrders);       // For Customer Dashboard
/**
 * @openapi
 * /orders/designer-orders:
 *   get:
 *     tags: [Orders]
 *     summary: Orders I need to fulfill
 *     responses:
 *       200:
 *         description: Order list desc
 */
router.get('/designer-orders', getDesignerOrders); // For Designer Dashboard

module.exports = router;
