const { test } = require('node:test');
const assert = require('node:assert/strict');
const { TRANSITIONS, canTransition, assertTransition } = require('../src/lib/orderTransitions');

test('happy path: PENDING -> AWAITING_REQUIREMENTS -> IN_PROGRESS -> SHIPPED -> COMPLETED', () => {
  const flow = ['PENDING', 'AWAITING_REQUIREMENTS', 'IN_PROGRESS', 'SHIPPED', 'COMPLETED'];
  for (let i = 0; i < flow.length - 1; i++) {
    assert.equal(canTransition(flow[i], flow[i + 1]), true);
    assertTransition(flow[i], flow[i + 1]); // must not throw
  }
});

test('illegal jumps are rejected', () => {
  assert.equal(canTransition('PENDING', 'SHIPPED'), false);
  assert.equal(canTransition('AWAITING_REQUIREMENTS', 'COMPLETED'), false);
  assert.equal(canTransition('IN_PROGRESS', 'COMPLETED'), false);
  assert.equal(canTransition('PENDING', 'IN_PROGRESS'), false);
  assert.throws(() => assertTransition('PENDING', 'COMPLETED'), /Illegal order transition/);
});

test('CANCELLED is reachable from every active state', () => {
  for (const s of ['PENDING', 'AWAITING_REQUIREMENTS', 'IN_PROGRESS', 'SHIPPED']) {
    assert.equal(canTransition(s, 'CANCELLED'), true);
  }
});

test('terminal states have no outgoing transitions', () => {
  for (const s of ['COMPLETED', 'CANCELLED', 'REFUNDED']) {
    assert.deepEqual(TRANSITIONS[s], []);
  }
});

test('unknown statuses throw', () => {
  assert.throws(() => assertTransition('NOPE', 'SHIPPED'), /Unknown order status/);
});
