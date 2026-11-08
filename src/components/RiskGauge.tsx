// Risk gauge bar, green / amber / red by verdict.
import type { Verdict } from "@/lib/types";

export default function RiskGauge({
  score,
  verdict,
}: {
  score: number;
  verdict: Verdict;
}) {
  const color =
    verdict === "BLOCK"
      ? "bg-red-500"
      : verdict === "CAUTION"
        ? "bg-amber-400"
        : "bg-emerald-500";
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-zinc-400">Risk score</span>
        <span className="text-2xl font-bold">{score} / 100</span>
      </div>
      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`gauge-fill h-full rounded-full ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
