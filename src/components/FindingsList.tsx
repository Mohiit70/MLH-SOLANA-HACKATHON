// Findings list with severity chips.
import type { Finding, Severity } from "@/lib/types";

const CHIP: Record<Severity, string> = {
  CRITICAL: "bg-red-500 text-white",
  HIGH: "bg-orange-500 text-white",
  MEDIUM: "bg-amber-400 text-zinc-950",
  LOW: "bg-sky-500 text-white",
  INFO: "bg-zinc-600 text-white",
};

export default function FindingsList({
  findings,
}: {
  findings: Finding[];
}) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="text-lg font-bold">Findings ({findings.length})</h2>
      {findings.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-400">
          No risky patterns found in this transaction.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {findings.map((f) => (
            <li key={`${f.id}-${f.instructionIndex ?? "x"}`} className="rounded-lg bg-zinc-950 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${CHIP[f.severity]}`}
                >
                  {f.severity}
                </span>
                <span className="font-semibold">{f.title}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-400">{f.explanation}</p>
              {f.instructionIndex !== undefined && (
                <p className="mt-1 text-xs text-zinc-500">
                  Instruction #{f.instructionIndex}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
