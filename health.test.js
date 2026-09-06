import test from 'node:test';
import assert from 'node:assert/strict';
import { healthResponse } from './server.js';

test('healthResponse reports service readiness without secrets', () => {
  assert.deepEqual(healthResponse(), { service: 'signalshield', status: 'ok', version: '0.1.0' });
});
