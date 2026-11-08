"use client";
// SolGuard single page — see CLAUDE.md section 5.7.
// Ink panel (what the wallet shows) next to the white panel (what it does),
// then a full-bleed verdict band, then findings and the ledger.
import { useCallback, useEffect, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey } from "@solana/web3.js";
import Header from "@/components/Header";
import SamplePicker from "@/components/SamplePicker";
import RawPanel from "@/components/RawPanel";
import PlainEnglishPanel from "@/components/PlainEnglishPanel";
import VerdictBand from "@/components/VerdictBand";
import FindingsList from "@/components/FindingsList";
import Ledger from "@/components/Ledger";
import InstructionList from "@/components/InstructionList";
import { buildDemoTx, type DemoKind } from "@/lib/solana/demoTx";
import type { Analysis } from "@/lib/types";

const INVALID_INPUT =
  "That doesn't look like a Solana transaction. Paste the base64 text your wallet or app gave you.";
const NETWORK_ERROR = "Couldn't reach the network. Try again in a moment.";

export default function Home() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [txBase64, setTxBase64] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDemo, setSelectedDemo] = useState<DemoKind | null>(null);
  const [mobileTab, setMobileTab] = useState<"wallet" | "plain">("plain");
  const autoRan = useRef(false);

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
        setError(res.status === 400 ? INVALID_INPUT : NETWORK_ERROR);
        return;
      }
      setAnalysis(data as Analysis);
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDemo = useCallback(
    async (kind: DemoKind) => {
      setError("");
      setSelectedDemo(kind);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("sample", kind);
        window.history.replaceState(null, "", url.toString());
      }
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

  // ?sample=safe|approve|drainer auto-runs that sample (shareable demo links).
  useEffect(() => {
    if (autoRan.current) return;
    autoRan.current = true;
    const sample = new URLSearchParams(window.location.search).get("sample");
    if (sample === "safe" || sample === "approve" || sample === "drainer") {
      void handleDemo(sample);
    }
  }, [handleDemo]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <section className="pb-10 pt-10 md:pt-18">
          <h1 className="font-display text-[clamp(34px,5vw,56px)] font-extrabold leading-[1.05] tracking-[-0.03em]">
            Read what you&apos;re about to sign.
          </h1>
          <p className="mt-4 max-w-[62ch] text-[17px] leading-[1.55] text-muted">
            Paste a Solana transaction or try a sample. SolGuard shows what it
            does before you sign.
          </p>
          <SamplePicker
            selected={selectedDemo}
            onDemo={handleDemo}
            loading={loading}
          />
        </section>

        <div className="mb-6 flex gap-2 md:hidden" role="tablist" aria-label="Views">
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === "wallet"}
            onClick={() => setMobileTab("wallet")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              mobileTab === "wallet"
                ? "bg-ink text-paper"
                : "border border-hairline bg-paper"
            }`}
          >
            Wallet view
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === "plain"}
            onClick={() => setMobileTab("plain")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              mobileTab === "plain"
                ? "bg-ink text-paper"
                : "border border-hairline bg-paper"
            }`}
          >
            Plain English
          </button>
        </div>

        <section className="grid gap-6 pb-10 md:grid-cols-2">
          <div className={mobileTab === "wallet" ? "block" : "hidden md:block"}>
            <RawPanel
              value={txBase64}
              onChange={setTxBase64}
              onAnalyze={() => analyze(txBase64)}
              loading={loading}
            />
          </div>
          <div className={mobileTab === "plain" ? "block" : "hidden md:block"}>
            <PlainEnglishPanel
              instructions={analysis ? analysis.instructions : null}
              findings={analysis ? analysis.findings : []}
              loading={loading}
            />
          </div>
        </section>

        {error && (
          <p className="mb-10 border-l-[3px] border-signal pl-4 text-[17px] leading-[1.55]">
            {error}
          </p>
        )}
      </main>

      {analysis && <VerdictBand analysis={analysis} txBase64={txBase64} />}

      {analysis && (
        <main className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <section className="grid gap-10 py-10 md:grid-cols-2">
            <FindingsList findings={analysis.findings} />
            <Ledger
              instructions={analysis.instructions}
              simulationOk={analysis.simulation.ok}
            />
          </section>
          <div className="pb-10">
            <InstructionList instructions={analysis.instructions} />
          </div>
        </main>
      )}

      <footer className="border-t border-hairline">
        <p className="mx-auto max-w-[1200px] px-4 py-6 text-sm text-muted sm:px-6">
          Devnet only. Samples are never sent to the network.
        </p>
      </footer>
    </div>
  );
}
