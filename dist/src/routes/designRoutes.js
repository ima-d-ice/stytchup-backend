"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const designControllers_1 = require("../controllers/designControllers");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get('/', designControllers_1.getDesigns); // matches /designs
router.get('/:id', designControllers_1.getDesignById); // matches /designs/:id
router.post('/add', authMiddleware_1.isAuthenticated, designControllers_1.addDesign); // matches /designs/add
exports.default = router;
