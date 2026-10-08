
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { z } from "zod";

export type LLMProvider = "gemini" | "groq";

interface GenerateJSONParams<T extends z.ZodTypeAny> {
  schema: T;
  systemPrompt: string;
  userPrompt: string;
}

interface GenerateJSONResult<T> {
  data: T;
  provider: LLMProvider;
}

function getGeminiKey(): string | undefined {
  return process.env.GEMINI_API_KEY?.trim() || undefined;
}

function getGroqKey(): string | undefined {
  return process.env.GROQ_API_KEY?.trim() || undefined;
}

function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
}

function getGroqModel(): string {
  return process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b";
}

function getGroqOutputLimit(): number {
  const value = Number(process.env.GROQ_MAX_COMPLETION_TOKENS || 1800);

  if (!Number.isInteger(value) || value < 256 || value > 4096) {
    return 1800;
  }

  return value;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function isRateLimitError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("rate_limit_exceeded") ||
    message.includes("rate limit") ||
    message.includes("tokens per minute") ||
    message.includes("too many requests") ||
    message.includes("429")
  );
}

function cleanJSONText(text: string): string {
  let cleaned = text.trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

function parseAndValidate<T extends z.ZodTypeAny>(
  text: string,
  schema: T
): z.infer<T> {
  const cleaned = cleanJSONText(text);

  if (!cleaned) {
    throw new Error("Model returned an empty response.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Model returned invalid JSON. Response preview: ${cleaned.slice(0, 200)}`
    );
  }
if (!schema || typeof schema.safeParse !== "function") {
  throw new Error(
    "Invalid or missing Zod schema passed to parseAndValidate."
  );
}

const result = schema.safeParse(parsed);

  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 8)
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(`Schema validation failed: ${issues}`);
  }

  return result.data;
}

async function callGemini<T extends z.ZodTypeAny>(
  params: GenerateJSONParams<T>
): Promise<z.infer<T>> {
  const apiKey = getGeminiKey();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: getGeminiModel(),
    contents: params.userPrompt,
    config: {
      systemInstruction: params.systemPrompt,
      temperature: 0.1,
      maxOutputTokens: 3000,
      responseMimeType: "application/json",
    },
  });

  const text = response.text;

  if (!text?.trim()) {
    throw new Error("Gemini returned an empty response.");
  }

  return parseAndValidate(text, params.schema);
}


async function callGroq<T extends z.ZodTypeAny>(
  params: GenerateJSONParams<T>
): Promise<z.infer<T>> {
  const apiKey = getGroqKey();

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing.");
  }

  const groq = new Groq({ apiKey });

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      {
        role: "system",
        content: [
          params.systemPrompt,
          "Return exactly one complete JSON object.",
          "Follow the requested structure and data types.",
          "Do not include Markdown or explanations.",
          "Keep evidence concise but include all required skill matches.",
          "Do not invent facts.",
        ].join("\n"),
      },
      {
        role: "user",
        content: params.userPrompt,
      },
    ],
    temperature: 0.1,
   max_completion_tokens: 3000,
    top_p: 1,
    reasoning_effort: "low",
    response_format: { type: "json_object" },
  });

  const choice = completion.choices?.[0];

  if (!choice) {
    throw new Error("Groq returned no completion choices.");
  }

  if (choice.finish_reason === "length") {
    throw new Error("Groq output was truncated. Increase the output budget cautiously.");
  }

  const text = choice.message?.content;

  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Groq returned empty JSON content.");
  }

  return parseAndValidate(text, params.schema);
}

export async function generateJSON<T extends z.ZodTypeAny>(
  params: GenerateJSONParams<T>
): Promise<GenerateJSONResult<z.infer<T>>> {
  const errors: string[] = [];
  console.log("[LLM Debug] Params received:", {
  hasSchema: Boolean(params?.schema),
  safeParseType: typeof params?.schema?.safeParse,
});

  if (getGeminiKey()) {
    try {
      const data = await callGemini(params);

      return { data, provider: "gemini" };
    } catch (error) {
      const message = getErrorMessage(error);
      errors.push(`Gemini: ${message}`);

      console.error("[LLM] Gemini failed:", message);
    }
  }

  if (!getGroqKey()) {
    errors.push("Groq: GROQ_API_KEY is missing.");

    throw new Error(`All AI providers failed. ${errors.join(" | ")}`);
  }

  try {
    const data = await callGroq(params);

    return { data, provider: "groq" };
  } catch (error) {
    const message = getErrorMessage(error);

    if (isRateLimitError(error)) {
      errors.push(`Groq rate limit reached. Wait before trying again. ${message}`);
    } else {
      errors.push(`Groq: ${message}`);
    }

    console.error("[LLM] Groq failed:", message);

    throw new Error(`All AI providers failed. ${errors.join(" | ")}`);
  }
}

export function getLLMConfig() {
  return {
    geminiConfigured: Boolean(getGeminiKey()),
    groqConfigured: Boolean(getGroqKey()),
    geminiModel: getGeminiModel(),
    groqModel: getGroqModel(),
  };
}
