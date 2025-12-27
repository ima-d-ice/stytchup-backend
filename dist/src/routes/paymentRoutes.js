"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentControllers_1 = require("../controllers/paymentControllers");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post('/create-order', authMiddleware_1.isAuthenticated, paymentControllers_1.createPaymentOrder);
router.post('/verify', authMiddleware_1.isAuthenticated, paymentControllers_1.verifyPayment);
exports.default = router;
