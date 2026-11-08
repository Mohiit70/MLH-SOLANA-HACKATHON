# MLH submission — copy-paste text

## Title

SolGuard — AI Transaction Bodyguard for Solana

## Tagline

Deterministic rules guard, AI explains. Know what a Solana transaction will do before you sign it.

## Description (150 words)

Solana transactions are signed blind. Wallet popups show raw program calls and hex, so normal users cannot tell a harmless transfer from a wallet drainer that sets a new token-account owner, grants an unlimited token approval, or sweeps SOL to an attacker. One wrong signature is irreversible.

SolGuard sits between the dApp request and the signature. Paste a transaction, connect a wallet, or click a demo: SolGuard decodes every instruction, simulates the transaction on devnet, runs a deterministic rules engine for known drainer patterns, and asks Claude to explain the result in plain English — a risk score (0–100), a verdict (SAFE / CAUTION / BLOCK), and a findings list. BLOCK disables the Sign button.

The key design point: deterministic rules guard, AI explains. The final verdict is the more severe of the rules verdict and the AI verdict, so the AI can never downgrade a critical finding. If the Claude key is missing, a rule-based explanation is used instead, so the demo never crashes.

## Built with

Next.js 14, TypeScript, Tailwind CSS, @solana/web3.js, @solana/spl-token, Solana wallet adapter, Anthropic Claude, zod, Vercel.

## Challenges to enter

- AI Track Top Prize
- Top 3 Overall

## Links

- Repo: https://github.com/Mohiit70/MLH-SOLANA-HACKATHON (private until submission; make public before submitting)
- Live demo: _TODO — Vercel URL after deploy_
- Demo video: _TODO — YouTube link, ≤ 2 minutes, says "MLH Solana Hackathon" at the start_
