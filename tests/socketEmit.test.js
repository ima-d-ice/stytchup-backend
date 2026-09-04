const { test } = require('node:test');
const assert = require('node:assert/strict');
const { emitOrderUpdated } = require('../src/lib/socket');

test('emitOrderUpdated is a safe no-op when sockets are not initialized', () => {
  assert.doesNotThrow(() => emitOrderUpdated('order_1', 'SHIPPED'));
  assert.doesNotThrow(() => emitOrderUpdated('order_1', 'SHIPPED', { trackingNumber: 'T1' }));
});
