import { NextRequest, NextResponse } from "next/server";

import {
  jdAnalysisSchema,
} from "@/lib/schemas";

import {
  buildJDAnalysisPrompt,
  JD_ANALYSIS_SYSTEM_PROMPT,
} from "@/lib/prompts";

import { generateJSON } from "@/lib/llm";

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const jdText =
      typeof body?.jdText === "string"
        ? body.jdText.trim()
        : "";

    if (jdText.length < 50) {
      return NextResponse.json(
        {
          error:
            "Job description must contain at least 50 characters.",
        },
        { status: 400 }
      );
    }

    const result = await generateJSON({
      schema: jdAnalysisSchema,
      systemPrompt: JD_ANALYSIS_SYSTEM_PROMPT,
      userPrompt: buildJDAnalysisPrompt(jdText),
    });

    return NextResponse.json({
      success: true,
      analysis: result.data,
      provider: result.provider,
    });
  } catch (error) {
    console.error(
      "JD analysis error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze the job description.",
      },
      { status: 500 }
    );
  }
}