import test from 'node:test';
import assert from 'node:assert/strict';
import { extractEvidence, inspectUrl } from './evidence.js';

test('extractEvidence returns title and normalized text from HTML', () => {
  const result = extractEvidence('<html><head><title>Official Terms</title></head><body><h1>Official Terms</h1><p>Redeem within 30 days.</p></body></html>', 'https://example.com/terms');
  assert.equal(result.title, 'Official Terms');
  assert.match(result.text, /Redeem within 30 days/);
  assert.equal(result.url, 'https://example.com/terms');
});

test('inspectUrl rejects non-http URLs before fetching', async () => {
  await assert.rejects(() => inspectUrl('file:///etc/passwd'), /Only http/);
});

test('inspectUrl rejects localhost and private network targets', async () => {
  await assert.rejects(() => inspectUrl('http://127.0.0.1:8787'), /private network/);
});
