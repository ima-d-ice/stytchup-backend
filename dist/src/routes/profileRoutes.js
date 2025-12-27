"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profileController_1 = require("../controllers/profileController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.isAuthenticated); // Protect all routes
router.get('/settings', profileController_1.getSettings);
router.put('/update', profileController_1.updateProfile);
router.post('/address', profileController_1.addAddress);
exports.default = router;
