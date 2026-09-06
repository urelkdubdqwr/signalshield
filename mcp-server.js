import { inspectClaim } from './server.js';
import { createReport } from './reports.js';

const tools = [
  { name: 'inspect_claim', description: 'Inspect a financial, Web3, or online claim for risk signals and missing evidence.', inputSchema: { type: 'object', properties: { claim: { type: 'string' } }, required: ['claim'], additionalProperties: false } },
  { name: 'create_trust_report', description: 'Create a shareable SignalShield report from a claim.', inputSchema: { type: 'object', properties: { claim: { type: 'string' } }, required: ['claim'], additionalProperties: false } }
];

export function handleMcpRequest(request) {
  if (!request || request.jsonrpc !== '2.0') return { jsonrpc: '2.0', id: request?.id ?? null, error: { code: -32600, message: 'Invalid Request' } };
  if (request.method === 'tools/list') return { jsonrpc: '2.0', id: request.id, result: { tools } };
  if (request.method === 'tools/call') {
    const { name, arguments: args = {} } = request.params || {};
    if (!tools.some(tool => tool.name === name) || typeof args.claim !== 'string' || !args.claim.trim()) return { jsonrpc: '2.0', id: request.id, error: { code: -32602, message: 'claim must be a non-empty string' } };
    const report = inspectClaim(args.claim.trim());
    if (name === 'create_trust_report') { const id = createReport(report); return { jsonrpc: '2.0', id: request.id, result: { content: [{ type: 'text', text: JSON.stringify({ ...report, report_id: id, report_url: `/report/${id}` }) }] } }; }
    return { jsonrpc: '2.0', id: request.id, result: { content: [{ type: 'text', text: JSON.stringify(report) }] } };
  }
  return { jsonrpc: '2.0', id: request.id, error: { code: -32601, message: 'Method not found' } };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  process.stdin.setEncoding('utf8'); let buffer = '';
  process.stdin.on('data', chunk => { buffer += chunk; const lines = buffer.split('\n'); buffer = lines.pop(); for (const line of lines) { try { process.stdout.write(JSON.stringify(handleMcpRequest(JSON.parse(line))) + '\n'); } catch { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n'); } } });
}
