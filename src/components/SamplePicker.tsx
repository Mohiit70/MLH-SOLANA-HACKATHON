"use client";
// Segmented control of three sample transactions. Selecting one fills the
// raw panel and auto-runs the check.
import type { DemoKind } from "@/lib/solana/demoTx";

const SAMPLES: { kind: DemoKind; label: string }[] = [
  { kind: "safe", label: "Normal transfer" },
  { kind: "approve", label: "Unlimited approval" },
  { kind: "drainer", label: "Wallet drainer" },
];

export default function SamplePicker({
  selected,
  onDemo,
  loading,
}: {
  selected: DemoKind | null;
  onDemo: (kind: DemoKind) => void;
  loading: boolean;
}) {
  return (
    <div
      role="group"
      aria-label="Try a sample"
      className="mt-6 flex flex-wrap gap-2"
    >
      {SAMPLES.map((s) => {
        const active = selected === s.kind;
        return (
          <button
            key={s.kind}
            type="button"
            aria-pressed={active}
            onClick={() => onDemo(s.kind)}
            disabled={loading}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40 ${
              active
                ? "bg-ink text-paper"
                : "border border-hairline bg-paper text-ink hover:bg-chalk"
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
