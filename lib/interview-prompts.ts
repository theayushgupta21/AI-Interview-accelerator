

type InterviewConfig = {
  interviewType: "mixed" | "technical" | "hr" | "project";
  difficulty: "easy" | "medium" | "hard";
  questionCount: 5 | 10 | 15;
  interviewLevel: "screening" | "competency" | "deep-dive";
};


function limitText(text: string, maxLength: number): string {
  const cleaned = text.trim().replace(/\s+/g, " ");
  return cleaned.length <= maxLength
    ? cleaned
    : cleaned.slice(0, maxLength);
}

export const INTERVIEW_SYSTEM_PROMPT = `
You are a professional AI interviewer.
Return one valid JSON object only.
Never invent candidate experience or project details.
Ask concise, role-relevant questions grounded in the job description and resume.
Each question must include category, difficulty, question, why_asked,
and evaluation_points.
Use categories: technical, project, behavioral.
Use difficulties: easy, medium, hard.
Each evaluation_points array must contain 1 to 3 short strings.
Do not include answers or markdown fences.
`;

export function buildInterviewPrompt(
  jdText: string,
  resumeText: string,
  config: InterviewConfig
): string {
  const jd = limitText(jdText, 2500);
  const resume = limitText(resumeText, 3000);

  
  const levelInstructions = {
    screening:
      "Focus on resume validation, motivation, communication, and overall role fit. Ask foundational questions.",
    competency:
      "Assess technical skills, problem-solving, project contributions, and behavioral competencies. Ask for concrete examples.",
    "deep-dive":
      "Probe technical decisions, architecture, trade-offs, implementation details, and vague resume claims. Ask challenging follow-up questions.",
  };


  return `
JOB DESCRIPTION:
${jd}

CANDIDATE RESUME:
${resume}


INTERVIEW LEVEL: ${config.interviewLevel}
${levelInstructions[config.interviewLevel]}


TARGET DIFFICULTY: ${config.difficulty}
QUESTION COUNT: ${config.questionCount}

Generate exactly ${config.questionCount} questions.
Use the requested difficulty as the default for all questions.
Questions must be specific to the role and candidate's actual experience.

Return this JSON structure:
{
  "role_title": "Job role from the JD",
  "questions": [
    {
      "category": "technical",
      "difficulty": "${config.difficulty}",
      "question": "A concise role-specific question",
      "why_asked": "Why this question is relevant",
      "evaluation_points": ["Expected point"]
    }
  ]
}

The questions array must contain exactly ${config.questionCount} objects.
Return valid JSON only.
`;
}
