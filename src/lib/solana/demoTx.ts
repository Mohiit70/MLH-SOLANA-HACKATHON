// Demo transaction builders — see CLAUDE.md section 5.8.
// These build UNSIGNED VersionedTransactions. They are never sent.
// They exist only to demonstrate detection through the same analyze flow.
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { createApproveInstruction, createSetAuthorityInstruction, AuthorityType } from "@solana/spl-token";

// A fixed devnet address used as the "friend" in the safe demo.
export const SAFE_RECIPIENT = new PublicKey(
  "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK"
);

function toBase64(vtx: VersionedTransaction): string {
  return Buffer.from(vtx.serialize()).toString("base64");
}

async function freshBlockhash(connection: Connection): Promise<string> {
  try {
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    return blockhash;
  } catch {
    // Fallback blockhash: any 32-byte value, simulation replaces it anyway.
    return Keypair.generate().publicKey.toBase58().slice(0, 44);
  }
}

/** Safe: transfer 0.01 SOL to a fixed devnet address. */
export async function buildSafeTx(
  connection: Connection,
  payer: PublicKey
): Promise<string> {
  const ix = SystemProgram.transfer({
    fromPubkey: payer,
    toPubkey: SAFE_RECIPIENT,
    lamports: 10_000_000, // 0.01 SOL
  });
  const msg = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: await freshBlockhash(connection),
    instructions: [ix],
  }).compileToV0Message();
  return toBase64(new VersionedTransaction(msg));
}

/** Unlimited approve: SPL Token approve of 2^64-1 to a random "attacker". */
export async function buildUnlimitedApproveTx(
  connection: Connection,
  payer: PublicKey
): Promise<string> {
  const attacker = Keypair.generate().publicKey;
  const fakeTokenAccount = Keypair.generate().publicKey;
  const ix = createApproveInstruction(
    fakeTokenAccount,
    attacker,
    payer,
    BigInt(2) ** BigInt(64) - BigInt(1)
  );
  const msg = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: await freshBlockhash(connection),
    instructions: [ix],
  }).compileToV0Message();
  return toBase64(new VersionedTransaction(msg));
}

/** Drainer bundle: 95% of balance to attacker + SetAuthority (AccountOwner) + unknown program. */
export async function buildDrainerTx(
  connection: Connection,
  payer: PublicKey
): Promise<string> {
  const attacker = Keypair.generate().publicKey;
  const fakeTokenAccount = Keypair.generate().publicKey;
  let balance = 0;
  try {
    balance = await connection.getBalance(payer);
  } catch {
    balance = 0;
  }
  const drainLamports =
    balance > 0 ? Math.floor(balance * 0.95) : 500_000_000; // 0.5 SOL fallback
  const transferIx = SystemProgram.transfer({
    fromPubkey: payer,
    toPubkey: attacker,
    lamports: drainLamports,
  });
  const setAuthIx = createSetAuthorityInstruction(
    fakeTokenAccount,
    payer,
    AuthorityType.AccountOwner,
    attacker
  );
  const unknownProgram = Keypair.generate().publicKey;
  const unknownIx = new TransactionInstruction({
    programId: unknownProgram,
    keys: [{ pubkey: payer, isSigner: true, isWritable: true }],
    data: Buffer.from([1, 2, 3, 4]),
  });
  const msg = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: await freshBlockhash(connection),
    instructions: [transferIx, setAuthIx, unknownIx],
  }).compileToV0Message();
  return toBase64(new VersionedTransaction(msg));
}

export type DemoKind = "safe" | "approve" | "drainer";

export async function buildDemoTx(
  kind: DemoKind,
  connection: Connection,
  payer: PublicKey
): Promise<string> {
  if (kind === "safe") return buildSafeTx(connection, payer);
  if (kind === "approve") return buildUnlimitedApproveTx(connection, payer);
  return buildDrainerTx(connection, payer);
}
