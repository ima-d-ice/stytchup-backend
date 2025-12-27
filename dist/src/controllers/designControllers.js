"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDesignById = exports.getDesigns = exports.addDesign = void 0;
const prisma_1 = require("../../prisma");
// 1. Add Design (Catalog Item)
const addDesign = async (req, res) => {
    const { title, description, price, category, imageUrl, 
    // New Slow Fashion Fields
    type, // 'CATALOG' or 'CUSTOM'
    material, // e.g. "100% Linen"
    sizeGuide // Markdown text
     } = req.body;
    const designerId = req.user;
    if (!title || price === undefined || !imageUrl) {
        return res.status(400).json({ error: 'Title, price, and imageUrl are required' });
    }
    try {
        const data = {
            title,
            price: Number(price), // Frontend should send this in Paise (₹1 = 100)
            category: category ?? null,
            imageUrl,
            // Slow Fashion Specifics
            type: type || 'CATALOG',
            designer: { connect: { id: designerId } }
        };
        if (material)
            data.material = material;
        if (sizeGuide)
            data.sizeGuide = sizeGuide;
        const newDesign = await prisma_1.prisma.design.create({ data });
        res.json(newDesign);
    }
    catch (err) {
        console.error("Add Design Error:", err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.addDesign = addDesign;
// 2. Get All Designs (For Browse Page)
const getDesigns = async (req, res) => {
    try {
        const designs = await prisma_1.prisma.design.findMany({
            where: { isActive: true },
            include: {
                designer: {
                    select: { name: true, profile: { select: { avatarUrl: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(designs);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getDesigns = getDesigns;
// 3. Get Single Design (For Product Page)
const getDesignById = async (req, res) => {
    const designId = req.params.id;
    try {
        const design = await prisma_1.prisma.design.findUnique({
            where: { id: designId },
            include: {
                designer: {
                    select: {
                        id: true,
                        name: true,
                        profile: { select: { avatarUrl: true, location: true } }
                    }
                }
            }
        });
        if (!design)
            return res.status(404).json({ error: 'Design not found' });
        res.json(design);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getDesignById = getDesignById;
