"use client";
// SolGuard single page — see CLAUDE.md section 5.7.
// Left: demos + paste + analyze. Right: verdict, findings, instructions, send.
import { useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey } from "@solana/web3.js";
import Header from "@/components/Header";
import TxInput from "@/components/TxInput";
import DemoButtons from "@/components/DemoButtons";
import VerdictCard from "@/components/VerdictCard";
import FindingsList from "@/components/FindingsList";
import InstructionList from "@/components/InstructionList";
import SendButton from "@/components/SendButton";
import { buildDemoTx, type DemoKind } from "@/lib/solana/demoTx";
import type { Analysis } from "@/lib/types";

export default function Home() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [txBase64, setTxBase64] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = useCallback(async (b64: string) => {
    setLoading(true);
    setError("");
    setAnalysis(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txBase64: b64 }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          data && typeof data === "object" && "error" in data
            ? String((data as { error: unknown }).error)
            : "Analysis failed.";
        setError(msg);
        return;
      }
      setAnalysis(data as Analysis);
    } catch {
      setError("Could not reach the analyzer. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDemo = useCallback(
    async (kind: DemoKind) => {
      setError("");
      // Demo payer: connected wallet if present, else NEXT_PUBLIC_DEMO_PAYER
      // (a funded devnet PUBLIC address from env — no private key involved,
      // demos are unsigned and never sent), else a random keypair.
      // A funded payer makes simulation succeed, so the 95% sweep is visible.
      const demoPayer = (() => {
        const env = process.env.NEXT_PUBLIC_DEMO_PAYER;
        if (env) {
          try {
            return new PublicKey(env);
          } catch {
            return Keypair.generate().publicKey;
          }
        }
        return Keypair.generate().publicKey;
      })();
      const payer: PublicKey = publicKey ?? demoPayer;
      try {
        const b64 = await buildDemoTx(kind, connection, payer);
        setTxBase64(b64);
        await analyze(b64);
      } catch {
        setError("Could not build the demo transaction. Please try again.");
      }
    },
    [analyze, connection, publicKey]
  );

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <p className="text-sm text-zinc-400">
          One wrong signature can empty your wallet, and the screen shows hex.
          SolGuard decodes the transaction, simulates it on devnet, runs
          deterministic drainer rules, and explains it in plain English.
          Deterministic rules guard, AI explains.
        </p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <DemoButtons onDemo={handleDemo} loading={loading} />
            <TxInput
              value={txBase64}
              onChange={setTxBase64}
              onAnalyze={() => analyze(txBase64)}
              loading={loading}
            />
            {error && (
              <p className="rounded-lg border border-red-500 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}
            {!analysis && !loading && !error && (
              <p className="rounded-xl border border-dashed border-zinc-700 p-5 text-center text-sm text-zinc-400">
                Try a demo transaction to see SolGuard in action — the safe
                transfer should come back green, the drainer bundle red.
              </p>
            )}
          </div>
          <div className="space-y-6">
            {loading && (
              <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-300">
                Analyzing… decoding, simulating on devnet, and checking the
                rules.
              </p>
            )}
            {analysis && (
              <>
                <VerdictCard analysis={analysis} />
                <FindingsList findings={analysis.findings} />
                <InstructionList instructions={analysis.instructions} />
                <SendButton analysis={analysis} txBase64={txBase64} />
              </>
            )}
          </div>
        </div>
        <footer className="mt-10 border-t border-zinc-800 pt-4 text-center text-xs text-zinc-500">
          SolGuard — MLH Solana Hackathon 2026, AI Track. Devnet only. Demo
          transactions are never sent.
        </footer>
      </main>
    </div>
  );
}
