# SolGuard: AI Transaction Bodyguard for Solana

Hackathon: MLH Solana Hackathon (Nov 6-8, 2026). Target prizes: AI Track Top Prize + Top 3 Overall. Submission deadline: Nov 8, 1:00 PM EST = 11:30 PM IST. Internal deadline to submit: 10:00 PM IST.

## 0. Rules for the coding agent (read first)

Do NOT ask questions. Pick sensible defaults and keep moving. Total build budget is about 4.5 hours.
Work milestone by milestone (section 7). After each milestone: run npm run build, fix errors, git commit (see section 10 for commit style; real timestamps only).
Strict TypeScript, no any. Never hardcode secrets. Use .env.local.
Devnet only. No mainnet. Show a visible "DEVNET" badge in the UI.
Prefer boring and working over clever. If behind schedule, use the cut line in section 7.
Before using an unfamiliar API, skim the docs in section 9. If a URL is dead, search for the current one.
Demo must never crash: every external call (RPC, Claude API) needs try/catch and a fallback.

## 1. Product in one paragraph

User connects a Solana wallet (or pastes a base64 transaction, or clicks a demo sample). SolGuard decodes every instruction, simulates the transaction on devnet, runs a deterministic rules engine for known drainer patterns, then asks Claude to explain it in plain English. Output: a risk score (0-100), a verdict (SAFE / CAUTION / BLOCK), a plain-language summary, and a findings list. "Sign & Send" is disabled when the verdict is BLOCK.

Key design point for the pitch: deterministic rules guard, AI explains. The final verdict is the max of rules verdict and AI verdict, so the AI can never downgrade a critical finding.

## 1b. Problem, solution, and pitch

Problem: Solana transactions are signed blind. Wallet popups show raw program calls and hex, so normal users cannot tell a harmless transfer from a "wallet drainer" that sets a new token-account owner, grants an unlimited token approval, or sweeps SOL to an attacker. One wrong signature is irreversible, and transactions settle in about a second.

Solution: SolGuard sits between the dApp request and the signature. It decodes the transaction, simulates it, applies deterministic drainer rules, and uses Claude to explain the result in plain English with a clear verdict. BLOCK means the Sign button is disabled.

How it works (5 steps): (1) get the base64 tx from a demo, paste, or connected wallet; (2) decode every instruction; (3) simulate on devnet for balance changes and logs; (4) run the rules engine for a risk score; (5) Claude writes the plain-English explanation, and the final verdict is the more severe of rules and AI.

Why it fits the AI Track: the AI does real work (turning on-chain data into human decisions), and it is safety-bounded so it cannot downgrade critical findings. Pitch line: "Deterministic rules guard, AI explains."

## 2. Tech stack

Next.js 14 (App Router) + TypeScript + Tailwind CSS
@solana/web3.js@1 (v1.x, stable with wallet-adapter), @solana/spl-token
@solana/wallet-adapter-base, -react, -react-ui (Phantom etc. auto-detected via Wallet Standard, wallets array can be empty)
@anthropic-ai/sdk (server-side only, inside the API route)
zod for validating the AI JSON output
vitest for a few rules tests (optional, only if time permits)
Deploy: Vercel

## 3. Environment variables (.env.example)

```
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
SOLANA_RPC_SERVER=https://api.devnet.solana.com
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-5-5
```

If ANTHROPIC_API_KEY is missing or the call fails, fall back to a template explanation built from the rule findings (section 5.4).

## 4. Folder structure

```
solguard/
  CLAUDE.md                  (this file)
  README.md                  (what, why, how to run, screenshots, architecture)
  .env.example
  package.json
  docs/
    ARCHITECTURE.md          (diagram in mermaid + data flow)
    DEMO_SCRIPT.md           (60-90 sec video script)
    SUBMISSION.md            (title, tagline, description, tech used: copy-paste for MLH form)
  public/
    logo.svg
  src/
    app/
      layout.tsx
      page.tsx               (single page UI)
      providers.tsx          (ConnectionProvider, WalletProvider, WalletModalProvider)
      globals.css
      api/analyze/route.ts   (POST: decode + simulate + rules + AI)
    components/
      Header.tsx             (logo, DEVNET badge, wallet button)
      TxInput.tsx            (textarea for base64 tx + Analyze button)
      DemoButtons.tsx        (Safe transfer / Unlimited approve / Drainer bundle)
      VerdictCard.tsx        (verdict, score gauge, plain-English summary)
      RiskGauge.tsx          (semicircle or bar, green/amber/red)
      FindingsList.tsx       (severity chips + explanation per finding)
      InstructionList.tsx    (collapsible decoded instructions)
      SendButton.tsx         (sign + send; disabled on BLOCK)
    lib/
      types.ts               (shared types, section 5.1)
      solana/
        programs.ts          (known program IDs map)
        decode.ts            (deserialize tx, resolve ALTs, decode instructions)
        simulate.ts          (simulateTransaction + SOL balance delta)
        demoTx.ts            (builders for the 3 demo transactions)
      risk/
        rules.ts             (rule functions -> Finding[])
        score.ts             (Finding[] -> score + verdict)
      ai/
        prompt.ts            (system prompt + user prompt builder)
        explain.ts           (Claude call + zod validation + fallback)
    tests/
      rules.test.ts          (optional)
```

## 5. Core spec

### 5.1 Types (src/lib/types.ts)

```ts
export type Severity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Verdict = "SAFE" | "CAUTION" | "BLOCK";

export interface DecodedInstruction {
  index: number;
  programId: string;
  programName: string;          // "System Program", "SPL Token", "Unknown", ...
  kind: string;                 // "Transfer", "Approve", "SetAuthority", "Unknown", ...
  summary: string;              // one-line human text
  accounts: string[];
  details: Record<string, string | number | boolean>;
}

export interface Finding {
  id: string;                   // e.g. "TOKEN_SET_AUTHORITY_OWNER"
  severity: Severity;
  title: string;
  explanation: string;          // plain English, no jargon
  instructionIndex?: number;
}

export interface SimulationSummary {
  ok: boolean;
  error?: string;
  logs: string[];
  feePayer: string;
  solBefore?: number;           // SOL
  solAfter?: number;            // SOL
  solDelta?: number;            // negative = outflow
}

export interface Analysis {
  verdict: Verdict;
  riskScore: number;            // 0-100
  summary: string;              // 2-3 sentences, plain English
  whatCouldGoWrong: string;
  recommendation: string;
  findings: Finding[];
  instructions: DecodedInstruction[];
  simulation: SimulationSummary;
  aiUsed: boolean;              // false if fallback template was used
}
```

### 5.2 Decoding (src/lib/solana/decode.ts)

Input: base64 string. Try VersionedTransaction.deserialize(Buffer.from(b64, "base64")). This handles legacy and v0.
For v0 with address lookup tables: fetch ALTs via connection.getAddressLookupTable(key), then TransactionMessage.decompile(message, { addressLookupTableAccounts }) to get TransactionInstruction[].
Fee payer = first account key.
Decode by program ID, switching on instruction data:
System Program (11111111111111111111111111111111): u32 LE at data[0..4]. 2 = Transfer (use SystemInstruction.decodeTransfer), 1 = Assign (account owner changed to another program), 0 = CreateAccount, 8 = Allocate. Others = "Other".
SPL Token (TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA) and Token-2022 (TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb): discriminator = data[0]. 3 Transfer, 12 TransferChecked, 4 Approve, 13 ApproveChecked, 6 SetAuthority, 9 CloseAccount, 8 Burn. Amount is u64 LE at data[1..9] for Transfer/Approve (for the Checked variants too, followed by a decimals byte). SetAuthority: data[1] = authority type (0 MintTokens, 1 FreezeAccount, 2 AccountOwner, 3 CloseAccount), data[2] = option flag, then the new authority pubkey (32 bytes). Account order: Approve = [source, delegate, owner]; SetAuthority = [account, currentAuthority]; CloseAccount = [account, destination, owner]; Transfer = [source, destination, owner].
Associated Token (ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL), Compute Budget (ComputeBudget111111111111111111111111111111), Memo (MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr and Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo), Jupiter v6 (JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4), Stake (Stake11111111111111111111111111111111111111): label by name, kind: "Known program call".
Anything else: programName: "Unknown", kind: "Unknown".
Put all known program IDs in programs.ts as Record<string, string>.

### 5.3 Simulation (src/lib/solana/simulate.ts)

connection.simulateTransaction(vtx, { sigVerify: false, replaceRecentBlockhash: true, commitment: "confirmed", accounts: { encoding: "base64", addresses: [feePayer] } }).
Before: connection.getBalance(feePayer). After: value.accounts[0].lamports if present. solDelta = (after - before) / 1e9.
Return logs (value.logs) and err if any. Simulation failure is NOT fatal: set ok: false, keep going with static analysis, and mention it in the UI ("simulation failed, static analysis only").
Wrap in try/catch with a 10 second timeout.

### 5.4 Rules engine (src/lib/risk/rules.ts) and scoring (score.ts)

Each rule takes (instructions, simulation) and returns Finding[]. Rules:

| id | trigger | severity |
|---|---|---|
| TOKEN_SET_AUTHORITY_OWNER | SetAuthority with type 2 (AccountOwner) or 3 (CloseAccount) | CRITICAL |
| SYSTEM_ASSIGN | System Assign to any program | CRITICAL |
| TOKEN_APPROVE_UNLIMITED | Approve/ApproveChecked with amount >= 2^63 | HIGH |
| TOKEN_APPROVE | any other Approve | MEDIUM |
| SOL_DRAIN | solDelta <= -90% of solBefore, or the sum of SystemProgram transfers >= 90% of the balance | HIGH |
| CLOSE_ACCOUNT_REDIRECT | CloseAccount where destination != owner | HIGH |
| MULTI_TRANSFER_SAME_DEST | 2 or more transfers to the same destination | MEDIUM |
| UNKNOWN_PROGRAM | any instruction with an Unknown program | MEDIUM |
| SIM_FAILED | simulation failed | INFO |

Score: CRITICAL = 90, HIGH = 70, MEDIUM = 40, LOW = 15, INFO = 0. riskScore = min(100, max + 5 * (count of other findings with severity >= MEDIUM)). Verdict: >= 70 BLOCK, 30-69 CAUTION, < 30 SAFE.

Fallback explanation (no AI): build summary from finding titles, e.g. "This transaction contains N instruction(s). Issues: ...". Set aiUsed: false.

### 5.5 AI explanation (src/lib/ai/*)

Call Claude from the server route only. client.messages.create({ model: process.env.ANTHROPIC_MODEL, max_tokens: 1000, system, messages }).
System prompt: "You are SolGuard, a Solana transaction safety explainer for non-technical users. You are given decoded instructions, simulation results, and rule-engine findings. Explain in simple English (6th grade) what this transaction will do and what could go wrong. Never downplay CRITICAL or HIGH findings. Respond with ONLY a JSON object, no markdown, no preamble."
Required JSON: { "summary": string, "whatCouldGoWrong": string, "recommendation": string, "verdict": "SAFE"|"CAUTION"|"BLOCK" }.
Strip ``` fences, JSON.parse, validate with zod. On any failure, use the fallback.
Final verdict = the more severe of (rules verdict, AI verdict). Final riskScore comes from the rules engine.

### 5.6 API route (src/app/api/analyze/route.ts)

POST { txBase64: string } returns Analysis. Validate input with zod. Return HTTP 400 with { error } for an undecodable tx. Never leak the API key or stack traces.

### 5.7 UI (single page, dark theme, clean)

Header: logo "SolGuard", tagline "Your AI bodyguard for every Solana transaction", DEVNET badge, wallet connect button.
Left column: DemoButtons (3), TxInput textarea, Analyze button with loading state.
Right column: VerdictCard (big colored verdict, RiskGauge, summary, whatCouldGoWrong, recommendation), FindingsList, InstructionList (collapsed by default), SendButton.
SendButton: enabled for SAFE (single click) and CAUTION (confirm dialog); disabled with the label "Blocked by SolGuard" for BLOCK. Sends via useWallet().sendTransaction on devnet.
Empty state: a friendly "Try a demo transaction" prompt. Responsive layout. Colors: SAFE green, CAUTION amber, BLOCK red.

### 5.8 Demo transactions (src/lib/solana/demoTx.ts)

Build VersionedTransaction objects (unsigned) using the connected wallet's public key as fee payer and owner, serialize to base64, and feed them through the same analyze flow:

Safe: SystemProgram.transfer of 0.01 SOL to a fixed devnet address.
Unlimited approve: SPL Token createApproveInstruction with amount 2n**64n - 1n to a random "attacker" pubkey (use a fake token account address; simulation will fail, which is fine).
Drainer bundle: transfer of 95% of the wallet balance to the attacker + createSetAuthorityInstruction (AccountOwner) to the attacker + an instruction to an unknown program ID.

These are never sent. They exist only to demonstrate detection.

## 6. Quality bar (what judges see)

It runs live at a public URL. Wallet connect works. All 3 demos give clearly different verdicts (green, amber/red, red).
The AI output is readable and useful. The score gauge animates.
README has a screenshot/GIF, an architecture diagram, and "how it works" in 5 lines.
Code is clean and typed, with a short comment on each lib file.

## 7. Milestones and time budget

| # | Milestone | Time | Done when |
|---|---|---|---|
| M0 | Scaffold: Next.js + Tailwind + wallet adapter providers, .env.example, git init | 25 min | Wallet connect button works on devnet, npm run build passes |
| M1 | types.ts, programs.ts, decode.ts | 45 min | Pasting a base64 tx returns correct decoded instruction list |
| M2 | demoTx.ts + DemoButtons | 30 min | 3 demos produce base64 and decode correctly |
| M3 | simulate.ts + rules.ts + score.ts + API route (rules only, no AI) | 45 min | Demo 1 = SAFE, Demo 2 = BLOCK or CAUTION, Demo 3 = BLOCK |
| M4 | ai/prompt.ts + explain.ts, integrated into route, fallback tested with key removed | 30 min | Plain-English summary appears; works without the key |
| M5 | Full UI: VerdictCard, RiskGauge, FindingsList, InstructionList, SendButton, loading and error states | 60 min | Looks polished on desktop and mobile |
| M6 | Deploy to Vercel, env vars set, README, docs/, screenshots | 30 min | Public URL works end to end |
| M7 | Record the 60-90 sec demo video, fill the MLH submission | 30 min | Submitted before 10 PM IST |

Cut line if behind schedule: drop ALT resolution (support legacy and simple v0 only), drop InstructionList polish, drop vitest tests, drop SendButton (keep Analyze only). NEVER cut: demo transactions, rules engine, AI explanation with fallback, deploy.

## 8. Docs to write

README.md: problem (wallet drainers and unreadable transactions), solution, how it works (5 steps), architecture, rules table, tech stack, run locally, env vars, roadmap (browser extension / wallet-adapter wrapper, mainnet, more rules, x402-paid API for other agents), screenshots.
docs/ARCHITECTURE.md: mermaid flow: User -> UI -> /api/analyze -> decode -> simulate -> rules -> Claude explain -> merge verdict -> UI.
docs/DEMO_SCRIPT.md: 0:00-0:15 problem ("one wrong signature can empty your wallet and the screen shows hex"), 0:15-0:35 safe tx -> green, 0:35-1:05 drainer tx -> red with plain-English explanation and Sign disabled, 1:05-1:20 how it works (rules + AI) and roadmap.
docs/SUBMISSION.md: title, one-line tagline, 150-word description, "built with" list, challenges to enter (AI Track Top Prize, Top 3 Overall), links (repo, live demo, video).

## 9. Docs to read before coding

Solana docs (transactions, instructions, accounts): https://solana.com/docs
web3.js v1 API reference: https://solana-labs.github.io/solana-web3.js/v1.x/
Wallet adapter (React + Next.js setup): https://github.com/anza-xyz/wallet-adapter
SPL Token program (instruction layouts): https://github.com/solana-program/token and the @solana/spl-token npm package
Anthropic Messages API: https://docs.claude.com
Next.js App Router route handlers: https://nextjs.org/docs
MLH event page and submission form: https://www.mlh.com/events/solana-hackathon

## 10. Git workflow (honest history)

Commit small and often, about every 20-30 minutes or whenever something works. Real timestamps only: never set GIT_AUTHOR_DATE or GIT_COMMITTER_DATE, never rewrite history to change dates.
Style: short, lowercase, human, conventional-commit prefixes (init, feat, fix, style, docs, chore, refactor).
Suggested messages, in order:
init: next.js app with tailwind and wallet adapter setup
feat: decode system and spl token instructions from base64 tx
feat: add demo txs (safe, unlimited approve, drainer bundle)
feat: rules engine and risk scoring
feat: simulate tx on devnet and compute sol delta
fix: handle failed simulation without breaking the analysis
feat: claude explanation with zod validation and rule-based fallback
fix: never let ai downgrade critical findings
feat: verdict card, risk gauge and findings list
fix: disable send button when verdict is block
style: tighten layout on mobile
chore: env example and vercel config
docs: readme with architecture and rules table
docs: demo script and submission text
Use real fix commits when you actually fix something. Do not invent filler commits.

## 11. Kickoff

Start now with M0. Report progress in one line per milestone. Do not stop until M6 is complete.
