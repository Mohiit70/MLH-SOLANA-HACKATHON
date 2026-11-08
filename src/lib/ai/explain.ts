// Claude explanation with zod validation and rule-based fallback.
// See CLAUDE.md section 5.5. Server-side only. No key = fallback, never crash.
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type {
  DecodedInstruction,
  Finding,
  SimulationSummary,
} from "../types";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  fallbackExplanation,
  type AiExplanation,
} from "./prompt";

const AiSchema = z.object({
  summary: z.string().min(1),
  whatCouldGoWrong: z.string().min(1),
  recommendation: z.string().min(1),
  verdict: z.enum(["SAFE", "CAUTION", "BLOCK"]),
});

export async function explainWithAi(
  instructions: DecodedInstruction[],
  simulation: SimulationSummary,
  findings: Finding[]
): Promise<{ explanation: AiExplanation; aiUsed: boolean }> {
  const fallback = fallbackExplanation(instructions, findings);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { explanation: fallback, aiUsed: false };
  try {
    const client = new Anthropic({ apiKey });
    const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
    const res = await client.messages.create({
      model,
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserPrompt(instructions, simulation, findings),
        },
      ],
    });
    const textBlock = res.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { explanation: fallback, aiUsed: false };
    }
    const cleaned = textBlock.text
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    const parsed = AiSchema.safeParse(JSON.parse(cleaned));
    if (!parsed.success) return { explanation: fallback, aiUsed: false };
    return { explanation: parsed.data, aiUsed: true };
  } catch {
    return { explanation: fallback, aiUsed: false };
  }
}
