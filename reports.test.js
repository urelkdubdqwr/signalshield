import test from 'node:test';
import assert from 'node:assert/strict';
import { createReport, getReport } from './reports.js';

test('createReport returns a short shareable id and stores the report', () => {
  const report = { claim: 'redeem rewards', comparison: { overall: 'single-source' } };
  const id = createReport(report);
  assert.match(id, /^[a-f0-9]{12}$/);
  assert.deepEqual(getReport(id), report);
});

test('getReport returns null for an unknown id', () => {
  assert.equal(getReport('000000000000'), null);
});
