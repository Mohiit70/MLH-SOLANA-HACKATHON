// Simulate a transaction on devnet — see CLAUDE.md section 5.3.
// Simulation failure is NOT fatal: ok:false, static analysis continues.
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import type { SimulationSummary } from "../types";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Simulation timed out")), ms)
    ),
  ]);
}

export async function simulateTransaction(
  connection: Connection,
  vtx: VersionedTransaction,
  feePayer: string
): Promise<SimulationSummary> {
  const base: SimulationSummary = {
    ok: false,
    logs: [],
    feePayer,
  };
  try {
    let solBefore: number | undefined;
    try {
      const bal = await withTimeout(
        connection.getBalance(new PublicKey(feePayer)),
        8000
      );
      solBefore = bal / 1e9;
    } catch {
      solBefore = undefined;
    }
    const res = await withTimeout(
      connection.simulateTransaction(vtx, {
        sigVerify: false,
        replaceRecentBlockhash: true,
        commitment: "confirmed",
        accounts: { encoding: "base64", addresses: [feePayer] },
      }),
      10000
    );
    const logs = res.value.logs ?? [];
    let solAfter = solBefore;
    const acct = res.value.accounts?.[0];
    if (acct && typeof acct.lamports === "number") {
      solAfter = acct.lamports / 1e9;
    }
    const solDelta =
      solBefore !== undefined && solAfter !== undefined
        ? solAfter - solBefore
        : undefined;
    if (res.value.err) {
      return {
        ...base,
        ok: false,
        error:
          typeof res.value.err === "string"
            ? res.value.err
            : JSON.stringify(res.value.err),
        logs,
        solBefore,
        solAfter,
        solDelta,
      };
    }
    return { ...base, ok: true, logs, solBefore, solAfter, solDelta };
  } catch (err) {
    return {
      ...base,
      ok: false,
      error: err instanceof Error ? err.message : "Simulation failed",
      logs: [],
    };
  }
}
