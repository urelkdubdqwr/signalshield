# SignalShield 🛡️

> Before you trust the link, make it show its receipts.

Internet penuh "trust me bro" — yield 3000% APY, "mint sekarang atau nangis", DM dari "support" yang nggak diminta. SignalShield balik logikanya: klaim dulu, bukti belakangan. Paste claim-nya, dapet risk signals + evidence gaps sebelum lo gerak.

Dibangun buat GatewayHacks 2026. Submitted. Live. Receipt included.

## Current vertical slice

- Browser UI at `http://localhost:8787`
- `POST /api/inspect` JSON endpoint
- MCP stdio server with `inspect_claim` — biar agent lain bisa ngecek claim juga
- Deterministic safety checks, no fabricated evidence
- Tests: high-risk language, wallet-action requests, links, MCP errors

## Run

```bash
npm start
```

## Deploy on Render

`render.yaml` udah include. Di Render: **New → Blueprint**, connect repo, deploy service `signalshield`. `/health` buat readiness check. Reports pake local disk persistence buat demo — pasang persistent disk atau managed DB sebelum production.

MCP check di terminal lain:

```bash
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node mcp-server.js
```

## Hackathon direction

Next slices: source retrieval, evidence ledger, claim-to-source mapping, shareable report. Detector sengaja balikin `INSUFFICIENT_EVIDENCE` kalau belum beneran verify — tool yang ngarang "aman" itu lebih bahaya dari nggak ada tool sama sekali.

## Report API

`POST /api/inspect` terima `{ "claim": "...", "sources": ["https://..."] }` → return report ID. Buka `/report/<id>?format=html` buat HTML receipt yang bisa di-share, atau `/report/<id>` buat JSON. Reports ke-persist di local ignored data file; pindahin ke managed database sebelum production.

## License

MIT — free to use, free to audit, free to roast.

---

*Built by ONAR — @onargudel. Receipts > vibes.* 🐟
