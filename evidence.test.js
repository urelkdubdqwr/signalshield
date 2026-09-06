import test from 'node:test';
import assert from 'node:assert/strict';
import { compareEvidence, extractEvidence, inspectUrl } from './evidence.js';

test('compareEvidence marks two matching sources as corroborated', () => {
  const result = compareEvidence('redeem rewards', [
    { title: 'Issuer terms', url: 'https://issuer.example/terms', text: 'Users can redeem rewards within 30 days.' },
    { title: 'Partner FAQ', url: 'https://partner.example/faq', text: 'Rewards can be redeemed within 30 days by eligible users.' }
  ]);
  assert.equal(result.overall, 'corroborated');
  assert.equal(result.claims[0].status, 'corroborated');
  assert.equal(result.claims[0].source_count, 2);
});

test('compareEvidence marks a claim with opposing source language as conflicting', () => {
  const result = compareEvidence('redeem rewards', [
    { title: 'Issuer terms', url: 'https://issuer.example/terms', text: 'Users can redeem rewards within 30 days.' },
    { title: 'Updated notice', url: 'https://issuer.example/notice', text: 'Rewards cannot be redeemed and are non-refundable.' }
  ]);
  assert.equal(result.overall, 'conflicting');
});

test('compareEvidence marks one supporting source as single-source', () => {
  const result = compareEvidence('redeem rewards', [
    { title: 'Issuer terms', url: 'https://issuer.example/terms', text: 'Users can redeem rewards within 30 days.' },
    { title: 'About page', url: 'https://issuer.example/about', text: 'A community building new tools.' }
  ]);
  assert.equal(result.overall, 'single-source');
});

test('extractEvidence returns title and normalized text from HTML', () => {
  const result = extractEvidence('<title>Official Terms</title><p>Redeem within 30 days.</p>', 'https://example.com/terms');
  assert.equal(result.title, 'Official Terms');
  assert.match(result.text, /Redeem within 30 days/);
});

test('inspectUrl rejects private network targets', async () => {
  await assert.rejects(() => inspectUrl('http://127.0.0.1:8787'), /private network/);
});
