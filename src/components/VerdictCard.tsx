// Verdict card: big verdict, gauge, plain-English summary.
import type { Analysis } from "@/lib/types";
import RiskGauge from "./RiskGauge";

const STYLES = {
  SAFE: "border-emerald-500 bg-emerald-500/10 text-emerald-400",
  CAUTION: "border-amber-400 bg-amber-400/10 text-amber-300",
  BLOCK: "border-red-500 bg-red-500/10 text-red-400",
} as const;

export default function VerdictCard({ analysis }: { analysis: Analysis }) {
  return (
    <section
      className={`rounded-xl border p-5 ${STYLES[analysis.verdict]}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-3xl font-black tracking-wide">
          {analysis.verdict}
        </span>
        <span className="text-xs font-semibold text-zinc-400">
          {analysis.aiUsed && analysis.aiModel
            ? `AI read (${analysis.aiModel})`
            : "Plain rules read"}
        </span>
      </div>
      <div className="mt-4 text-zinc-100">
        <RiskGauge score={analysis.riskScore} verdict={analysis.verdict} />
      </div>
      <p className="mt-4 text-base leading-relaxed text-zinc-100">
        {analysis.summary}
      </p>
      <div className="mt-4 space-y-2 text-sm">
        <p>
          <span className="font-semibold text-zinc-300">
            What could go wrong:{" "}
          </span>
          {analysis.whatCouldGoWrong}
        </p>
        <p>
          <span className="font-semibold text-zinc-300">
            Recommendation:{" "}
          </span>
          {analysis.recommendation}
        </p>
      </div>
      {!analysis.simulation.ok && (
        <p className="mt-3 rounded-lg bg-zinc-900 px-3 py-2 text-xs text-amber-300">
          Simulation failed, static analysis only:{" "}
          {analysis.simulation.error ?? "unknown reason"}
        </p>
      )}
      {analysis.simulation.solDelta !== undefined && (
        <p className="mt-3 text-xs text-zinc-400">
          SOL change: {analysis.simulation.solDelta.toFixed(6)} SOL
          {analysis.simulation.solBefore !== undefined
            ? ` (balance before: ${analysis.simulation.solBefore.toFixed(4)} SOL)`
            : ""}
        </p>
      )}
    </section>
  );
}
