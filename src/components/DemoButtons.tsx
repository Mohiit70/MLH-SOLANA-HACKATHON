"use client";
// Three demo transactions — see CLAUDE.md section 5.8.
import type { DemoKind } from "@/lib/solana/demoTx";

const DEMOS: { kind: DemoKind; label: string; desc: string }[] = [
  {
    kind: "safe",
    label: "Safe transfer",
    desc: "0.01 SOL to a friend — should be SAFE",
  },
  {
    kind: "approve",
    label: "Unlimited approve",
    desc: "Unlimited token approval — should be CAUTION or BLOCK",
  },
  {
    kind: "drainer",
    label: "Drainer bundle",
    desc: "95% sweep + SetAuthority + unknown program — should be BLOCK",
  },
];

export default function DemoButtons({
  onDemo,
  loading,
}: {
  onDemo: (kind: DemoKind) => void;
  loading: boolean;
}) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="text-lg font-bold">Try a demo transaction</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Demo transactions are built unsigned and never sent. They only show
        how SolGuard detects each pattern.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {DEMOS.map((d) => (
          <button
            key={d.kind}
            type="button"
            onClick={() => onDemo(d.kind)}
            disabled={loading}
            className="rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-left hover:border-emerald-500 disabled:opacity-40"
          >
            <span className="block font-semibold">{d.label}</span>
            <span className="mt-1 block text-xs text-zinc-400">{d.desc}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
