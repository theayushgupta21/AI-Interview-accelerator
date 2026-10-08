import { NextRequest, NextResponse } from "next/server";
import { resumeAnalysisSchema } from "@/lib/schemas";
import {
  buildResumeAnalysisPrompt,
  RESUME_ANALYSIS_SYSTEM_PROMPT,
} from "@/lib/prompts";
import { generateJSON } from "@/lib/llm";
import { calculateJobFit } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const jdText =
      typeof body?.jdText === "string" ? body.jdText.trim() : "";
    const resumeText =
      typeof body?.resumeText === "string" ? body.resumeText.trim() : "";

    if (jdText.length < 50) {
      return NextResponse.json(
        { error: "Job description must contain at least 50 characters." },
        { status: 400 }
      );
    }

    if (resumeText.length < 50) {
      return NextResponse.json(
        { error: "Resume must contain at least 50 characters." },
        { status: 400 }
      );
    }

    const result = await generateJSON({
      schema: resumeAnalysisSchema,
      systemPrompt: RESUME_ANALYSIS_SYSTEM_PROMPT,
      userPrompt: buildResumeAnalysisPrompt(jdText, resumeText),
    });

    const analysis = resumeAnalysisSchema.parse(result.data);
    const jobFit = calculateJobFit(analysis);

    return NextResponse.json({
      success: true,
      analysis,
      jobFit,
      provider: result.provider,
    });
  } catch (error) {
    console.error("Resume analysis error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown server error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
