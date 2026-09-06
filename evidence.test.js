import test from 'node:test';
import assert from 'node:assert/strict';
import { extractEvidence, inspectUrl, buildEvidenceLedger } from './evidence.js';

test('extractEvidence returns title and normalized text from HTML', () => {
  const result = extractEvidence('<html><head><title>Official Terms</title></head><body><h1>Official Terms</h1><p>Redeem within 30 days.</p></body></html>', 'https://example.com/terms');
  assert.equal(result.title, 'Official Terms');
  assert.match(result.text, /Redeem within 30 days/);
  assert.equal(result.url, 'https://example.com/terms');
});

test('buildEvidenceLedger creates deterministic excerpts and IDs', () => {
  const result = buildEvidenceLedger('Redeem terms', [{
    title: 'Official Terms', url: 'https://example.com/terms', text: 'Redeem within 30 days. Contact support for help.'
  }]);
  assert.equal(result.claim, 'Redeem terms');
  assert.equal(result.sources.length, 1);
  assert.equal(result.sources[0].id, 'source-1');
  assert.equal(result.sources[0].excerpt, 'Redeem within 30 days.');
  assert.equal(result.sources[0].quality, 'sourced');
});

test('buildEvidenceLedger does not invent an excerpt when no claim terms match', () => {
  const result = buildEvidenceLedger('Guaranteed yield', [{ title: 'Terms', url: 'https://example.com', text: 'Contact support for help.' }]);
  assert.equal(result.sources[0].excerpt, null);
  assert.equal(result.sources[0].quality, 'unmatched');
});

test('inspectUrl rejects non-http URLs before fetching', async () => {
  await assert.rejects(() => inspectUrl('file:///etc/passwd'), /Only http/);
});

test('inspectUrl rejects localhost and private network targets', async () => {
  await assert.rejects(() => inspectUrl('http://127.0.0.1:8787'), /private network/);
});
