"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const designerController_1 = require("../controllers/designerController");
const router = (0, express_1.Router)();
router.get('/', designerController_1.getDesigners); // matches /designs
router.get('/:id', designerController_1.getDesignerById); // matches /designs/:id
exports.default = router;
