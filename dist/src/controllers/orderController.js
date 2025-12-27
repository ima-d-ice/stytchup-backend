"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderFromOffer = exports.getDesignerOrders = exports.getMyOrders = exports.completeOrder = exports.markOrderAsShipped = exports.submitMeasurements = void 0;
const prisma_1 = require("../../prisma");
// 1. Submit Measurements (User Action)
// Triggers transition: AWAITING_REQUIREMENTS -> IN_PROGRESS
const submitMeasurements = async (req, res) => {
    const { orderId, measurements } = req.body;
    // measurements expects JSON: { "chest": 32, "waist": 28, "height": 165, "unit": "cm", "notes": "..." }
    try {
        const order = await prisma_1.prisma.order.findUnique({ where: { id: orderId } });
        if (!order)
            return res.status(404).json({ error: "Order not found" });
        if (order.buyerId !== req.user)
            return res.status(403).json({ error: "Not authorized" });
        // Only allow if in correct state
        if (order.status !== 'AWAITING_REQUIREMENTS') {
            return res.status(400).json({ error: "Order is not awaiting requirements" });
        }
        const updated = await prisma_1.prisma.order.update({
            where: { id: orderId },
            data: {
                customerMeasurements: measurements,
                status: 'IN_PROGRESS' // <--- WORK BEGINS! Designer sees this now.
            }
        });
        res.json(updated);
    }
    catch (err) {
        console.error("Measurements Error:", err);
        res.status(500).json({ error: "Failed to submit measurements" });
    }
};
exports.submitMeasurements = submitMeasurements;
// 2. Mark as Shipped (Designer Action)
// Triggers transition: IN_PROGRESS -> SHIPPED
const markOrderAsShipped = async (req, res) => {
    const { orderId, trackingNumber, carrier } = req.body;
    const designerId = req.user;
    if (!trackingNumber || !carrier) {
        return res.status(400).json({ error: "Tracking details required" });
    }
    try {
        // 👇 FIX: Verify ownership using the new 'designerId' field directly
        // This works for BOTH Catalog items AND Custom Orders
        const order = await prisma_1.prisma.order.findFirst({
            where: {
                id: orderId,
                designerId: designerId // <--- DIRECT CHECK
            }
        });
        if (!order)
            return res.status(404).json({ error: "Order not found or unauthorized" });
        const updated = await prisma_1.prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'SHIPPED',
                trackingNumber,
                shippingCarrier: carrier,
            }
        });
        res.json(updated);
    }
    catch (err) {
        console.error("Shipping Error:", err);
        res.status(500).json({ error: "Failed to mark as shipped" });
    }
};
exports.markOrderAsShipped = markOrderAsShipped;
// 3. Complete Order (Buyer Action)
// Triggers transition: SHIPPED -> COMPLETED
const completeOrder = async (req, res) => {
    const { orderId } = req.body;
    const userId = req.user;
    try {
        const order = await prisma_1.prisma.order.findUnique({ where: { id: orderId } });
        if (!order)
            return res.status(404).json({ error: "Order not found" });
        if (order.buyerId !== userId)
            return res.status(403).json({ error: "Unauthorized" });
        const updated = await prisma_1.prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                deliveredAt: new Date() // Buyer confirms they have the physical item
            }
        });
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ error: "Completion failed" });
    }
};
exports.completeOrder = completeOrder;
// 4. Get My Orders (Buyer)
const getMyOrders = async (req, res) => {
    try {
        const purchases = await prisma_1.prisma.order.findMany({
            where: { buyerId: req.user },
            include: {
                // We include design details, but handle if it's null (Custom Order)
                design: { select: { title: true, imageUrl: true, type: true } },
                buyer: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(purchases);
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};
exports.getMyOrders = getMyOrders;
// 5. Get Designer Orders (Designer Dashboard)
const getDesignerOrders = async (req, res) => {
    try {
        // 👇 FIX: Query using 'designerId' directly
        const orders = await prisma_1.prisma.order.findMany({
            where: {
                designerId: req.user // <--- DIRECT CHECK
            },
            include: {
                buyer: { select: { name: true, email: true, profile: { select: { avatarUrl: true } } } },
                design: { select: { title: true, imageUrl: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};
exports.getDesignerOrders = getDesignerOrders;
// 6. Create Order from Offer (Chat System)
// Note: The Payment Controller handles this now, but we keep this for legacy safety
const createOrderFromOffer = async (req, res) => {
    const { messageId } = req.body;
    const buyerId = req.user;
    try {
        const offerMsg = await prisma_1.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!offerMsg || !offerMsg.isOffer)
            return res.status(400).json({ error: "Invalid offer" });
        // Mark Offer as Accepted
        await prisma_1.prisma.message.update({
            where: { id: messageId },
            data: { offerStatus: 'ACCEPTED' }
        });
        // Create Order 
        const order = await prisma_1.prisma.order.create({
            data: {
                buyerId,
                designerId: offerMsg.senderId, // <--- New Field
                designId: offerMsg.relatedDesignId || null,
                totalAmount: offerMsg.offerPrice,
                status: 'AWAITING_REQUIREMENTS', // Assuming paid via chat button 
                requirements: offerMsg.offerTitle,
                designSnapshot: {
                    title: offerMsg.offerTitle,
                    price: offerMsg.offerPrice,
                    isCustom: true
                }
            }
        });
        res.json(order);
    }
    catch (e) {
        console.error("Offer Accept Error:", e);
        res.status(500).json({ error: "Error creating order" });
    }
};
exports.createOrderFromOffer = createOrderFromOffer;
