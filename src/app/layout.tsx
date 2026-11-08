import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";

// Fonts are local files (downloaded from Google Fonts) so the build works
// offline and the design does not depend on a font CDN at runtime.
const display = localFont({
  src: [
    { path: "./fonts/bricolage-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/bricolage-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

const body = localFont({
  src: [
    { path: "./fonts/hanken-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/hanken-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});

const mono = localFont({
  src: [
    { path: "./fonts/martian-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/martian-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
});

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
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-chalk font-body text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
