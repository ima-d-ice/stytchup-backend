const { Router } = require('express');
const { register, login, changeRole, googleSync } = require('../controllers/authControllers');
const { isAuthenticated } = require('../middleware/authMiddleware');

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new customer
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Created user + backend JWT
 *       400:
 *         description: Validation error / user exists
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/register', register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email + password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: User + backend JWT (also set as httpOnly cookie)
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/login', login);

/**
 * @openapi
 * /auth/google-sync:
 *   post:
 *     tags: [Auth]
 *     summary: Find-or-create a Google user, return the Postgres ID for NextAuth
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *               name: { type: string }
 *     responses:
 *       200:
 *         description: DB user + backend JWT
 */
router.post('/google-sync', googleSync); // 👈 Add this line

// Protect this route with middleware
/**
 * @openapi
 * /auth/change-role:
 *   post:
 *     tags: [Auth]
 *     summary: Switch between customer and designer roles
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [designer, customer] }
 *     responses:
 *       200:
 *         description: Updated user
 */
router.post('/change-role', isAuthenticated, changeRole);

module.exports = router;
