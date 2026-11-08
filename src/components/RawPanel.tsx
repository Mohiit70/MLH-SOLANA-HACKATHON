"use client";
// The ink panel: what the wallet shows. Monospace base64, editable, dim.
export default function RawPanel({
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
    <div className="ink-surface flex h-full flex-col rounded-data bg-ink p-6">
      <h2 className="text-[15px] font-semibold text-paper">
        What your wallet shows
      </h2>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={9}
        spellCheck={false}
        placeholder="Paste base64 transaction here…"
        aria-label="Raw transaction in base64"
        className="mt-4 min-h-[180px] w-full flex-1 resize-y break-all rounded-data bg-transparent font-mono text-[13px] leading-[1.6] text-white/70 outline-none placeholder:text-white/40"
      />
      <button
        type="button"
        onClick={onAnalyze}
        disabled={loading || value.trim().length === 0}
        className="mt-6 w-full rounded-full bg-paper px-4 py-3 font-semibold text-ink disabled:opacity-40"
      >
        {loading ? "Reading the transaction..." : "Check this transaction"}
      </button>
    </div>
  );
}
