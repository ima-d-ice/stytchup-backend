"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.isAuthenticated);
// Chat Offer -> Order
router.post('/accept-offer', orderController_1.createOrderFromOffer);
// The Main "Slow Fashion" Workflow
router.post('/submit-measurements', orderController_1.submitMeasurements); // Step 2: User adds size
router.post('/ship', orderController_1.markOrderAsShipped); // Step 3: Designer ships
router.post('/complete', orderController_1.completeOrder); // Step 4: User accepts
// Dashboards
router.get('/my-orders', orderController_1.getMyOrders); // For Customer Dashboard
router.get('/designer-orders', orderController_1.getDesignerOrders); // For Designer Dashboard
exports.default = router;
