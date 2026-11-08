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
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            aria-label="SolGuard logo"
            role="img"
          >
            <path
              d="M16 2 28 7v9c0 7.5-5.1 12.3-12 14C9.1 28.3 4 23.5 4 16V7L16 2Z"
              fill="#0F1A2B"
            />
            <path
              d="M11 16.2 14.6 20 21.5 12.5"
              stroke="#E8A317"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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
