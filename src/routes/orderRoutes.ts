import { Router } from 'express';
import { 
    createOrderFromOffer, 
    markOrderAsShipped, 
    completeOrder, 
    getMyOrders,
    getDesignerOrders, 
    submitMeasurements 
} from '../controllers/orderController';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = Router();
router.use(isAuthenticated);

// Chat Offer -> Order
router.post('/accept-offer', createOrderFromOffer);

// The Main "Slow Fashion" Workflow
router.post('/submit-measurements', submitMeasurements); // Step 2: User adds size
router.post('/ship', markOrderAsShipped);               // Step 3: Designer ships
router.post('/complete', completeOrder);                // Step 4: User accepts

// Dashboards
router.get('/my-orders', getMyOrders);       // For Customer Dashboard
router.get('/designer-orders', getDesignerOrders); // For Designer Dashboard

export default router;