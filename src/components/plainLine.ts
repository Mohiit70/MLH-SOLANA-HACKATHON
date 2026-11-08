// Deterministic plain-English line per decoded instruction (UI layer only,
// not the AI). Works even without an AI key.
import type { DecodedInstruction } from "@/lib/types";

export function shortAddr(addr: string): string {
  return addr.length > 8 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;
}

function formatSol(sol: number): string {
  return String(Number(sol.toFixed(4)));
}

/** Destination/delegate account: TransferChecked and ApproveChecked put it at keys[2]. */
function keyAt(ix: DecodedInstruction, idx: number): string {
  return ix.accounts[idx] ?? "";
}

export function plainLine(ix: DecodedInstruction): string {
  const d = ix.details;
  if (ix.kind === "Transfer" && ix.programName === "System Program") {
    const sol = typeof d.sol === "number" ? d.sol : 0;
    return `Sends ${formatSol(sol)} SOL to ${shortAddr(keyAt(ix, 1))}.`;
  }
  if (ix.kind === "Transfer") {
    const dest = keyAt(ix, ix.accounts.length >= 4 ? 2 : 1);
    const amount = typeof d.amount === "number" ? d.amount : 0;
    return `Sends ${amount} tokens to ${shortAddr(dest)}.`;
  }
  if (ix.kind === "Approve") {
    const delegate = keyAt(ix, ix.accounts.length >= 4 ? 2 : 1);
    if (d.unlimited === true) {
      return `Lets ${shortAddr(delegate)} spend an unlimited amount of your tokens.`;
    }
    const amount = typeof d.amount === "number" ? d.amount : 0;
    return `Lets ${shortAddr(delegate)} spend ${amount} of your tokens.`;
  }
  if (ix.kind === "SetAuthority") {
    const typeName = typeof d.authorityTypeName === "string" ? d.authorityTypeName : "";
    const next = typeof d.newAuthority === "string" ? d.newAuthority : "";
    if (!next) {
      return `Removes the current authority from a token account.`;
    }
    if (typeName === "AccountOwner" || typeName === "CloseAccount") {
      return `Hands control of a token account to ${shortAddr(next)}.`;
    }
    return `Changes who controls a token account to ${shortAddr(next)}.`;
  }
  if (ix.kind === "CloseAccount") {
    const dest = typeof d.destination === "string" ? d.destination : "";
    return `Closes a token account and sends what is left to ${shortAddr(dest)}.`;
  }
  if (ix.kind === "Burn") {
    const amount = typeof d.amount === "number" ? d.amount : 0;
    return `Burns ${amount} tokens.`;
  }
  if (ix.kind === "Assign") {
    return `Hands this account to a new owner program.`;
  }
  if (ix.programName === "Unknown") {
    return `Runs a program SolGuard doesn't recognize (${shortAddr(ix.programId)}).`;
  }
  if (
    ix.programName === "Compute Budget" ||
    ix.programName === "Memo" ||
    ix.programName === "Associated Token" ||
    ix.kind === "CreateAccount" ||
    ix.kind === "Allocate"
  ) {
    const name =
      ix.programName === "System Program" ? ix.kind : ix.programName;
    return `Routine setup step: ${name}.`;
  }
  return ix.summary;
}
