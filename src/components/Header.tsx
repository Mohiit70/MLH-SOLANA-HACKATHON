"use client";
// Header: logo, DEVNET badge, wallet button.
// Wallet UI breaks SSR, so the button loads client-only (solana-expert M0).
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function Header() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-xl font-bold text-zinc-950">
          S
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">SolGuard</h1>
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-zinc-950">
              DEVNET
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            Your AI bodyguard for every Solana transaction
          </p>
        </div>
      </div>
      <WalletMultiButton />
    </header>
  );
}
