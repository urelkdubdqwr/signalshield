import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectClaim } from './server.js';

test('flags guaranteed returns and wallet action requests', () => {
  const result = inspectClaim('Guaranteed 100% profit. Connect wallet now.');
  assert.equal(result.verdict, 'REVIEW_BEFORE_ACTING');
  assert.deepEqual(result.flags, ['unrealistic-return-language', 'high-risk-action-request']);
});

test('does not invent evidence for a bare claim', () => {
  const result = inspectClaim('A new community project is launching soon.');
  assert.equal(result.verdict, 'INSUFFICIENT_EVIDENCE');
  assert.deepEqual(result.evidence, []);
});

test('survives a malformed Host header (regression: process-crash DoS)', async () => {
  const { server } = await import('./server.js');
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const net = await import('node:net');
  const raw = await new Promise((resolve, reject) => {
    const sock = net.connect(port, '127.0.0.1');
    let out = '';
    sock.on('data', (d) => (out += d));
    sock.on('close', () => resolve(out));
    sock.on('error', reject);
    sock.end('GET /health HTTP/1.1\r\nHost: bad host {\r\n\r\n');
  });
  assert.match(raw, /HTTP\/1\.1 400/);
  const ok = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).status, 'ok');
  await new Promise((r) => server.close(r));
});

test('marks links for verification', () => {
  const result = inspectClaim('Read this: https://example.com/offer');
  assert.ok(result.flags.includes('external-link-needs-verification'));
});
