const { test } = require('node:test');
const assert = require('node:assert/strict');
const { toPaise, fromPaise, assertValidPaise, formatINR } = require('../src/lib/pricing');

test('toPaise converts rupees to integer paise', () => {
  assert.equal(toPaise(499), 49900);
  assert.equal(toPaise('19.99'), 1999);
  assert.equal(toPaise(0), 0);
});

test('toPaise rounds fractional paise', () => {
  assert.equal(toPaise(10.005), 1001); // Math.round
});

test('toPaise rejects garbage', () => {
  assert.throws(() => toPaise('abc'), /Invalid rupee amount/);
  assert.throws(() => toPaise(-5), /Invalid rupee amount/);
  assert.throws(() => toPaise(NaN), /Invalid rupee amount/);
});

test('fromPaise divides by 100', () => {
  assert.equal(fromPaise(49900), 499);
});

test('assertValidPaise accepts positive integers only', () => {
  assert.equal(assertValidPaise(100), 100);
  assert.throws(() => assertValidPaise(0), /Invalid paise/);
  assert.throws(() => assertValidPaise(-50), /Invalid paise/);
  assert.throws(() => assertValidPaise(10.5), /Invalid paise/);
  assert.throws(() => assertValidPaise('100'), /Invalid paise/);
});

test('formatINR renders paise as INR', () => {
  const out = formatINR(49900);
  assert.match(out, /499/);
  assert.match(out, /₹/);
});
