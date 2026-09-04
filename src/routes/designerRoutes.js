const { Router } = require('express');
const { getDesigners, getDesignerById } = require('../controllers/designerController');

const router = Router();

/**
 * @openapi
 * /designers:
 *   get:
 *     tags: [Designers]
 *     summary: List users with the DESIGNER role
 *     security: []
 *     responses:
 *       200:
 *         description: Designers with profiles
 */
router.get('/', getDesigners);       // matches /designs
/**
 * @openapi
 * /designers/{id}:
 *   get:
 *     tags: [Designers]
 *     summary: Designer profile + portfolio
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Designer with designs
 *       404:
 *         description: Not found
 */
router.get('/:id', getDesignerById); // matches /designs/:id


module.exports = router;
