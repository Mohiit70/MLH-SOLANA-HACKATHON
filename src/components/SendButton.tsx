"use client";
// Sign action inside the verdict band. Disabled on BLOCK. CAUTION asks for
// confirmation. The transaction is only sent when the user presses this button.
import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import type { Analysis } from "@/lib/types";

export default function SendButton({
  analysis,
  txBase64,
  tone,
}: {
  analysis: Analysis | null;
  txBase64: string;
  tone: "light" | "dark";
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

  const pill =
    tone === "dark"
      ? "border-ink text-ink"
      : "border-paper text-paper";

  return (
    <div>
      <button
        type="button"
        onClick={handleSend}
        disabled={blocked || sending || !connected}
        className={
          blocked
            ? `cursor-not-allowed rounded-full border px-5 py-3 font-semibold opacity-60 ${pill}`
            : analysis.verdict === "CAUTION"
              ? `rounded-full border-2 bg-transparent px-5 py-3 font-semibold ${pill}`
              : "rounded-full bg-ink px-5 py-3 font-semibold text-paper"
        }
      >
        {blocked
          ? "Signing is turned off for this transaction"
          : sending
            ? "Sending…"
            : !connected
              ? "Connect a wallet to sign"
              : analysis.verdict === "CAUTION"
                ? "I've read this and want to sign"
                : "Sign and send"}
      </button>
      {status && (
        <p className="mt-3 break-all text-sm opacity-90">{status}</p>
      )}
    </div>
  );
}
