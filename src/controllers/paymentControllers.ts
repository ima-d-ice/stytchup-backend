import { Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../../prisma'; 
import { AuthRequest } from '../middleware/authMiddleware';
import { razorpay } from '../lib/razorpay'; 

export const createPaymentOrder = async (req: AuthRequest, res: Response) => {
  const { amount, sourceId, type } = req.body; 
  const userId = req.user!;

  try {
    const options = {
      amount: amount, 
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { userId, sourceId, type }
    };

    const rpOrder = await razorpay.orders.create(options);
    let dbOrderId = "";

    // 1. CHAT OFFER
    if (type === 'CHAT_OFFER') {
       const message = await prisma.message.findUnique({
          where: { id: sourceId },
          include: { sender: true }
       });

       if (!message || !message.isOffer) {
         return res.status(400).json({ error: "Invalid Offer" });
       }

       const newOrder = await prisma.order.create({
         data: {
           buyerId: userId,
           designerId: message.senderId, // 👈 Explicit Designer ID
           designId: null, // Custom orders have no design
           totalAmount: message.offerPrice!,
           status: 'AWAITING_REQUIREMENTS', 
           razorpayOrderId: rpOrder.id,
           requirements: message.offerTitle, 
           designSnapshot: {
             title: message.offerTitle || "Custom Service",
             price: message.offerPrice,
             image: "", 
             isCustom: true
           }
         }
       });

       await prisma.message.update({
         where: { id: sourceId },
         data: { offerStatus: 'ACCEPTED' }
       });

       dbOrderId = newOrder.id;
    } 
    
    // 2. CATALOG ITEM
    else if (type === 'CATALOG') {
        const design = await prisma.design.findUnique({ where: { id: sourceId }});
        if (!design) return res.status(404).json({ error: "Design not found" });

        const user = await prisma.user.findUnique({ 
            where: { id: userId },
            include: { addresses: { where: { isDefault: true } } }
        });

        const newOrder = await prisma.order.create({
            data: {
                buyerId: userId,
                designerId: design.designerId, // 👈 Explicit Designer ID
                designId: design.id,
                totalAmount: design.price, 
                status: 'AWAITING_REQUIREMENTS', 
                razorpayOrderId: rpOrder.id,
                designSnapshot: { 
                    title: design.title, 
                    price: design.price, 
                    image: design.imageUrl,
                    material: design.material 
                },
                shippingAddressSnapshot: user?.addresses[0] || {} 
            }
        });
        dbOrderId = newOrder.id;
    }

    res.json({ ...rpOrder, dbOrderId });

  } catch (error: any) {
    console.error("Razorpay Error:", error);
    res.status(500).json({ error: "Could not create payment order" });
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    dbOrderId 
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, error: "Invalid Signature" });
  }

  try {
    await prisma.order.update({
        where: { id: dbOrderId }, 
        data: {
            status: 'AWAITING_REQUIREMENTS', 
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature
        }
    });

    res.json({ success: true });
  } catch (err) {
    console.error("DB Verify Error:", err);
    res.status(500).json({ error: "Payment verified but DB failed" });
  }
};