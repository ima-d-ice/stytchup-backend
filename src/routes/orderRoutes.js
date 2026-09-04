const { Router } = require('express');
const {
    createOrderFromOffer,
    markOrderAsShipped,
    completeOrder,
    getMyOrders,
    getDesignerOrders,
    submitMeasurements
} = require('../controllers/orderController');
const { isAuthenticated } = require('../middleware/authMiddleware');

const router = Router();
router.use(isAuthenticated);

// Chat Offer -> Order
router.post('/accept-offer', createOrderFromOffer);

// The Main "Slow Fashion" Workflow
router.post('/submit-measurements', submitMeasurements);
router.post('/ship', markOrderAsShipped);
router.post('/complete', completeOrder);

// Dashboards
router.get('/my-orders', getMyOrders);
router.get('/designer-orders', getDesignerOrders);

module.exports = router;
