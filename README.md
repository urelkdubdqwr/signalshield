# SignalShield 🛡️

[![CI](https://github.com/urelkdubdqwr/signalshield/actions/workflows/ci.yml/badge.svg)](https://github.com/urelkdubdqwr/signalshield/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**SignalShield** — evidence-first trust layer buat klaim Web3. paste claim → dapet risk signals + evidence gaps sebelum lo ape-ape gerak. dibangun dari pinggir kasur, di-ship pake bukti.

> *"trust me bro" is dead. receipts or gtfo.*

## 🎯 Cara kerja

- Paste klaim Web3 apapun → `POST /api/inspect`
- Dapet risk signals + evidence gaps
- Gak ada fabricated "safu" — tool yang ngarang aman itu lebih bahaya dari no tool
- **Live demo:** https://signalshield-nlc1.onrender.com

## 🏃 Jalankan

```bash
npm start
# → http://localhost:8787
```

MCP server buat agent lain: `node mcp-server.js` (stdio, zero deps)

## 🧪 Tests

High-risk language, wallet-action asks, suspicious links, MCP error handling — semua deterministic, gak pake tebak-tebakan.

## 📦 Deploy

`render.yaml` included. Render → New → Blueprint, connect repo. Selesai.

---

*Built at **STUDIO PINGGIR KASUR** — GatewayHacks 2026, submitted, live, receipted. 🦂 → 🦅 → 🔥*