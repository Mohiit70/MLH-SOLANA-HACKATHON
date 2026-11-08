"use client";
// Textarea for a base64 transaction + Analyze button.
export default function TxInput({
  value,
  onChange,
  onAnalyze,
  loading,
}: {
  value: string;
  onChange: (v: string) => void;
  onAnalyze: () => void;
  loading: boolean;
}) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="text-lg font-bold">Paste a transaction</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Paste the base64-encoded transaction, or try a demo below. Nothing is
        sent to the chain unless you press Sign &amp; Send.
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder="Paste base64 transaction here…"
        className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 font-mono text-xs text-zinc-100 placeholder:text-zinc-600"
      />
      <button
        type="button"
        onClick={onAnalyze}
        disabled={loading || value.trim().length === 0}
        className="mt-3 w-full rounded-lg bg-emerald-500 px-4 py-3 font-bold text-zinc-950 disabled:opacity-40"
      >
        {loading ? "Analyzing…" : "Analyze transaction"}
      </button>
    </section>
  );
}
