"use client";
// The white panel: what the transaction actually does, one numbered plain
// sentence per instruction, in the same order as the instructions.
import type { DecodedInstruction, Finding } from "@/lib/types";
import { plainLine } from "./plainLine";

const RULE_COLOR: Record<string, string> = {
  CRITICAL: "border-signal",
  HIGH: "border-signal",
  MEDIUM: "border-amber",
};

function worstFinding(
  ix: DecodedInstruction,
  findings: Finding[]
): Finding | undefined {
  const rank: Record<string, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
    INFO: 0,
  };
  return findings
    .filter((f) => f.instructionIndex === ix.index)
    .filter((f) => f.severity === "CRITICAL" || f.severity === "HIGH" || f.severity === "MEDIUM")
    .sort((a, b) => (rank[b.severity] ?? 0) - (rank[a.severity] ?? 0))[0];
}

export default function PlainEnglishPanel({
  instructions,
  findings,
  loading,
}: {
  instructions: DecodedInstruction[] | null;
  findings: Finding[];
  loading: boolean;
}) {
  return (
    <div className="flex h-full flex-col rounded-data bg-paper p-6">
      <h2 className="text-[15px] font-semibold">What it actually does</h2>
      {loading && (
        <p className="mt-4 text-[17px] leading-[1.55] text-muted">
          Reading the transaction...
        </p>
      )}
      {!loading && !instructions && (
        <p className="mt-4 max-w-[62ch] text-[17px] leading-[1.55] text-muted">
          Pick a sample or paste a transaction to see what it does.
        </p>
      )}
      {!loading && instructions && (
        <ol className="mt-4 space-y-4">
          {instructions.map((ix, i) => {
            const finding = worstFinding(ix, findings);
            const rule = finding ? RULE_COLOR[finding.severity] : "";
            return (
              <li
                key={ix.index}
                className={`row-in border-l-[3px] pl-4 ${rule ? rule : "border-transparent"}`}
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <p className="max-w-[62ch] text-[17px] leading-[1.55]">
                  <span className="font-semibold">{ix.index + 1}.</span>{" "}
                  {plainLine(ix)}
                </p>
                {finding && (
                  <p className="mt-1 text-sm text-muted">
                    {finding.explanation}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
