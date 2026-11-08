// Shared types for SolGuard — see CLAUDE.md section 5.1.
export type Severity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Verdict = "SAFE" | "CAUTION" | "BLOCK";

export interface DecodedInstruction {
  index: number;
  programId: string;
  programName: string;
  kind: string;
  summary: string;
  accounts: string[];
  details: Record<string, string | number | boolean>;
}

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  explanation: string;
  instructionIndex?: number;
}

export interface SimulationSummary {
  ok: boolean;
  error?: string;
  logs: string[];
  feePayer: string;
  solBefore?: number;
  solAfter?: number;
  solDelta?: number;
}

export interface Analysis {
  verdict: Verdict;
  riskScore: number;
  summary: string;
  whatCouldGoWrong: string;
  recommendation: string;
  findings: Finding[];
  instructions: DecodedInstruction[];
  simulation: SimulationSummary;
  aiUsed: boolean;
}

export const VERDICT_RANK: Record<Verdict, number> = {
  SAFE: 0,
  CAUTION: 1,
  BLOCK: 2,
};

export function maxVerdict(a: Verdict, b: Verdict): Verdict {
  return VERDICT_RANK[a] >= VERDICT_RANK[b] ? a : b;
}
