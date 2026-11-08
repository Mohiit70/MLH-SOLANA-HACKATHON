// Why it was flagged: plain rows, no cards. Severity is a colored dot plus
// a sentence-case word, not a caps chip. Simulation failure is not a finding.
import type { Finding, Severity } from "@/lib/types";

const DOT: Record<Severity, string> = {
  CRITICAL: "bg-signal",
  HIGH: "bg-signal",
  MEDIUM: "bg-amber",
  LOW: "bg-muted",
  INFO: "bg-muted",
};

const WORD: Record<Severity, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  INFO: "Info",
};

export default function FindingsList({ findings }: { findings: Finding[] }) {
  const shown = findings.filter((f) => f.id !== "SIM_FAILED");
  return (
    <section>
      <h2 className="text-[15px] font-semibold">Why it was flagged</h2>
      {shown.length === 0 ? (
        <p className="mt-4 text-[17px] leading-[1.55] text-muted">
          No dangerous patterns found.
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {shown.map((f) => (
            <li
              key={`${f.id}-${f.instructionIndex ?? "x"}`}
              className="border-t border-hairline pt-4 first:border-t-0 first:pt-0"
            >
              <p className="flex flex-wrap items-center gap-2">
                <span
                  aria-hidden
                  className={`inline-block h-2.5 w-2.5 rounded-full ${DOT[f.severity]}`}
                />
                <span className="text-sm text-muted">{WORD[f.severity]}</span>
                <span className="font-semibold">{f.title}</span>
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {f.explanation}
              </p>
              <p className="mt-1 text-sm text-muted">
                {f.instructionIndex !== undefined
                  ? `Step ${f.instructionIndex + 1} · `
                  : ""}
                Found by rules
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
