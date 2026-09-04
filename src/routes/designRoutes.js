const { Router } = require('express');
const { addDesign, getDesigns, getDesignById } = require('../controllers/designControllers');
const { isAuthenticated } = require('../middleware/authMiddleware');

const router = Router();

/**
 * @openapi
 * /designs:
 *   get:
 *     tags: [Designs]
 *     summary: List active catalog designs
 *     security: []
 *     responses:
 *       200:
 *         description: Designs with designer name + avatar
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Design' }
 */
router.get('/', getDesigns);       // matches /designs
/**
 * @openapi
 * /designs/{id}:
 *   get:
 *     tags: [Designs]
 *     summary: Get a single design by ID
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Design detail
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Design' }
 *       404:
 *         description: Not found
 */
router.get('/:id', getDesignById); // matches /designs/:id
/**
 * @openapi
 * /designs/add:
 *   post:
 *     tags: [Designs]
 *     summary: Publish a design (price in paise)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, price, imageUrl]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               price: { type: integer, description: 'Paise (₹1 = 100)' }
 *               imageUrl: { type: string }
 *               category: { type: string }
 *               type: { type: string, enum: [CATALOG, CUSTOM] }
 *               material: { type: string }
 *               sizeGuide: { type: string }
 *     responses:
 *       200:
 *         description: Created design
 */
router.post('/add', isAuthenticated, addDesign); // matches /designs/add

module.exports = router;
