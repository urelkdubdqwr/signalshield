# Contributing to SignalShield

PRs welcome. Keep it evidence-first: a detector check must never return "safe" without real verification — `INSUFFICIENT_EVIDENCE` is the correct answer when evidence is missing.

## Setup

```bash
git clone https://github.com/urelkdubdqwr/signalshield.git
cd signalshield
npm start        # UI at http://localhost:8787
npm test         # node --test, zero dependencies
```

## Rules

- Zero runtime dependencies. Node >= 20 stdlib only.
- Every new check ships with a test in `*.test.js`.
- Open an issue first for anything bigger than a bugfix.
