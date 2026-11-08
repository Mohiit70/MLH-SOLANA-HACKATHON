"use client";
// Wallet + connection providers — devnet only. See CLAUDE.md section 4.
import { useMemo, type ReactNode, type ComponentType } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

// The wallet-adapter packages ship FC types built against a newer React
// JSX namespace than the React 18 types in this project, so the plain JSX
// form fails type-checking. Narrowing them to plain component types here
// keeps strict TypeScript passing without changing runtime behaviour.
const ConnectionProviderTyped = ConnectionProvider as unknown as ComponentType<{
  endpoint: string;
  children: ReactNode;
}>;
const WalletProviderTyped = WalletProvider as unknown as ComponentType<{
  wallets: never[];
  autoConnect: boolean;
  children: ReactNode;
}>;
const WalletModalProviderTyped =
  WalletModalProvider as unknown as ComponentType<{ children: ReactNode }>;

export default function Providers({ children }: { children: ReactNode }) {
  const endpoint = useMemo(
    () =>
      process.env.NEXT_PUBLIC_SOLANA_RPC ||
      "https://api.devnet.solana.com",
    []
  );
  // Empty wallets array: Phantom and others are auto-detected via Wallet Standard.
  return (
    <ConnectionProviderTyped endpoint={endpoint}>
      <WalletProviderTyped wallets={[]} autoConnect>
        <WalletModalProviderTyped>{children}</WalletModalProviderTyped>
      </WalletProviderTyped>
    </ConnectionProviderTyped>
  );
}
