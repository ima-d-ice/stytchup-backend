const { test, after } = require('node:test');
const assert = require('node:assert/strict');

const { app, httpServer } = require('../src/index');

let base;
const ready = new Promise((resolve) => {
  httpServer.listen(0, () => {
    base = `http://localhost:${httpServer.address().port}`;
    resolve();
  });
});
after(() => new Promise((resolve) => httpServer.close(resolve)));

test('GET /health returns { ok: true }', async () => {
  await ready;
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});

test('GET /openapi.json exposes all routers', async () => {
  await ready;
  const res = await fetch(`${base}/openapi.json`);
  assert.equal(res.status, 200);
  const spec = await res.json();
  for (const p of [
    '/auth/login', '/designs', '/designers', '/profile/settings',
    '/payments/create-order', '/inbox/list', '/orders/ship', '/health',
    '/admin/users', '/admin/orders', '/admin/designs',
  ]) {
    assert.ok(spec.paths[p], `missing OpenAPI path ${p}`);
  }
});

test('GET /docs serves Swagger UI', async () => {
  await ready;
  const res = await fetch(`${base}/docs/`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /swagger/i);
});
