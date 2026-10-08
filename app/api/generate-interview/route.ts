
import { NextResponse } from "next/server";
import { z } from "zod";

import { generateJSON } from "@/lib/llm";
import {
  interviewQuestionsSchema,
} from "@/lib/schemas";
import {
  INTERVIEW_SYSTEM_PROMPT,
  buildInterviewPrompt,
} from "@/lib/interview-prompts";

const requestSchema = z.object({
  jdText: z.string().trim().min(50).max(30000),
  resumeText: z.string().trim().min(50).max(30000),
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
            "Please provide a valid job description and resume, each containing at least 50 characters and no more than 30,000 characters.",
        },
        { status: 400 }
      );
    }
    console.log("[Interview Debug] Schema imported:", {
  exists: Boolean(interviewQuestionsSchema),
  safeParseType: typeof interviewQuestionsSchema?.safeParse,
});

    const result = await generateJSON({
      schema: interviewQuestionsSchema,
      systemPrompt: INTERVIEW_SYSTEM_PROMPT,
      userPrompt: buildInterviewPrompt(
        input.data.jdText,
        input.data.resumeText
      ),
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      provider: result.provider,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Interview question generation failed.";

    console.error("[Interview Generation]", message);

    const isRateLimited =
      /rate.limit|rate_limit_exceeded|tokens per minute|\b429\b/i.test(
        message
      );

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
