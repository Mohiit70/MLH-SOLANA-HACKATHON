// Decode a base64 Solana transaction into human-readable instructions.
// See CLAUDE.md section 5.2. Legacy and v0 supported; ALT resolution is
// attempted for v0 and falls back to compiled instructions on failure.
import {
  AddressLookupTableAccount,
  Connection,
  PublicKey,
  SystemInstruction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import type { DecodedInstruction } from "../types";
import {
  SYSTEM_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  programName,
} from "./programs";

function readU32LE(data: Buffer, offset: number): number {
  return data.readUInt32LE(offset);
}

function readU64(data: Buffer, offset: number): bigint {
  return data.readBigUInt64LE(offset);
}

function shortKey(key: string): string {
  return key.length > 12 ? `${key.slice(0, 4)}...${key.slice(-4)}` : key;
}

function decodeSystem(
  ix: TransactionInstruction,
  index: number
): DecodedInstruction {
  const data = Buffer.from(ix.data);
  const base: DecodedInstruction = {
    index,
    programId: ix.programId.toBase58(),
    programName: "System Program",
    kind: "Unknown",
    summary: "System Program call",
    accounts: ix.keys.map((k) => k.pubkey.toBase58()),
    details: {},
  };
  if (data.length < 4) return base;
  const code = readU32LE(data, 0);
  if (code === 2) {
    // Transfer
    try {
      const t = SystemInstruction.decodeTransfer(ix);
      const lamports = Number(t.lamports);
      return {
        ...base,
        kind: "Transfer",
        summary: `Transfer ${(lamports / 1e9).toFixed(4)} SOL from ${shortKey(
          t.fromPubkey.toBase58()
        )} to ${shortKey(t.toPubkey.toBase58())}`,
        details: { lamports, sol: lamports / 1e9 },
      };
    } catch {
      return { ...base, kind: "Transfer", summary: "SOL transfer" };
    }
  }
  if (code === 1) {
    // Assign: new owner program id follows (32 bytes at offset 4)
    const newOwner =
      data.length >= 36
        ? new PublicKey(data.subarray(4, 36)).toBase58()
        : "unknown";
    return {
      ...base,
      kind: "Assign",
      summary: `Assign: this account's owner is changed to program ${shortKey(newOwner)}`,
      details: { newOwner },
    };
  }
  if (code === 0)
    return { ...base, kind: "CreateAccount", summary: "Create a new account" };
  if (code === 8)
    return { ...base, kind: "Allocate", summary: "Allocate space to an account" };
  return { ...base, kind: "Other", summary: `System Program instruction ${code}` };
}

function authorityTypeName(t: number): string {
  return (
    ["MintTokens", "FreezeAccount", "AccountOwner", "CloseAccount"][t] ??
    `Authority type ${t}`
  );
}

function decodeToken(
  ix: TransactionInstruction,
  index: number
): DecodedInstruction {
  const data = Buffer.from(ix.data);
  const name = programName(ix.programId.toBase58());
  const base: DecodedInstruction = {
    index,
    programId: ix.programId.toBase58(),
    programName: name,
    kind: "Unknown",
    summary: `${name} call`,
    accounts: ix.keys.map((k) => k.pubkey.toBase58()),
    details: {},
  };
  if (data.length < 1) return base;
  const disc = data[0];
  const amount = (offset: number): number =>
    data.length >= offset + 8 ? Number(readU64(data, offset)) : 0;
  if (disc === 3 || disc === 12) {
    // Transfer / TransferChecked
    // Transfer: [source, destination, owner] -> dest is keys[1].
    // TransferChecked: [source, mint, destination, owner] -> dest is keys[2].
    const amt = amount(1);
    const dest = (disc === 12 ? ix.keys[2] : ix.keys[1])?.pubkey.toBase58() ?? "";
    return {
      ...base,
      kind: "Transfer",
      summary: `Token transfer of ${amt} tokens to ${shortKey(dest)}`,
      details: { amount: amt },
    };
  }
  if (disc === 4 || disc === 13) {
    // Approve / ApproveChecked
    // Approve: [source, delegate, owner] -> delegate is keys[1].
    // ApproveChecked: [source, mint, delegate, owner] -> delegate is keys[2].
    // Compare the raw u64 before Number() loses precision at 2^64-1.
    const amtBig = data.length >= 9 ? readU64(data, 1) : BigInt(0);
    const amt = Number(amtBig);
    const delegate =
      (disc === 13 ? ix.keys[2] : ix.keys[1])?.pubkey.toBase58() ?? "";
    const unlimited = amtBig >= BigInt("9223372036854775808"); // 2^63
    return {
      ...base,
      kind: "Approve",
      summary: unlimited
        ? `UNLIMITED token approval: delegate ${shortKey(delegate)} can spend any amount`
        : `Token approval: delegate ${shortKey(delegate)} can spend ${amt} tokens`,
      details: { amount: amt, unlimited },
    };
  }
  if (disc === 6) {
    // SetAuthority
    const authType = data.length > 1 ? data[1] : -1;
    const hasNew = data.length > 2 && data[2] === 1;
    const newAuthority =
      hasNew && data.length >= 35
        ? new PublicKey(data.subarray(3, 35)).toBase58()
        : "";
    return {
      ...base,
      kind: "SetAuthority",
      summary: `SetAuthority (${authorityTypeName(authType)}): new authority ${newAuthority ? shortKey(newAuthority) : "none (revoked)"}`,
      details: {
        authorityType: authType,
        authorityTypeName: authorityTypeName(authType),
        newAuthority,
      },
    };
  }
  if (disc === 9) {
    const dest = ix.keys[1]?.pubkey.toBase58() ?? "";
    const owner = ix.keys[2]?.pubkey.toBase58() ?? "";
    return {
      ...base,
      kind: "CloseAccount",
      summary: `Close token account, funds go to ${shortKey(dest)} (owner ${shortKey(owner)})`,
      details: { destination: dest, owner },
    };
  }
  if (disc === 8) {
    return {
      ...base,
      kind: "Burn",
      summary: `Burn ${amount(1)} tokens`,
      details: { amount: amount(1) },
    };
  }
  return {
    ...base,
    kind: "Other",
    summary: `${name} instruction ${disc}`,
    details: { discriminator: disc },
  };
}

export function decodeInstruction(
  ix: TransactionInstruction,
  index: number
): DecodedInstruction {
  const pid = ix.programId.toBase58();
  if (pid === SYSTEM_PROGRAM_ID) return decodeSystem(ix, index);
  if (pid === TOKEN_PROGRAM_ID || pid === TOKEN_2022_PROGRAM_ID)
    return decodeToken(ix, index);
  const name = programName(pid);
  return {
    index,
    programId: pid,
    programName: name,
    kind: name === "Unknown" ? "Unknown" : "Known program call",
    summary:
      name === "Unknown"
        ? `Call to unknown program ${shortKey(pid)}`
        : `${name} call`,
    accounts: ix.keys.map((k) => k.pubkey.toBase58()),
    details: {},
  };
}

export interface DecodedTx {
  instructions: DecodedInstruction[];
  feePayer: string;
  versioned: VersionedTransaction;
}

/** Deserialize a base64 transaction and decode every instruction. */
export async function decodeTransaction(
  txBase64: string,
  connection?: Connection
): Promise<DecodedTx> {
  const buf = Buffer.from(txBase64, "base64");
  if (buf.length === 0) throw new Error("Empty transaction");
  const vtx = VersionedTransaction.deserialize(buf);
  const message = vtx.message;
  const feePayer = message.staticAccountKeys[0]?.toBase58() ?? "";
  let instructions: TransactionInstruction[];
  // v0 with address lookup tables: resolve them, or fail loudly.
  // A silent fallback would decode wrong accounts, so ALT txs are
  // rejected with a clear message instead of being mis-analyzed.
  const lookups = message.addressTableLookups ?? [];
  if (lookups.length > 0) {
    if (!connection) {
      throw new Error("Address lookup table transactions are not supported");
    }
    try {
      const altAccounts: AddressLookupTableAccount[] = [];
      for (const lookup of lookups) {
        const res = await connection.getAddressLookupTable(lookup.accountKey);
        if (!res.value) {
          throw new Error(
            "Address lookup table transactions are not supported"
          );
        }
        altAccounts.push(res.value);
      }
      instructions = TransactionMessage.decompile(message, {
        addressLookupTableAccounts: altAccounts,
      }).instructions;
    } catch (err) {
      if (
        err instanceof Error &&
        err.message ===
          "Address lookup table transactions are not supported"
      ) {
        throw err;
      }
      throw new Error("Address lookup table transactions are not supported");
    }
  } else {
    instructions = fallbackInstructions(vtx);
  }
  const decoded = instructions.map((ix, i) => decodeInstruction(ix, i));
  return { instructions: decoded, feePayer, versioned: vtx };
}

/** Decode from compiled instructions without ALT resolution (legacy + simple v0). */
function fallbackInstructions(vtx: VersionedTransaction): TransactionInstruction[] {
  const message = vtx.message;
  const keys = message.staticAccountKeys;
  return message.compiledInstructions.map((ci) => {
    const programId = keys[ci.programIdIndex];
    const accountKeys = ci.accountKeyIndexes.map((idx) => keys[idx]);
    return new TransactionInstruction({
      programId,
      keys: accountKeys.map((pubkey) => ({
        pubkey,
        isSigner: message.isAccountSigner(
          keys.findIndex((k) => k.equals(pubkey))
        ),
        isWritable: message.isAccountWritable(
          keys.findIndex((k) => k.equals(pubkey))
        ),
      })),
      data: Buffer.from(ci.data),
    });
  });
}
