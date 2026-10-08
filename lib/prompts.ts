
import type { JDAnalysis, ResumeAnalysis } from "@/lib/schemas";

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function clipText(text: string, maxCharacters: number): string {
  const cleaned = text.trim().replace(/\s+/g, " ");

  if (cleaned.length <= maxCharacters) {
    return cleaned;
  }

  return cleaned.slice(0, maxCharacters) + " [truncated]";
}

/* -------------------------------------------------------------------------- */
/* JD ANALYSIS                                                                */
/* -------------------------------------------------------------------------- */

export const JD_ANALYSIS_SYSTEM_PROMPT = `
You are a technical recruiter analyzing job descriptions.

Rules:
- Return one valid JSON object only; no Markdown or extra keys.
- Use only information stated or strongly implied by the JD.
- Never invent requirements or qualifications.
- Separate required/preferred skills and technical/behavioural competencies.
- Normalize duplicate skill names.
- Keep items concise and use [] when information is absent.
- Follow the exact requested JSON structure.
`;

/* -------------------------------------------------------------------------- */
/* RESUME ANALYSIS                                                            */
/* -------------------------------------------------------------------------- */

export const RESUME_ANALYSIS_SYSTEM_PROMPT = `
You compare a candidate's resume with a job description.

Rules:
- Return one valid JSON object only, matching the requested structure.
- Use only supplied JD and resume evidence. Never invent facts.
- Assess every required and preferred skill identified in the JD.
- Skill match fields: skill, status, evidence.
- Status and relevance ratings must be "strong", "partial", or "missing".
- strong: direct, convincing resume evidence.
- partial: related evidence, but proficiency is not established.
- missing: skill is not mentioned in the resume.
- Evidence must be a short, non-empty, truthful sentence.
- Missing evidence does not prove lack of ability.
- Keep general summary lists to at most 3 high-value items each.
- Keep each evidence statement to one short sentence.
- Do not calculate Job Fit; application code calculates it.
- Include all required keys, no extra keys, and valid JSON only.
`;

/* -------------------------------------------------------------------------- */
/* JD PROMPT                                                                  */
/* -------------------------------------------------------------------------- */

export function buildJDAnalysisPrompt(jdText: string): string {
  const jobDescription = clipText(jdText, 2500);

  return `
Analyze this job description.

JD:
${jobDescription}

Return exactly this JSON structure:
{
  "role_title": "",
  "key_responsibilities": [],
  "required_skills": [],
  "preferred_skills": [],
  "technical_competencies": [],
  "behavioural_competencies": [],
  "experience_expectations": [],
  "important_keywords": [],
  "important_concepts": [],
  "key_qualifications": []
}

Requirements:
- Include every key; use arrays except for role_title.
- Extract only supported information; no duplicates or invented facts.
- Keep general lists concise, prioritizing the most important items.
- Preserve distinct required and preferred skills.
- Use "Not specified" if the role title is unclear.
- Return valid JSON only.
`;
}

/* -------------------------------------------------------------------------- */
/* RESUME PROMPT                                                              */
/* -------------------------------------------------------------------------- */

export function buildResumeAnalysisPrompt(
  jdText: string,
  resumeText: string
): string {
const jobDescription = clipText(jdText, 3000);
const resume = clipText(resumeText, 4000);

  return `
Compare the resume with the JD.

JD:
${jobDescription}

RESUME:
${resume}

Return exactly this JSON structure:
{
  "candidate_skills": [],
  "relevant_experience": [],
  "relevant_projects": [],
  "relevant_achievements": [],
  "strengths_vs_jd": [],
  "missing_skills": [],
  "weak_areas": [],
  "claims_to_probe": [],
  "preparation_areas": [],
  "required_skill_matches": [],
  "preferred_skill_matches": [],
  "experience_relevance": {
    "rating": "missing",
    "evidence": "No relevant experience is established by the supplied resume."
  },
  "project_relevance": {
    "rating": "missing",
    "evidence": "No relevant project is established by the supplied resume."
  }
}

Rules:
- Assess every required and preferred skill identified in the JD.
- Each skill match must contain skill, status, and evidence.
- Skill names must come from the JD.
- Status and relevance ratings: "strong", "partial", or "missing".
- Base evidence only on the resume; never invent facts.
- For a missing skill, say it is not mentioned in the resume.
- Relevance evidence must consider both the JD and resume.
- Use a truthful, concise, non-empty evidence sentence for every match.
- Keep general summary lists to at most 3 relevant items each.
- Use [] for empty lists.
- Do not calculate Job Fit.
- Include every key, no extra keys, and return valid JSON only.
`;
}

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export type JDAnalysisOutput = JDAnalysis;
export type ResumeAnalysisOutput = ResumeAnalysis;
