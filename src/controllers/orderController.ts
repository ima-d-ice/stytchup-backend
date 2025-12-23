import { Response } from 'express';
import { prisma } from '../../prisma';
import { AuthRequest } from '../middleware/authMiddleware';

// 1. Submit Measurements (User Action)
// Triggers transition: AWAITING_REQUIREMENTS -> IN_PROGRESS
export const submitMeasurements = async (req: AuthRequest, res: Response) => {
  const { orderId, measurements } = req.body; 
  // measurements expects JSON: { "chest": 32, "waist": 28, "height": 165, "unit": "cm", "notes": "..." }

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.buyerId !== req.user) return res.status(403).json({ error: "Not authorized" });
    
    // Only allow if in correct state
    if (order.status !== 'AWAITING_REQUIREMENTS') {
        return res.status(400).json({ error: "Order is not awaiting requirements" });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        customerMeasurements: measurements,
        status: 'IN_PROGRESS' // <--- WORK BEGINS! Designer sees this now.
      }
    });

    res.json(updated);
  } catch (err) {
    console.error("Measurements Error:", err);
    res.status(500).json({ error: "Failed to submit measurements" });
  }
};

// 2. Mark as Shipped (Designer Action)
// Triggers transition: IN_PROGRESS -> SHIPPED
export const markOrderAsShipped = async (req: AuthRequest, res: Response) => {
  const { orderId, trackingNumber, carrier } = req.body;
  const designerId = req.user!;

  if (!trackingNumber || !carrier) {
      return res.status(400).json({ error: "Tracking details required" });
  }

  try {
    // 👇 FIX: Verify ownership using the new 'designerId' field directly
    // This works for BOTH Catalog items AND Custom Orders
    const order = await prisma.order.findFirst({
        where: { 
          id: orderId, 
          designerId: designerId // <--- DIRECT CHECK
        }
    });

    if (!order) return res.status(404).json({ error: "Order not found or unauthorized" });

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SHIPPED',
        trackingNumber,
        shippingCarrier: carrier,
      }
    });
    res.json(updated);
  } catch (err) {
    console.error("Shipping Error:", err);
    res.status(500).json({ error: "Failed to mark as shipped" });
  }
};

// 3. Complete Order (Buyer Action)
// Triggers transition: SHIPPED -> COMPLETED
export const completeOrder = async (req: AuthRequest, res: Response) => {
  const { orderId } = req.body;
  const userId = req.user!;

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.buyerId !== userId) return res.status(403).json({ error: "Unauthorized" });

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        deliveredAt: new Date() // Buyer confirms they have the physical item
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Completion failed" });
  }
};

// 4. Get My Orders (Buyer)
export const getMyOrders = async (req: AuthRequest, res: Response) => {
    try {
      const purchases = await prisma.order.findMany({
        where: { buyerId: req.user! },
        include: { 
          // We include design details, but handle if it's null (Custom Order)
          design: { select: { title: true, imageUrl: true, type: true } },
          buyer: { select: { name: true } } 
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(purchases);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
};

// 5. Get Designer Orders (Designer Dashboard)
export const getDesignerOrders = async (req: AuthRequest, res: Response) => {
    try {
      // 👇 FIX: Query using 'designerId' directly
      const orders = await prisma.order.findMany({
        where: { 
          designerId: req.user! // <--- DIRECT CHECK
        },
        include: { 
          buyer: { select: { name: true, email: true, profile: { select: { avatarUrl: true } } } }, 
          design: { select: { title: true, imageUrl: true } } 
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
};

// 6. Create Order from Offer (Chat System)
// Note: The Payment Controller handles this now, but we keep this for legacy safety
export const createOrderFromOffer = async (req: AuthRequest, res: Response) => {
    const { messageId } = req.body;
    const buyerId = req.user!;

    try {
        const offerMsg = await prisma.message.findUnique({
             where: { id: messageId },
        });

        if (!offerMsg || !offerMsg.isOffer) return res.status(400).json({ error: "Invalid offer" });

        // Mark Offer as Accepted
        await prisma.message.update({
            where: { id: messageId }, 
            data: { offerStatus: 'ACCEPTED' }
        });

        // Create Order 
        const order = await prisma.order.create({
            data: {
                buyerId,
                designerId: offerMsg.senderId, // <--- New Field
                designId: offerMsg.relatedDesignId || null, 
                totalAmount: offerMsg.offerPrice!, 
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
    } catch(e) { 
        console.error("Offer Accept Error:", e);
        res.status(500).json({error: "Error creating order"}); 
    }
};