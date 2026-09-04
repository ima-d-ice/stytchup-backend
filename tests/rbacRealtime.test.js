const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

function routePaths(router) {
  return (router.stack || [])
    .filter((l) => l.route)
    .map((l) => `${Object.keys(l.route.methods).join(',').toUpperCase()} ${l.route.path}`);
}

test('admin router exposes all seven ops endpoints', () => {
  const router = require('../src/routes/adminRoutes');
  const paths = routePaths(router);
  for (const p of [
    'GET /users', 'GET /orders', 'GET /designs', 'POST /users/:id/role',
    'POST /orders/:id/cancel', 'POST /orders/:id/refund', 'PATCH /designs/:id/active',
  ]) {
    assert.ok(paths.includes(p), `missing admin route ${p} (have: ${paths.join(' | ')})`);
  }
});

test('index mounts /admin alongside all routers', () => {
  const src = read('src/index.js');
  for (const m of ['/auth', '/designs', '/profile', '/designers', '/payments', '/inbox', '/orders', '/admin']) {
    assert.match(src, new RegExp(`app\\.use\\('${m.replace('/', '\\/')}'`));
  }
});

test('designer-only routes require DESIGNER or ADMIN', () => {
  assert.match(read('src/routes/designRoutes.js'), /requireRole\('DESIGNER', 'ADMIN'\)/);
  assert.match(read('src/routes/orderRoutes.js'), /requireRole\('DESIGNER', 'ADMIN'\)/);
  assert.match(read('src/routes/adminRoutes.js'), /requireRole\('ADMIN'\)/);
});

test('every lifecycle mutation broadcasts order_updated', () => {
  for (const f of ['src/controllers/orderController.js', 'src/controllers/paymentControllers.js', 'src/controllers/adminController.js']) {
    assert.match(read(f), /emitOrderUpdated/, `${f} must broadcast order updates`);
  }
  const inbox = read('src/controllers/inboxControllers.js');
  assert.match(inbox, /offer_created/);
  assert.match(read('src/lib/socket.js'), /join_order/);
});

test('change-role self-service cannot grant ADMIN', () => {
  const src = read('src/controllers/authControllers.js');
  assert.doesNotMatch(src, /newRole = 'ADMIN'/);
  const admin = read('src/controllers/adminController.js');
  assert.match(admin, /CUSTOMER.*DESIGNER.*ADMIN/s);
});

test('cancel path uses the shared transition map', () => {
  assert.match(read('src/controllers/adminController.js'), /assertTransition\(order\.status, 'CANCELLED'\)/);
});
