// POST /api/analyze — decode + simulate + rules + AI explain.
// See CLAUDE.md section 5.6. Never leaks the API key or stack traces.
import { NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";
import { z } from "zod";
import { decodeTransaction } from "@/lib/solana/decode";
import { simulateTransaction } from "@/lib/solana/simulate";
import { runRules } from "@/lib/risk/rules";
import { scoreFindings } from "@/lib/risk/score";
import { explainWithAi } from "@/lib/ai/explain";
import { maxVerdict, type Analysis } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const BodySchema = z.object({
  txBase64: z.string().min(1),
});

function rpcUrl(): string {
  return (
    process.env.SOLANA_RPC_SERVER ||
    process.env.NEXT_PUBLIC_SOLANA_RPC ||
    "https://api.devnet.solana.com"
  );
}

export async function POST(req: Request) {
  try {
    const json: unknown = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Provide txBase64, a base64-encoded transaction." },
        { status: 400 }
      );
    }
    const connection = new Connection(rpcUrl(), "confirmed");
    let decoded;
    try {
      decoded = await decodeTransaction(parsed.data.txBase64, connection);
    } catch {
      return NextResponse.json(
        { error: "Could not decode this transaction. Check the base64 string." },
        { status: 400 }
      );
    }
    const simulation = await simulateTransaction(
      connection,
      decoded.versioned,
      decoded.feePayer
    );
    const findings = runRules(decoded.instructions, simulation);
    const { riskScore, verdict: rulesVerdict } = scoreFindings(findings);
    const { explanation, aiUsed, aiModel } = await explainWithAi(
      decoded.instructions,
      simulation,
      findings
    );
    // Final verdict = the more severe of rules and AI. AI can never downgrade.
    const verdict = maxVerdict(rulesVerdict, explanation.verdict);
    const analysis: Analysis = {
      verdict,
      riskScore,
      summary: explanation.summary,
      whatCouldGoWrong: explanation.whatCouldGoWrong,
      recommendation: explanation.recommendation,
      findings,
      instructions: decoded.instructions,
      simulation,
      aiUsed,
      aiModel,
    };
    return NextResponse.json(analysis);
  } catch {
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
