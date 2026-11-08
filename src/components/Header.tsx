"use client";
// Header: wordmark, Devnet pill, wallet button.
// Wallet UI breaks SSR, so the button loads client-only (solana-expert M0).
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function Header() {
  return (
    <header className="border-b border-hairline">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="font-display text-2xl font-extrabold tracking-[-0.03em]">
            SolGuard
          </span>
          <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-amber">
            Devnet
          </span>
        </div>
        <WalletMultiButton className="wallet-btn" />
      </div>
    </header>
  );
}
