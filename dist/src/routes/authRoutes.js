"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authControllers_1 = require("../controllers/authControllers");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post('/register', authControllers_1.register);
router.post('/login', authControllers_1.login);
router.post('/google-sync', authControllers_1.googleSync); // 👈 Add this line
// Protect this route with middleware
router.post('/change-role', authMiddleware_1.isAuthenticated, authControllers_1.changeRole);
exports.default = router;
