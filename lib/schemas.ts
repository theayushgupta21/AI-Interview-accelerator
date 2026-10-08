import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Common schemas
|--------------------------------------------------------------------------
*/

export const skillStatusSchema = z.enum([
  "strong",
  "partial",
  "missing",
]);

export const relevanceSchema = z.enum([
  "strong",
  "partial",
  "missing",
]);

export const skillMatchSchema = z.object({
  skill: z.string().min(1),
  status: skillStatusSchema,
  evidence: z.string().min(1),
});

/*
|--------------------------------------------------------------------------
| JD Analysis
|--------------------------------------------------------------------------
*/

export const jdAnalysisSchema = z.object({
  role_title: z.string().min(1),

  key_responsibilities: z
    .array(z.string())
    .min(1),

  required_skills: z
    .array(z.string()),

  preferred_skills: z
    .array(z.string()),

  technical_competencies: z
    .array(z.string()),

  behavioural_competencies: z
    .array(z.string()),

  experience_expectations: z
    .array(z.string()),

  important_keywords: z
    .array(z.string()),

  important_concepts: z
    .array(z.string()),

  key_qualifications: z
    .array(z.string()),
});

/*
|--------------------------------------------------------------------------
| Resume / Candidate Analysis
|--------------------------------------------------------------------------
*/

export const resumeAnalysisSchema = z.object({
  candidate_skills: z
    .array(z.string()),

  relevant_experience: z
    .array(z.string()),

  relevant_projects: z
    .array(z.string()),

  relevant_achievements: z
    .array(z.string()),

  strengths_vs_jd: z
    .array(z.string()),

  missing_skills: z
    .array(z.string()),

  weak_areas: z
    .array(z.string()),

  claims_to_probe: z
    .array(z.string()),

  preparation_areas: z
    .array(z.string()),

  required_skill_matches: z
    .array(skillMatchSchema),

  preferred_skill_matches: z
    .array(skillMatchSchema),

  experience_relevance: z.object({
    rating: relevanceSchema,
    evidence: z.string().min(1),
  }),

  project_relevance: z.object({
    rating: relevanceSchema,
    evidence: z.string().min(1),
  }),
});

/*
|--------------------------------------------------------------------------
| File extraction
|--------------------------------------------------------------------------
*/

export const extractedFileSchema = z.object({
  filename: z.string(),
  fileType: z.enum(["pdf", "docx", "txt"]),
  text: z.string(),
  characterCount: z.number().int().nonnegative(),
});

/*
|--------------------------------------------------------------------------
| LLM error
|--------------------------------------------------------------------------
*/

export const llmErrorSchema = z.object({
  error: z.string(),
  provider: z.string().optional(),
  retryable: z.boolean().optional(),
});

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type SkillStatus = z.infer<typeof skillStatusSchema>;

export type JDAnalysis = z.infer<
  typeof jdAnalysisSchema
>;

export type ResumeAnalysis = z.infer<
  typeof resumeAnalysisSchema
>;

export type ExtractedFile = z.infer<
  typeof extractedFileSchema
>;

export type LLMError = z.infer<
  typeof llmErrorSchema
>;

export const interviewQuestionSchema = z.object({
  category: z.enum(["technical", "project", "behavioral"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  question: z.string().min(1),
  why_asked: z.string().min(1),
  evaluation_points: z.array(z.string().min(1)).min(1).max(3),
});

export const interviewQuestionsSchema = z.object({
  role_title: z.string().min(1),
  questions: z.array(interviewQuestionSchema).length(8),
});

export type InterviewQuestion = z.infer<
  typeof interviewQuestionSchema
>;

export type InterviewQuestions = z.infer<
  typeof interviewQuestionsSchema
>;


export const answerEvaluationSchema = z.object({
  score: z.number().int().min(0).max(100),

  // Keep long model feedback from failing validation.
  feedback: z.string().transform((value) => value.slice(0, 500)),

  // Missing arrays default to empty arrays.
  strengths: z
    .array(z.string().min(1))
    .transform((items) => items.slice(0, 3))
    .default([]),

  improvements: z
    .array(z.string().min(1))
    .transform((items) => items.slice(0, 3))
    .default([]),

  missed_points: z
    .array(z.string().min(1))
    .transform((items) => items.slice(0, 3))
    .default([]),

  follow_up_question: z.string().min(1).transform(
    (value) => value.slice(0, 300)
  ),

  follow_up_reason: z
    .string()
    .optional()
    .default("To clarify and deepen understanding.")
    .transform((value) => value.slice(0, 200)),
});

export type AnswerEvaluation = z.infer<
  typeof answerEvaluationSchema
>;

