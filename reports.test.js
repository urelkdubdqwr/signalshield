import test from 'node:test';
import assert from 'node:assert/strict';
import { createReport, getReport, reportHtml } from './reports.js';

test('createReport returns a short shareable id and stores the report', () => {
  const report = { claim: 'redeem rewards', comparison: { overall: 'single-source' } };
  const id = createReport(report);
  assert.match(id, /^[a-f0-9]{12}$/);
  assert.deepEqual(getReport(id), report);
});

test('getReport returns null for an unknown id', () => {
  assert.equal(getReport('000000000000'), null);
});

test('reportHtml escapes report content and renders receipts', () => {
  const html = reportHtml({ claim: '<script>x</script>', verdict: 'REVIEW_BEFORE_ACTING', evidence: { sources: [{ title: 'Terms', url: 'https://example.com', excerpt: 'Read this.' }] } });
  assert.doesNotMatch(html, /<script>x<\/script>/);
  assert.match(html, /Terms/);
  assert.match(html, /Read this\./);
});
