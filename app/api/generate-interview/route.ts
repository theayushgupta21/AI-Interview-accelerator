
import { NextResponse } from "next/server";
import { z } from "zod";

import { generateJSON } from "@/lib/llm";
import { interviewQuestionSchema } from "@/lib/schemas";
import {
  INTERVIEW_SYSTEM_PROMPT,
  buildInterviewPrompt,
} from "@/lib/interview-prompts";

const requestSchema = z.object({
  jdText: z.string().trim().min(50).max(30000),
  resumeText: z.string().trim().min(50).max(30000),
  interviewType: z
    .enum(["mixed", "technical", "hr", "project"])
    .default("mixed"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  questionCount: z
    .union([z.literal(5), z.literal(10), z.literal(15)])
    .default(10),
  interviewLevel: z
    .enum(["screening", "competency", "deep-dive"])
    .default("screening"),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const input = requestSchema.safeParse(body);

    if (!input.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid request. Provide a valid job description and resume (50–30,000 characters each), plus valid interview settings.",
        },
        { status: 400 }
      );
    }

    const {
      jdText,
      resumeText,
      interviewType,
      difficulty,
      questionCount,
      interviewLevel,
    } = input.data;

    const dynamicSchema = z.object({
      role_title: z.string().min(1),
      questions: z
        .array(interviewQuestionSchema)
        .length(questionCount),
    });

    const result = await generateJSON({
      schema: dynamicSchema,
      systemPrompt: INTERVIEW_SYSTEM_PROMPT,
      userPrompt: buildInterviewPrompt(jdText, resumeText, {
        interviewType,
        difficulty,
        questionCount,
        interviewLevel,
      }),
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      provider: result.provider,
    });
  } catch (error) {
    console.error("[Generate Interview API Error]", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown interview generation error";

    const isRateLimited =
      /rate.?limit|429|tokens per minute|tpm/i.test(message);

    return NextResponse.json(
      {
        success: false,
        error: isRateLimited
          ? "AI rate limit reached. Please wait a little and try again."
          : "Could not generate valid interview questions. Please try again.",
        retryable: isRateLimited,
      },
      { status: isRateLimited ? 429 : 500 }
    );
  }
}
