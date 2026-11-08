"use client";
// Shortened address in mono, copy-on-click.
import { useState } from "react";
import { shortAddr } from "./plainLine";

export default function ShortAddr({ addr }: { addr: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title={copied ? "Copied" : `Copy ${addr}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(addr);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          /* clipboard unavailable; the full address is in the title */
        }
      }}
      className="font-mono text-[13px] text-ink underline decoration-hairline underline-offset-2"
    >
      {copied ? "Copied" : shortAddr(addr)}
    </button>
  );
}
