const { test } = require('node:test');
const assert = require('node:assert/strict');
const { requireRole } = require('../src/middleware/requireRole');

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { res.body = obj; return res; };
  return res;
}

test('allows a request with an allowed role', () => {
  let nexted = false;
  requireRole('DESIGNER', 'ADMIN')({ user: 'u1', role: 'DESIGNER' }, mockRes(), () => { nexted = true; });
  assert.equal(nexted, true);
});

test('rejects with 403 on insufficient role', () => {
  const res = mockRes();
  let nexted = false;
  requireRole('DESIGNER', 'ADMIN')({ user: 'u1', role: 'CUSTOMER' }, res, () => { nexted = true; });
  assert.equal(nexted, false);
  assert.equal(res.statusCode, 403);
});

test('rejects unauthenticated requests with 401', () => {
  const res = mockRes();
  let nexted = false;
  requireRole('ADMIN')({ role: 'ADMIN' }, res, () => { nexted = true; });
  assert.equal(nexted, false);
  assert.equal(res.statusCode, 401);
});

test('defaults missing role to CUSTOMER', () => {
  const res = mockRes();
  let nexted = false;
  requireRole('CUSTOMER')({ user: 'u1' }, res, () => { nexted = true; });
  assert.equal(nexted, true);
});
