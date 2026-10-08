
function limitText(text: string, maxLength: number): string {
  const cleaned = text.trim().replace(/\s+/g, " ");

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return cleaned.slice(0, maxLength);
}

export const INTERVIEW_SYSTEM_PROMPT = `
You are a technical interviewer.

Generate exactly 8 relevant interview questions using the supplied job
description and resume.

Rules:
- Return one valid JSON object only.
- Never invent candidate experience or project details.
- Ask questions relevant to the role and candidate's actual resume.
- Generate 4 technical, 2 project-based, and 2 behavioral questions.
- Use concise, clear questions.
- Mix easy, medium, and hard difficulty where appropriate.
- Each question must include category, difficulty, question, why_asked,
  and evaluation_points.
- evaluation_points must contain 1 to 3 short strings.
- Use category values: technical, project, behavioral.
- Use difficulty values: easy, medium, hard.
- Do not include answers or lengthy explanations.
- Match the requested JSON structure exactly.
`;

export function buildInterviewPrompt(
  jdText: string,
  resumeText: string
): string {
  const jd = limitText(jdText, 2500);
  const resume = limitText(resumeText, 3000);

  return `
JOB DESCRIPTION:
${jd}

CANDIDATE RESUME:
${resume}

Return exactly this JSON structure:
{
  "role_title": "Job role from the JD",
  "questions": [
    {
      "category": "technical",
      "difficulty": "medium",
      "question": "A concise role-specific question",
      "why_asked": "A short reason this question is relevant",
      "evaluation_points": ["First point", "Second point"]
    }
  ]
}

The questions array must contain exactly 8 objects:
4 technical, 2 project, and 2 behavioral questions.

Return valid JSON only.
`;
}
