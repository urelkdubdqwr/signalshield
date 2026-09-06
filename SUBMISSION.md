# GatewayHacks 2026 Submission Draft

## Project name
SignalShield

## One-line description
Before you trust the link, make it show its receipts.

## Track
Open Impact & Community — financial empowerment and safer online decisions.

## Problem
People encounter financial and Web3 opportunities through persuasive posts, links, and claims. The cost of acting on incomplete or contradictory information can be high, while existing tools often return opaque scores without showing the evidence behind them.

## Solution
SignalShield is an evidence-first trust layer. A user submits a claim and up to five public sources. SignalShield extracts readable source text, maps relevant excerpts to the claim, compares support across sources, surfaces risk signals, and creates a shareable trust report.

It deliberately distinguishes:

- corroborated: multiple sources support the claim
- single-source: only one source supports it
- conflicting: sources contain opposing evidence
- unsupported: no matching evidence found

## Why it matters
SignalShield does not ask users to trust an opaque AI score. It gives them receipts, missing evidence, and safer next steps before they act. This is especially useful for people navigating unfamiliar financial offers, token launches, giveaways, and online opportunities.

## Technical implementation
- Node.js HTTP service
- HTML/CSS/JavaScript interface
- Public URL validation and private-network blocking
- Source extraction with deterministic excerpts
- Multi-source evidence comparison
- Persisted shareable reports
- JSON API
- MCP stdio server with `inspect_claim` and `create_trust_report`
- Automated tests and GitHub Actions CI

## Demo flow
1. Enter: `Users can redeem rewards within 30 days.`
2. Add two public source URLs.
3. Run the inspection.
4. Show the evidence receipts and cross-source result.
5. Open the shareable HTML report.
6. Run `tools/list` in the MCP server and call `create_trust_report`.

## Limitations
The current demo uses deterministic matching and public HTML sources. It is a transparent prototype, not a legal, financial, or security guarantee. Reports are persisted locally for the demo; a production deployment should use a managed database.

## Team / links
- GitHub: https://github.com/urelkdubdqwr/signalshield
- Live demo: https://signalshield-nlc1.onrender.com
- Health check: https://signalshield-nlc1.onrender.com/health
- Note: the current Render URL serves the UI and health endpoint; API routing needs one Render service configuration check before demo submission.
- Demo video: ADD_VIDEO_URL_HERE
