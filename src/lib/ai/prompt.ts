// AI prompts (provider-agnostic) — see CLAUDE.md section 5.5.
import type { Analysis, DecodedInstruction, Finding, SimulationSummary } from "../types";

export const SYSTEM_PROMPT =
  "You are SolGuard, a Solana transaction safety explainer for non-technical users. " +
  "You are given decoded instructions, simulation results, and rule-engine findings. " +
  "Explain in simple English (6th grade) what this transaction will do and what could go wrong. " +
  "Never downplay CRITICAL or HIGH findings. " +
  "Respond with ONLY a JSON object, no markdown, no preamble.";

export function buildUserPrompt(
  instructions: DecodedInstruction[],
  simulation: SimulationSummary,
  findings: Finding[]
): string {
  const lines: string[] = [];
  lines.push("Decoded instructions:");
  for (const ix of instructions) {
    lines.push(
      `- [${ix.index}] ${ix.programName} — ${ix.kind}: ${ix.summary}`
    );
  }
  lines.push("");
  lines.push(
    `Simulation: ${simulation.ok ? "succeeded" : `failed (${simulation.error ?? "unknown reason"})`}.`
  );
  if (simulation.solBefore !== undefined) {
    lines.push(`Wallet balance before: ${simulation.solBefore} SOL.`);
  }
  if (simulation.solDelta !== undefined) {
    lines.push(`SOL change: ${simulation.solDelta} SOL.`);
  }
  if (simulation.logs.length > 0) {
    lines.push(`Logs: ${simulation.logs.slice(0, 8).join(" | ")}`);
  }
  lines.push("");
  lines.push("Rule-engine findings:");
  if (findings.length === 0) {
    lines.push("- None. No risky patterns found.");
  } else {
    for (const fnd of findings) {
      lines.push(`- [${fnd.severity}] ${fnd.title}: ${fnd.explanation}`);
    }
  }
  lines.push("");
  lines.push(
    'Return ONLY JSON: { "summary": string, "whatCouldGoWrong": string, "recommendation": string, "verdict": "SAFE" | "CAUTION" | "BLOCK" }'
  );
  return lines.join("\n");
}

export type AiExplanation = {
  summary: string;
  whatCouldGoWrong: string;
  recommendation: string;
  verdict: "SAFE" | "CAUTION" | "BLOCK";
};

export function fallbackExplanation(
  instructions: DecodedInstruction[],
  findings: Finding[]
): AiExplanation {
  const critical = findings.filter((f) => f.severity === "CRITICAL");
  const high = findings.filter((f) => f.severity === "HIGH");
  // If nothing above INFO was found, say so plainly — a lone INFO finding
  // such as a failed simulation is not a danger.
  const allInfo =
    findings.length === 0 || findings.every((f) => f.severity === "INFO");
  const issues = allInfo
    ? "No dangerous patterns found."
    : `Issues: ${findings.map((f) => f.title).join("; ")}.`;
  const summary = `This transaction contains ${instructions.length} instruction(s). ${issues}`;
  const whatCouldGoWrong =
    critical.length > 0
      ? "This transaction could hand control of your tokens or account to someone else. Do not sign it."
      : high.length > 0
        ? "This transaction could move a large amount of money or give broad permission to another address. Check every detail before signing."
        : findings.length > 0
          ? "There are some things to check, but nothing in this transaction is clearly dangerous on its own."
          : "Nothing in this transaction looks dangerous. It appears to be a normal transfer or approval.";
  const recommendation =
    critical.length > 0 || high.length > 0
      ? "Do not sign this transaction. If you were expecting it, ask the app that made it to explain each step first."
      : "You can sign this if you recognise the destination and the amounts. If anything looks unfamiliar, stop and check first.";
  const verdict =
    critical.length > 0 || high.length > 0
      ? "BLOCK"
      : findings.some((f) => f.severity === "MEDIUM")
        ? "CAUTION"
        : "SAFE";
  return { summary, whatCouldGoWrong, recommendation, verdict };
}
