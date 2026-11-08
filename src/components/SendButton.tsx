"use client";
// Sign & Send on devnet. Disabled on BLOCK. CAUTION asks for confirmation.
// The transaction is only sent when the user presses this button.
import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import type { Analysis } from "@/lib/types";

export default function SendButton({
  analysis,
  txBase64,
}: {
  analysis: Analysis | null;
  txBase64: string;
}) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [status, setStatus] = useState<string>("");
  const [sending, setSending] = useState(false);

  if (!analysis) return null;
  const blocked = analysis.verdict === "BLOCK";

  async function handleSend() {
    if (!analysis || blocked || !publicKey || !txBase64) return;
    if (analysis.verdict === "CAUTION") {
      const ok = window.confirm(
        "SolGuard says CAUTION. Are you sure you want to sign and send this transaction on devnet?"
      );
      if (!ok) return;
    }
    setSending(true);
    setStatus("");
    try {
      const vtx = VersionedTransaction.deserialize(
        Buffer.from(txBase64, "base64")
      );
      const sig = await sendTransaction(vtx, connection, {
        skipPreflight: false,
      });
      setStatus(`Sent on devnet. Signature: ${sig}`);
    } catch (err) {
      setStatus(
        `Send failed: ${err instanceof Error ? err.message : "unknown error"}`
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <button
        type="button"
        onClick={handleSend}
        disabled={blocked || sending || !connected}
        className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-bold text-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
      >
        {blocked
          ? "Blocked by SolGuard"
          : sending
            ? "Sending…"
            : !connected
              ? "Connect a wallet to sign & send"
              : "Sign & Send on devnet"}
      </button>
      {blocked && (
        <p className="mt-2 text-sm text-red-400">
          SolGuard blocked this transaction. The Sign button stays disabled
          for BLOCK verdicts.
        </p>
      )}
      {status && (
        <p className="mt-2 break-all text-sm text-zinc-300">{status}</p>
      )}
    </section>
  );
}
