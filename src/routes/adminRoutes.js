const { Router } = require('express');
const { isAuthenticated } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/requireRole');
const {
  listUsers, listOrders, listDesigns, setUserRole, cancelOrder, refundOrder, setDesignActive,
} = require('../controllers/adminController');

const router = Router();
router.use(isAuthenticated, requireRole('ADMIN'));

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List users (admin)
 *     responses:
 *       200:
 *         description: Users (passwords excluded)
 */
router.get('/users', listUsers);
/**
 * @openapi
 * /admin/orders:
 *   get:
 *     tags: [Admin]
 *     summary: List recent orders (admin)
 *     responses:
 *       200:
 *         description: Orders with buyer/design info
 */
router.get('/orders', listOrders);
/**
 * @openapi
 * /admin/designs:
 *   get:
 *     tags: [Admin]
 *     summary: List recent designs (admin)
 *     responses:
 *       200:
 *         description: Designs with designer info
 */
router.get('/designs', listDesigns);
/**
 * @openapi
 * /admin/users/{id}/role:
 *   post:
 *     tags: [Admin]
 *     summary: Grant a role, including ADMIN (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [CUSTOMER, DESIGNER, ADMIN] }
 *     responses:
 *       200:
 *         description: Updated user
 */
router.post('/users/:id/role', setUserRole);
/**
 * @openapi
 * /admin/orders/{id}/cancel:
 *   post:
 *     tags: [Admin]
 *     summary: Cancel an order from any active state (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cancelled order (emits order_updated)
 *       400:
 *         description: Cannot cancel from current state
 */
router.post('/orders/:id/cancel', cancelOrder);
/**
 * @openapi
 * /admin/orders/{id}/refund:
 *   post:
 *     tags: [Admin]
 *     summary: Mark an order refunded (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Refunded order (emits order_updated)
 */
router.post('/orders/:id/refund', refundOrder);
/**
 * @openapi
 * /admin/designs/{id}/active:
 *   patch:
 *     tags: [Admin]
 *     summary: Activate/deactivate a design (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated design
 */
router.patch('/designs/:id/active', setDesignActive);

module.exports = router;
