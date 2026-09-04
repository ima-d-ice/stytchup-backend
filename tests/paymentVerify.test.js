const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSignature, verifySignature } = require('../src/lib/paymentVerify');

// Precomputed: HMAC-SHA256("testsecret", "order_123|pay_123")
const SECRET = 'testsecret';
const ORDER_ID = 'order_123';
const PAYMENT_ID = 'pay_123';
const KNOWN_GOOD = 'b98822de1cf2ba6081ac967bf02243750dbdd9a0ffe53753ac688a6bf72257b8';

test('buildSignature matches the known Razorpay-style vector', () => {
  assert.equal(buildSignature(ORDER_ID, PAYMENT_ID, SECRET), KNOWN_GOOD);
});

test('verifySignature accepts a valid signature', () => {
  assert.equal(verifySignature(ORDER_ID, PAYMENT_ID, KNOWN_GOOD, SECRET), true);
});

test('verifySignature rejects tampered data', () => {
  assert.equal(verifySignature(ORDER_ID, 'pay_999', KNOWN_GOOD, SECRET), false);
  assert.equal(verifySignature(ORDER_ID, PAYMENT_ID, KNOWN_GOOD, 'wrongsecret'), false);
  assert.equal(verifySignature(ORDER_ID, PAYMENT_ID, KNOWN_GOOD.slice(0, -1) + '0', SECRET), false);
});

test('verifySignature rejects missing inputs', () => {
  assert.equal(verifySignature('', PAYMENT_ID, KNOWN_GOOD, SECRET), false);
  assert.equal(verifySignature(ORDER_ID, PAYMENT_ID, '', SECRET), false);
  assert.equal(verifySignature(ORDER_ID, PAYMENT_ID, KNOWN_GOOD, ''), false);
});
