// Provider-agnostic AI explanation with zod validation and rule-based fallback.
// See CLAUDE.md section 5.5. Server-side only. No key = fallback, never crash.
// One function, callLLM(system, user), talks to the configured provider via
// plain fetch — no heavy SDKs. Env: AI_PROVIDER ("gemini" | "openai-compatible"),
// AI_MODEL, AI_API_KEY, optional AI_BASE_URL. 15s timeout on every call.
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

const TIMEOUT_MS = 15_000;

function modelFor(provider: string): string {
  const fromEnv = process.env.AI_MODEL?.trim();
  if (fromEnv) return fromEnv;
  // gemini-2.5-flash is retired for new keys; gemini-3.5-flash is the current
  // fast model verified against the Gemini docs. Groq default model below.
  return provider === "openai-compatible"
    ? "openai/gpt-oss-120b"
    : "gemini-3.5-flash";
}

function baseFor(provider: string): string {
  const fromEnv = process.env.AI_BASE_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  // Groq's documented OpenAI-compatible base URL.
  return "https://api.groq.com/openai/v1";
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

/** One LLM call. Returns the raw text reply. Throws on HTTP / network errors. */
export async function callLLM(
  system: string,
  user: string
): Promise<string> {
  const provider = (process.env.AI_PROVIDER || "gemini").trim();
  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) throw new Error("AI_API_KEY is not set");
  const model = modelFor(provider);

  if (provider === "gemini") {
    // Google Gemini generateContent REST API (ai.google.dev/api/generate-content):
    // POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
    // Auth: x-goog-api-key header. Response: candidates[0].content.parts[].text
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const res = await fetchWithTimeout(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: 1000, temperature: 0 },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
    }
    const data: unknown = await res.json();
    const parts = (
      data as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      }
    ).candidates?.[0]?.content?.parts;
    const text = (parts ?? [])
      .map((p) => p.text ?? "")
      .join("")
      .trim();
    if (!text) throw new Error("Gemini returned an empty reply");
    return text;
  }

  if (provider === "openai-compatible") {
    // OpenAI-compatible chat completions (Groq, OpenRouter, OpenAI):
    // POST {AI_BASE_URL}/chat/completions, Bearer key.
    const base = baseFor(provider);
    const res = await fetchWithTimeout(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 1000,
        temperature: 0,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `OpenAI-compatible ${res.status}: ${body.slice(0, 200)}`
      );
    }
    const data: unknown = await res.json();
    const text = (
      data as { choices?: { message?: { content?: string } }[] }
    ).choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("OpenAI-compatible provider returned an empty reply");
    return text;
  }

  throw new Error(`Unknown AI_PROVIDER: ${provider}`);
}

export async function explainWithAi(
  instructions: DecodedInstruction[],
  simulation: SimulationSummary,
  findings: Finding[]
): Promise<{
  explanation: AiExplanation;
  aiUsed: boolean;
  aiModel: string | null;
}> {
  const fallback = fallbackExplanation(instructions, findings);
  const provider = (process.env.AI_PROVIDER || "gemini").trim();
  const model = modelFor(provider);
  if (!process.env.AI_API_KEY?.trim()) {
    return { explanation: fallback, aiUsed: false, aiModel: null };
  }
  try {
    const text = await callLLM(
      SYSTEM_PROMPT,
      buildUserPrompt(instructions, simulation, findings)
    );
    const parsed = AiSchema.safeParse(JSON.parse(stripFences(text)));
    if (!parsed.success) {
      return { explanation: fallback, aiUsed: false, aiModel: null };
    }
    return { explanation: parsed.data, aiUsed: true, aiModel: model };
  } catch (err) {
    // Never leak the key; log only the provider error message for debugging.
    console.error(
      "AI explanation failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    return { explanation: fallback, aiUsed: false, aiModel: null };
  }
}
