const { Router } = require('express');
const { getDesigners, getDesignerById } = require('../controllers/designerController');

const router = Router();

router.get('/', getDesigners);
router.get('/:id', getDesignerById);

module.exports = router;
