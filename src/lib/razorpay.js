const Razorpay = require('razorpay');
const dotenv = require('dotenv');

dotenv.config();

let instance = null;

function isRazorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function getRazorpay() {
  if (!isRazorpayConfigured()) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env");
  }
  if (!instance) {
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return instance;
}

// Lazy getter so requiring this module never crashes boot without keys.
// Use getRazorpay() inside payment handlers.
module.exports = {
  get razorpay() {
    return getRazorpay();
  },
  getRazorpay,
  isRazorpayConfigured,
};
