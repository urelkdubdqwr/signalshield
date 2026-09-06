import test from 'node:test';
import assert from 'node:assert/strict';
import { handleMcpRequest } from './mcp-server.js';

test('MCP lists SignalShield inspection tools', () => {
  const result = handleMcpRequest({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
  assert.deepEqual(result.result.tools.map(tool => tool.name), ['inspect_claim', 'create_trust_report']);
});

test('MCP inspect_claim returns the same safety verdict as the API', () => {
  const result = handleMcpRequest({
    jsonrpc: '2.0', id: 2, method: 'tools/call',
    params: { name: 'inspect_claim', arguments: { claim: 'Guaranteed 100% profit. Connect wallet now.' } }
  });
  const payload = JSON.parse(result.result.content[0].text);
  assert.equal(payload.verdict, 'REVIEW_BEFORE_ACTING');
  assert.ok(payload.flags.includes('high-risk-action-request'));
});

test('MCP creates a persisted shareable trust report', () => {
  const result = handleMcpRequest({
    jsonrpc: '2.0', id: 3, method: 'tools/call',
    params: { name: 'create_trust_report', arguments: { claim: 'A community project is launching.' } }
  });
  const payload = JSON.parse(result.result.content[0].text);
  assert.match(payload.report_url, /^\/report\/[a-f0-9]{12}$/);
});

test('MCP rejects empty claims', () => {
  const result = handleMcpRequest({
    jsonrpc: '2.0', id: 4, method: 'tools/call',
    params: { name: 'inspect_claim', arguments: { claim: '' } }
  });
  assert.equal(result.error.code, -32602);
});
