import { Router } from 'express';
import { getDesigners ,getDesignerById} from '../controllers/designerController';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getDesigners);       // matches /designs
router.get('/:id', getDesignerById); // matches /designs/:id


export default router;