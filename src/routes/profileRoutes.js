const { Router } = require('express');
const { getSettings, updateProfile, addAddress } = require('../controllers/profileController');
const { isAuthenticated } = require('../middleware/authMiddleware');

const router = Router();

router.use(isAuthenticated); // Protect all routes

/**
 * @openapi
 * /profile/settings:
 *   get:
 *     tags: [Profile]
 *     summary: Get own profile + addresses (password stripped)
 *     responses:
 *       200:
 *         description: Safe user object
 */
router.get('/settings', getSettings);
/**
 * @openapi
 * /profile/update:
 *   put:
 *     tags: [Profile]
 *     summary: Upsert profile fields
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               bio: { type: string }
 *               avatarUrl: { type: string }
 *               location: { type: string }
 *               website: { type: string }
 *               skills: { type: string, description: 'Comma-separated or array' }
 *               instagram: { type: string }
 *               behance: { type: string }
 *     responses:
 *       200:
 *         description: Updated profile
 */
router.put('/update', updateProfile);
/**
 * @openapi
 * /profile/address:
 *   post:
 *     tags: [Profile]
 *     summary: Add a shipping address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [street, city, state, zip, country]
 *             properties:
 *               label: { type: string }
 *               street: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               zip: { type: string }
 *               country: { type: string }
 *     responses:
 *       200:
 *         description: Created address
 */
router.post('/address', addAddress);

module.exports = router;
