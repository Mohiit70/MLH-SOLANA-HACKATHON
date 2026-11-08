// Risk ruler: a thin line with ticks at 30 and 70, zones labeled in sentence
// case, and a marker at the score. The score is a small number, not a big stat.
import type { Verdict } from "@/lib/types";

export default function RiskGauge({
  score,
  verdict,
}: {
  score: number;
  verdict: Verdict;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div aria-label={`Risk score ${score} out of 100, ${verdict.toLowerCase()}`}>
      <div className="relative h-px w-full bg-current opacity-40">
        <span className="absolute -top-[3px] h-[7px] w-px bg-current" style={{ left: "30%" }} />
        <span className="absolute -top-[3px] h-[7px] w-px bg-current" style={{ left: "70%" }} />
        <span
          className="absolute -top-[5px] h-[11px] w-[11px] -translate-x-1/2 rotate-45 bg-current"
          style={{ left: `${clamped}%` }}
        />
      </div>
      <div className="mt-2 flex text-sm">
        <span className="w-[30%]">Safe</span>
        <span className="w-[40%] text-center">Caution</span>
        <span className="flex w-[30%] items-baseline justify-end gap-2">
          <span>Block</span>
          <span className="font-mono text-[13px] font-semibold">{score}</span>
        </span>
      </div>
    </div>
  );
}
