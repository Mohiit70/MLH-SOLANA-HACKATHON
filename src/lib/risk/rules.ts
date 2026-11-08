// Deterministic drainer rules — see CLAUDE.md section 5.4.
import type {
  DecodedInstruction,
  Finding,
  SimulationSummary,
} from "../types";

function f(
  id: string,
  severity: Finding["severity"],
  title: string,
  explanation: string,
  instructionIndex?: number
): Finding {
  return { id, severity, title, explanation, instructionIndex };
}

export function runRules(
  instructions: DecodedInstruction[],
  simulation: SimulationSummary
): Finding[] {
  const findings: Finding[] = [];

  for (const ix of instructions) {
    // TOKEN_SET_AUTHORITY_OWNER — CRITICAL
    if (
      ix.kind === "SetAuthority" &&
      (ix.details.authorityType === 2 || ix.details.authorityType === 3)
    ) {
      findings.push(
        f(
          "TOKEN_SET_AUTHORITY_OWNER",
          "CRITICAL",
          "Token account owner is being changed",
          `This transaction hands ownership of a token account to a new authority (${String(
            ix.details.newAuthority ?? "unknown"
          )}). The new owner can drain that account. This is the classic wallet-drainer move.`,
          ix.index
        )
      );
    }
    // SYSTEM_ASSIGN — CRITICAL
    if (ix.kind === "Assign") {
      findings.push(
        f(
          "SYSTEM_ASSIGN",
          "CRITICAL",
          "An account is being reassigned to another program",
          `The Assign instruction changes who owns this account. Wallet simulators often show "no balance change" for it, but the new program can then take the funds. One signature can empty the wallet.`,
          ix.index
        )
      );
    }
    // TOKEN_APPROVE_UNLIMITED / TOKEN_APPROVE
    if (ix.kind === "Approve") {
      if (ix.details.unlimited === true) {
        findings.push(
          f(
            "TOKEN_APPROVE_UNLIMITED",
            "HIGH",
            "Unlimited token approval",
            `This grants a delegate permission to spend an unlimited amount of your tokens. A malicious delegate can take everything, at any time, without asking you again.`,
            ix.index
          )
        );
      } else {
        findings.push(
          f(
            "TOKEN_APPROVE",
            "MEDIUM",
            "Token approval",
            `This lets another address spend your tokens up to the approved amount. Only approve addresses you trust, and for the smallest amount you need.`,
            ix.index
          )
        );
      }
    }
    // CLOSE_ACCOUNT_REDIRECT — HIGH
    if (ix.kind === "CloseAccount") {
      const dest = String(ix.details.destination ?? "");
      const owner = String(ix.details.owner ?? "");
      if (dest && owner && dest !== owner) {
        findings.push(
          f(
            "CLOSE_ACCOUNT_REDIRECT",
            "HIGH",
            "Closing an account sends the funds somewhere else",
            `The closed account's remaining balance goes to an address that is not the owner. Check that the destination is really yours.`,
            ix.index
          )
        );
      }
    }
    // UNKNOWN_PROGRAM — MEDIUM
    if (ix.kind === "Unknown") {
      findings.push(
        f(
          "UNKNOWN_PROGRAM",
          "MEDIUM",
          "Call to an unknown program",
          `This instruction calls a program SolGuard does not recognise (${ix.programId.slice(0, 8)}...). Unknown programs can do anything — be extra careful before signing.`,
          ix.index
        )
      );
    }
  }

  // SOL_DRAIN — HIGH: 90%+ of balance leaves, or transfers sum to 90%+
  if (
    simulation.solBefore !== undefined &&
    simulation.solBefore > 0 &&
    simulation.solDelta !== undefined
  ) {
    if (simulation.solDelta <= -0.9 * simulation.solBefore) {
      findings.push(
        f(
          "SOL_DRAIN",
          "HIGH",
          "Almost all SOL is leaving the wallet",
          `This transaction moves ${Math.abs(simulation.solDelta).toFixed(4)} SOL out, which is 90% or more of the wallet balance. A normal transfer rarely empties a wallet.`
        )
      );
    }
  }
  const transferSum = instructions
    .filter((ix) => ix.programName === "System Program" && ix.kind === "Transfer")
    .reduce((sum, ix) => sum + (typeof ix.details.sol === "number" ? ix.details.sol : 0), 0);
  if (
    simulation.solBefore !== undefined &&
    simulation.solBefore > 0 &&
    transferSum >= 0.9 * simulation.solBefore &&
    !findings.some((x) => x.id === "SOL_DRAIN")
  ) {
    findings.push(
      f(
        "SOL_DRAIN",
        "HIGH",
        "Almost all SOL is leaving the wallet",
        `The transfers in this transaction add up to ${transferSum.toFixed(4)} SOL, 90% or more of the wallet balance.`
      )
    );
  }

  // MULTI_TRANSFER_SAME_DEST — MEDIUM
  const destCounts = new Map<string, number>();
  for (const ix of instructions) {
    if (ix.kind === "Transfer") {
      // TransferChecked is [source, mint, destination, owner] — dest is accounts[2].
      // Plain Transfer is [source, destination, owner] — dest is accounts[1].
      const isToken =
        ix.programName === "SPL Token" || ix.programName === "Token-2022";
      const dest =
        isToken && ix.accounts.length >= 4 ? ix.accounts[2] : ix.accounts[1];
      if (dest) destCounts.set(dest, (destCounts.get(dest) ?? 0) + 1);
    }
  }
  destCounts.forEach((count, dest) => {
    if (count >= 2) {
      findings.push(
        f(
          "MULTI_TRANSFER_SAME_DEST",
          "MEDIUM",
          "Several transfers go to the same address",
          `${count} transfers in this transaction all go to ${dest.slice(0, 4)}...${dest.slice(-4)}. Bundling many payments to one address is unusual for a normal transfer.`
        )
      );
    }
  });

  // SIM_FAILED — INFO
  if (!simulation.ok) {
    findings.push(
      f(
        "SIM_FAILED",
        "INFO",
        "Simulation failed — static analysis only",
        `SolGuard could not simulate this transaction on devnet (${simulation.error ?? "unknown reason"}). The verdict below is based on the decoded instructions only, not on a live simulation.`
      )
    );
  }

  return findings;
}
