# SignalShield 🛡️

> Before you trust the link, make it show its receipts.

SignalShield is an evidence-first trust layer for financial, Web3, and online opportunity claims. It surfaces risk signals and missing evidence before a user acts.

## Current vertical slice

- Browser UI at `http://localhost:8787`
- `POST /api/inspect` JSON endpoint
- MCP stdio server with `inspect_claim`
- Deterministic safety checks with no fabricated evidence
- Tests for high-risk language, wallet-action requests, links, and MCP errors

## Run

```bash
npm start
```

In another terminal:

```bash
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node mcp-server.js
```

## Hackathon direction

The next slices are source retrieval, evidence ledger, claim-to-source mapping, and a shareable report. The detector intentionally returns `INSUFFICIENT_EVIDENCE` when it has not actually verified a claim; it never pretends an empty evidence list is proof.

## Report API

`POST /api/inspect` accepts `{ "claim": "...", "sources": ["https://..."] }` and returns a report ID. Open `/report/<id>?format=html` for a shareable HTML receipt or `/report/<id>` for JSON. Reports are persisted in a local ignored data file; use a managed database before production deployment.

## License

MIT
