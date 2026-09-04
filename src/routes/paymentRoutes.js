const { Router } = require('express');
const { createPaymentOrder, verifyPayment } = require('../controllers/paymentControllers');
const { isAuthenticated } = require('../middleware/authMiddleware');

const router = Router();
router.post('/create-order', isAuthenticated, createPaymentOrder);
router.post('/verify', isAuthenticated, verifyPayment);

module.exports = router;
