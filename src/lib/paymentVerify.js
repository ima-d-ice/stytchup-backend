const crypto = require('crypto');

// Razorpay payment verification: signature = HMAC-SHA256(secret, "order_id|payment_id")
function buildSignature(razorpayOrderId, razorpayPaymentId, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
}

function verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature, secret) {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !secret) return false;
  const expected = buildSignature(razorpayOrderId, razorpayPaymentId, secret);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(razorpaySignature, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { buildSignature, verifySignature };
