"use client";
// Collapsed disclosure for judges who want the raw decoded instructions.
import { useState } from "react";
import type { DecodedInstruction } from "@/lib/types";

export default function InstructionList({
  instructions,
}: {
  instructions: DecodedInstruction[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="border-t border-hairline pt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="text-[15px] font-semibold underline decoration-hairline underline-offset-4"
      >
        {open ? "Hide raw decoded instructions" : "Show raw decoded instructions"}
      </button>
      {open && (
        <ol className="mt-4 space-y-4">
          {instructions.map((ix) => (
            <li key={ix.index} className="border-t border-hairline pt-4 first:border-t-0 first:pt-0">
              <p className="font-semibold">
                {ix.index + 1}. {ix.programName} · {ix.kind}
              </p>
              <p className="mt-1 text-sm text-muted">{ix.summary}</p>
              <p className="mt-1 break-all font-mono text-xs text-muted">
                {ix.programId}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
