const { prisma } = require('../../prisma');
const { getRazorpay } = require('../lib/razorpay');
const { assertValidPaise } = require('../lib/pricing');
const { verifySignature } = require('../lib/paymentVerify');

const createPaymentOrder = async (req, res) => {
  const { sourceId, type } = req.body;
  const userId = req.user;

  try {
    let priceToCharge = 0;
    let orderData = {};

    // 1. CHAT OFFER
    if (type === 'CHAT_OFFER') {
       const message = await prisma.message.findUnique({
          where: { id: sourceId },
          include: { sender: true }
       });

       if (!message || !message.isOffer) {
         return res.status(400).json({ error: "Invalid Offer" });
       }

       priceToCharge = message.offerPrice;

       orderData = {
           buyerId: userId,
           designerId: message.senderId, // Explicit Designer ID
           designId: null, // Custom orders have no design
           totalAmount: message.offerPrice,
           status: 'PENDING',
           requirements: message.offerTitle,
           designSnapshot: {
             title: message.offerTitle || "Custom Service",
             price: message.offerPrice,
             image: "",
             isCustom: true
           }
       };
    }

    // 2. CATALOG ITEM
    else if (type === 'CATALOG') {
        const design = await prisma.design.findUnique({ where: { id: sourceId }});
        if (!design) return res.status(404).json({ error: "Design not found" });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { addresses: { where: { isDefault: true } } }
        });

        priceToCharge = design.price;

        orderData = {
            buyerId: userId,
            designerId: design.designerId, // Explicit Designer ID
            designId: design.id,
            totalAmount: design.price,
            status: 'PENDING',
            designSnapshot: {
                title: design.title,
                price: design.price,
                image: design.imageUrl,
                material: design.material
            },
            shippingAddressSnapshot: user?.addresses[0] || {}
        };
    } else {
        return res.status(400).json({ error: "Invalid Order Type" });
    }

    try {
      assertValidPaise(priceToCharge);
    } catch (e) {
      return res.status(400).json({ error: "Invalid price" });
    }

    const options = {
      amount: priceToCharge, // Already in paise (DB stores paise) — do NOT multiply again
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { userId, sourceId, type }
    };

    const rpOrder = await getRazorpay().orders.create(options);

    const newOrder = await prisma.order.create({
        data: {
            ...orderData,
            razorpayOrderId: rpOrder.id,
        }
    });

    if (type === 'CHAT_OFFER') {
       await prisma.message.update({
         where: { id: sourceId },
         data: { offerStatus: 'ACCEPTED' }
       });
    }

    res.json({ ...rpOrder, dbOrderId: newOrder.id });

  } catch (error) {
    console.error("Razorpay Error:", error);
    res.status(500).json({ error: "Could not create payment order" });
  }
};

const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    dbOrderId
  } = req.body;

  const ok = verifySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    process.env.RAZORPAY_KEY_SECRET
  );

  if (!ok) {
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

module.exports = { createPaymentOrder, verifyPayment };
