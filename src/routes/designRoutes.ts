import { Router } from 'express';
import { addDesign, getDesigns, getDesignById } from '../controllers/designControllers';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getDesigns);       // matches /designs
router.get('/:id', getDesignById); // matches /designs/:id
router.post('/add', isAuthenticated, addDesign); // matches /designs/add

export default router;