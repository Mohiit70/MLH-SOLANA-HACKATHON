import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "SolGuard — AI Transaction Bodyguard for Solana",
  description:
    "SolGuard decodes, simulates and explains any Solana transaction in plain English before you sign it. Deterministic rules guard, AI explains. Devnet only.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
