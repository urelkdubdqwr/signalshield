import test from 'node:test';
import assert from 'node:assert/strict';
import { handleMcpRequest } from './mcp-server.js';

test('MCP lists SignalShield inspection tools', () => {
  const result = handleMcpRequest({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
  assert.equal(result.result.tools[0].name, 'inspect_claim');
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

test('MCP rejects empty claims', () => {
  const result = handleMcpRequest({
    jsonrpc: '2.0', id: 3, method: 'tools/call',
    params: { name: 'inspect_claim', arguments: { claim: '' } }
  });
  assert.equal(result.error.code, -32602);
});
