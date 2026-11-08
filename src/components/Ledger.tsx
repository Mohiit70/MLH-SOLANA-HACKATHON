// What leaves your wallet: a receipt-style list built from the decoded
// instructions. Empty groups are hidden.
import type { DecodedInstruction } from "@/lib/types";
import ShortAddr from "./ShortAddr";
import { shortAddr } from "./plainLine";

function formatSol(sol: number): string {
  return String(Number(sol.toFixed(4)));
}

export default function Ledger({
  instructions,
  simulationOk,
}: {
  instructions: DecodedInstruction[];
  simulationOk: boolean;
}) {
  const send: { amount: string; to: string }[] = [];
  const permission: { who: string; amount: string }[] = [];
  const control: { what: string; to: string }[] = [];

  for (const ix of instructions) {
    const d = ix.details;
    if (ix.kind === "Transfer" && ix.programName === "System Program") {
      const sol = typeof d.sol === "number" ? d.sol : 0;
      send.push({ amount: `${formatSol(sol)} SOL`, to: ix.accounts[1] ?? "" });
    } else if (ix.kind === "Transfer") {
      const dest = ix.accounts[ix.accounts.length >= 4 ? 2 : 1] ?? "";
      const amount = typeof d.amount === "number" ? d.amount : 0;
      send.push({ amount: `${amount} tokens`, to: dest });
    } else if (ix.kind === "Approve") {
      const delegate = ix.accounts[ix.accounts.length >= 4 ? 2 : 1] ?? "";
      const amount =
        d.unlimited === true
          ? "unlimited"
          : `${typeof d.amount === "number" ? d.amount : 0} tokens`;
      permission.push({ who: delegate, amount });
    } else if (ix.kind === "SetAuthority") {
      const next = typeof d.newAuthority === "string" ? d.newAuthority : "";
      if (next) {
        const typeName =
          typeof d.authorityTypeName === "string" ? d.authorityTypeName : "";
        control.push({
          what: `Token account ${typeName === "AccountOwner" ? "owner" : "authority"}`,
          to: next,
        });
      }
    } else if (ix.kind === "Assign") {
      const next = typeof d.newOwner === "string" ? d.newOwner : "";
      if (next) control.push({ what: "Account owner", to: next });
    }
  }

  const empty = send.length === 0 && permission.length === 0 && control.length === 0;

  return (
    <section>
      <h2 className="text-[15px] font-semibold">What leaves your wallet</h2>
      {empty ? (
        <p className="mt-4 text-[17px] leading-[1.55] text-muted">
          Nothing leaves your wallet in this transaction.
        </p>
      ) : (
        <div className="mt-4 space-y-6">
          {send.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted">You send</h3>
              <ul className="mt-2 space-y-2 border-t border-hairline">
                {send.map((s, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-4 border-b border-hairline py-2">
                    <span className="font-mono text-[13px]">{s.amount}</span>
                    <span className="text-sm text-muted">
                      to <ShortAddr addr={s.to} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {permission.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted">You give permission</h3>
              <ul className="mt-2 space-y-2 border-t border-hairline">
                {permission.map((p, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-4 border-b border-hairline py-2">
                    <span className="font-mono text-[13px]">{p.amount}</span>
                    <span className="text-sm text-muted">
                      to <ShortAddr addr={p.who} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {control.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted">You hand over control</h3>
              <ul className="mt-2 space-y-2 border-t border-hairline">
                {control.map((c, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-4 border-b border-hairline py-2">
                    <span className="text-sm">{c.what}</span>
                    <span className="text-sm text-muted">
                      to <ShortAddr addr={c.to} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {!simulationOk && (
        <p className="mt-6 text-sm text-muted">
          Live balance check was not available, so this reading is based on
          the instructions alone.
        </p>
      )}
    </section>
  );
}
