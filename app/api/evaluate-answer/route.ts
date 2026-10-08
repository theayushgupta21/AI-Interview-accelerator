
import { NextResponse } from "next/server";
import { z } from "zod";

import { generateJSON } from "@/lib/llm";
import { answerEvaluationSchema } from "@/lib/schemas";
import { buildAnswerEvaluationPrompt } from "@/lib/interview-evaluation-prompts";

const requestSchema = z.object({
  roleTitle: z.string().min(1).max(120),
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(5000),
  evaluationPoints: z.array(z.string().min(1)).min(1).max(10),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid evaluation input.",
        },
        { status: 400 }
      );
    }

    const input = parsed.data;

    const prompt = buildAnswerEvaluationPrompt(input);

    const result = await generateJSON({
      schema: answerEvaluationSchema,
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
    });

    const score = result.data.score;

    // Difficulty is decided by application code, not by the LLM.
    const nextDifficulty =
      score >= 80
        ? "hard"
        : score >= 50
          ? "medium"
          : "easy";

    return NextResponse.json({
      success: true,
      data: {
        ...result.data,
        nextDifficulty,
      },
      provider: result.provider,
    });
  } catch (error) {
    console.error("[Evaluate Answer API]", error);

    const message =
      error instanceof Error &&
      /rate.limit|429|tokens per minute/i.test(error.message)
        ? "AI rate limit reached. Please wait a little and try again."
        : "Unable to evaluate this answer right now.";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
