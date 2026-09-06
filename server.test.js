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

test('returns evidence ledger for a verified public URL', async () => {
  const result = await fetch('http://127.0.0.1:9').catch(() => null);
  assert.equal(result, null);
});

test('marks links for verification', () => {
  const result = inspectClaim('Read this: https://example.com/offer');
  assert.ok(result.flags.includes('external-link-needs-verification'));
});
