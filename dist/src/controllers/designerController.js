"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDesignerById = exports.getDesigners = void 0;
const prisma_1 = require("../../prisma");
const getDesigners = async (req, res) => {
    try {
        const designers = await prisma_1.prisma.user.findMany({
            where: { role: 'DESIGNER' },
            include: { profile: true
            },
        });
        res.json(designers);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getDesigners = getDesigners;
const getDesignerById = async (req, res) => {
    const designerId = req.params.id;
    try {
        const designer = await prisma_1.prisma.user.findUnique({
            where: { id: designerId },
            include: { profile: true, designs: true },
        });
        console.log(designer);
        if (!designer)
            return res.status(404).json({ error: 'Designer not found' });
        res.json(designer);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getDesignerById = getDesignerById;
