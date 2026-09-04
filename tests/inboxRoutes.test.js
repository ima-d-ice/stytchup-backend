const { test } = require('node:test');
const assert = require('node:assert/strict');

// Regression test: Express matches routes in registration order, so
// GET /list must be registered BEFORE GET /:conversationId/messages,
// otherwise "list" is swallowed as a conversation ID.
const router = require('../src/routes/inboxRoutes');

function routePaths() {
  return (router.stack || [])
    .filter((l) => l.route)
    .map((l) => `${Object.keys(l.route.methods).join(',').toUpperCase()} ${l.route.path}`);
}

test('inbox router exposes all four endpoints', () => {
  const paths = routePaths();
  assert.ok(paths.includes('POST /create'), `missing POST /create in ${paths}`);
  assert.ok(paths.includes('POST /message'), `missing POST /message in ${paths}`);
  assert.ok(paths.includes('GET /list'), `missing GET /list in ${paths}`);
  assert.ok(paths.includes('GET /:conversationId/messages'), 'missing messages route');
});

test('GET /list is registered before GET /:conversationId/messages', () => {
  const paths = routePaths();
  const listIdx = paths.indexOf('GET /list');
  const paramIdx = paths.indexOf('GET /:conversationId/messages');
  assert.ok(listIdx !== -1 && paramIdx !== -1);
  assert.ok(listIdx < paramIdx, `wrong order: ${paths.join(' | ')}`);
});
