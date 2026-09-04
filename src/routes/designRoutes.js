const { Router } = require('express');
const { addDesign, getDesigns, getDesignById } = require('../controllers/designControllers');
const { isAuthenticated } = require('../middleware/authMiddleware');

const router = Router();

router.get('/', getDesigns);
router.get('/:id', getDesignById);
router.post('/add', isAuthenticated, addDesign);

module.exports = router;
