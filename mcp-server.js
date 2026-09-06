import { inspectClaim } from './server.js';

const tool = {
  name: 'inspect_claim',
  description: 'Inspect a financial, Web3, or online claim for risk signals and missing evidence.',
  inputSchema: {
    type: 'object',
    properties: { claim: { type: 'string', description: 'Claim or URL to inspect.' } },
    required: ['claim'],
    additionalProperties: false
  }
};

export function handleMcpRequest(request) {
  if (!request || request.jsonrpc !== '2.0') return { jsonrpc: '2.0', id: request?.id ?? null, error: { code: -32600, message: 'Invalid Request' } };
  if (request.method === 'tools/list') return { jsonrpc: '2.0', id: request.id, result: { tools: [tool] } };
  if (request.method === 'tools/call') {
    const { name, arguments: args = {} } = request.params || {};
    if (name !== tool.name || typeof args.claim !== 'string' || !args.claim.trim()) return { jsonrpc: '2.0', id: request.id, error: { code: -32602, message: 'claim must be a non-empty string' } };
    return { jsonrpc: '2.0', id: request.id, result: { content: [{ type: 'text', text: JSON.stringify(inspectClaim(args.claim)) }] } };
  }
  return { jsonrpc: '2.0', id: request.id, error: { code: -32601, message: 'Method not found' } };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  process.stdin.setEncoding('utf8');
  let buffer = '';
  process.stdin.on('data', chunk => { buffer += chunk; for (const line of buffer.split('\n').slice(0, -1)) { try { process.stdout.write(JSON.stringify(handleMcpRequest(JSON.parse(line))) + '\n'); } catch { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n'); } } buffer = buffer.split('\n').at(-1); });
}
