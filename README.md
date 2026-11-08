# SolGuard — AI Transaction Bodyguard for Solana

**MLH Solana Hackathon 2026, AI Track. Target: AI Track Top Prize + Top 3 Overall.**

## The problem

Solana transactions are signed blind. Wallet popups show raw program calls and hex, so normal users cannot tell a harmless transfer from a wallet drainer that sets a new token-account owner, grants an unlimited token approval, or sweeps SOL to an attacker. One wrong signature is irreversible, and transactions settle in about a second.

## The solution

SolGuard sits between the dApp request and the signature. It decodes the transaction, simulates it on devnet, applies deterministic drainer rules, and uses AI (Gemini gemini-3.5-flash by default, set by AI_MODEL) to explain the result in plain English with a clear verdict. **BLOCK means the Sign button is disabled.**

Pitch line: **"Deterministic rules guard, AI explains."**

## How it works (5 steps)

1. Get the base64 transaction from a demo, paste, or connected wallet.
2. Decode every instruction (System Program, SPL Token, Token-2022, and more).
3. Simulate on devnet for balance changes and logs.
4. Run the rules engine for a risk score (0–100) and verdict (SAFE / CAUTION / BLOCK).
5. The AI writes the plain-English explanation. The final verdict is the more severe of rules and AI — the AI can never downgrade a critical finding.

## Rules

| Finding | Trigger | Severity |
|---|---|---|
| TOKEN_SET_AUTHORITY_OWNER | SetAuthority with type AccountOwner / CloseAccount | CRITICAL |
| SYSTEM_ASSIGN | System Assign to any program | CRITICAL |
| TOKEN_APPROVE_UNLIMITED | Approve with amount ≥ 2^63 | HIGH |
| TOKEN_APPROVE | Any other Approve | MEDIUM |
| SOL_DRAIN | 90%+ of SOL balance leaves | HIGH |
| CLOSE_ACCOUNT_REDIRECT | CloseAccount destination ≠ owner | HIGH |
| MULTI_TRANSFER_SAME_DEST | 2+ transfers to the same destination | MEDIUM |
| UNKNOWN_PROGRAM | Instruction to an unknown program | MEDIUM |
| SIM_FAILED | Simulation failed | INFO |

Score: CRITICAL 90, HIGH 70, MEDIUM 40, LOW 15, INFO 0. Risk score = min(100, max + 5 × other MEDIUM+ findings). Verdict: ≥ 70 BLOCK, 30–69 CAUTION, < 30 SAFE.

## Tech stack

Next.js 14 (App Router) + TypeScript + Tailwind CSS, @solana/web3.js v1, @solana/spl-token, Solana wallet adapter, plain fetch to the configured AI provider (server-side only), zod. Devnet only — a visible DEVNET badge is shown in the UI.

## Run locally

What you need: Node.js 18 or newer (check with `node -v`), npm (comes with
Node), and a free Gemini API key from Google AI Studio
(aistudio.google.com → Get API key). No wallet and no SOL are needed to try
the demos — they run on devnet with a funded demo payer.

```bash
git clone https://github.com/Mohiit70/MLH-SOLANA-HACKATHON.git
cd MLH-SOLANA-HACKATHON
npm install
cp .env.example .env.local   # open .env.local, paste your key after AI_API_KEY=
npm run dev
```

Open http://localhost:3000, connect a wallet (devnet) or click a demo:
Normal transfer, Unlimited approval, Wallet drainer. Without a key the app
still works — it falls back to a rule-based explanation and labels it
"Plain rules read". For a production build instead: `npm run build` then
`npm run start` (port 3000). To put it on the internet, import the repo in
Vercel and add the same variables from `.env.example` in the dashboard.

## Environment variables

See `.env.example`. `NEXT_PUBLIC_SOLANA_RPC` / `SOLANA_RPC_SERVER` default to the public devnet RPC. `AI_PROVIDER` defaults to `gemini`, `AI_MODEL` to `gemini-3.5-flash`.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Demo script: [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md). Submission text: [docs/SUBMISSION.md](docs/SUBMISSION.md).

## Roadmap

Browser extension / wallet-adapter wrapper, mainnet support, more rules (Jupiter swaps, staking, NFT programs), x402-paid API for other agents.

## Screenshots

Captured from the running app on devnet (no AI key, so the rule-based explanation is shown).

### Safe transfer — SAFE, risk score 0/100

![Safe transfer verdict: SAFE, risk score 0 out of 100](docs/screenshots/safe.png?raw=true)

### Unlimited approve — BLOCK, risk score 70/100

![Unlimited approve verdict: BLOCK, risk score 70 out of 100, HIGH finding for unlimited token approval](docs/screenshots/approve-block.png?raw=true)

### Drainer bundle — BLOCK, risk score 95/100

![Drainer bundle verdict: BLOCK, risk score 95 out of 100, CRITICAL finding for token account owner change](docs/screenshots/drainer-block.png?raw=true)
