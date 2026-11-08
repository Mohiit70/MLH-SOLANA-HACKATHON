// Risk scoring — see CLAUDE.md section 5.4.
// CRITICAL = 90, HIGH = 70, MEDIUM = 40, LOW = 15, INFO = 0.
// riskScore = min(100, max + 5 * (count of other findings with severity >= MEDIUM))
// Verdict: >= 70 BLOCK, 30-69 CAUTION, < 30 SAFE.
import type { Finding, Severity, Verdict } from "../types";

export const SEVERITY_SCORE: Record<Severity, number> = {
  CRITICAL: 90,
  HIGH: 70,
  MEDIUM: 40,
  LOW: 15,
  INFO: 0,
};

export function scoreFindings(findings: Finding[]): {
  riskScore: number;
  verdict: Verdict;
} {
  if (findings.length === 0) return { riskScore: 0, verdict: "SAFE" };
  const scores = findings.map((f) => SEVERITY_SCORE[f.severity]);
  const max = Math.max(...scores);
  const others = findings.filter(
    (f) => SEVERITY_SCORE[f.severity] >= SEVERITY_SCORE.MEDIUM
  ).length;
  // "other findings" = every MEDIUM+ finding except the one that gave max.
  const extra = Math.max(0, others - 1);
  const riskScore = Math.min(100, max + 5 * extra);
  const verdict: Verdict =
    riskScore >= 70 ? "BLOCK" : riskScore >= 30 ? "CAUTION" : "SAFE";
  return { riskScore, verdict };
}
