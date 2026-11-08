# Demo script — 60–90 seconds

## 0:00–0:15 — The problem

"One wrong signature can empty your wallet — and the screen shows hex. Solana transactions are signed blind. A drainer can set a new token-account owner, grant an unlimited approval, or sweep your SOL, and you would never know from the popup."

## 0:15–0:35 — Safe transaction → green

Click **Safe transfer**. SolGuard decodes it, simulates it on devnet, and shows a green SAFE verdict, risk score near zero, and a plain-English summary: "This sends 0.01 SOL to a friend. Nothing else changes."

## 0:35–1:05 — Drainer transaction → red

Click **Drainer bundle**. SolGuard flags it red: BLOCK, risk score 95. Findings: token account owner is being changed (CRITICAL), call to an unknown program, and almost all SOL leaving the wallet. Claude explains it in plain English. The Sign button reads "Blocked by SolGuard" and is disabled.

## 1:05–1:20 — How it works and roadmap

"Deterministic rules guard, AI explains. The rules catch the drainer patterns, Claude explains them in plain English, and the AI can never downgrade a critical finding. Next: a browser extension, mainnet, and more rules."

## Notes for the recording

- Say "MLH Solana Hackathon" at the start of the video.
- Show the working app, not slides. Keep it under 2 minutes.
- Devnet only — the DEVNET badge is visible in the header.
