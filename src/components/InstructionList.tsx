"use client";
// Collapsible decoded instructions.
import { useState } from "react";
import type { DecodedInstruction } from "@/lib/types";

export default function InstructionList({
  instructions,
}: {
  instructions: DecodedInstruction[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <h2 className="text-lg font-bold">
          Decoded instructions ({instructions.length})
        </h2>
        <span className="text-zinc-400">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <ol className="mt-3 space-y-3">
          {instructions.map((ix) => (
            <li key={ix.index} className="rounded-lg bg-zinc-950 p-3">
              <p className="font-semibold">
                #{ix.index} — {ix.programName} · {ix.kind}
              </p>
              <p className="mt-1 text-sm text-zinc-400">{ix.summary}</p>
              <p className="mt-1 break-all font-mono text-xs text-zinc-500">
                {ix.programId}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
