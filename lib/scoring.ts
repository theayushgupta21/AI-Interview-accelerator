import type {
  ResumeAnalysis,
  SkillStatus,
} from "@/lib/schemas";

function statusToScore(
  status: SkillStatus
): number {
  switch (status) {
    case "strong":
      return 1;

    case "partial":
      return 0.5;

    case "missing":
      return 0;

    default:
      return 0;
  }
}

function averageStatus(
  statuses: SkillStatus[]
): number {
  if (statuses.length === 0) {
    return 0;
  }

  const total = statuses.reduce(
    (sum, status) =>
      sum + statusToScore(status),
    0
  );

  return total / statuses.length;
}

function relevanceToScore(
  rating: SkillStatus
): number {
  return statusToScore(rating);
}

export interface JobFitResult {
  score: number;
  label: "Strong Match" | "Moderate Match" | "Weak Match";

  requiredSkillsScore: number;
  preferredSkillsScore: number;
  experienceScore: number;
  projectScore: number;

  strongMatches: string[];
  partialMatches: string[];
  missingWeakMatches: string[];
}

/*
|--------------------------------------------------------------------------
| Job Fit formula
|--------------------------------------------------------------------------
|
| 50% required skills
| 15% preferred skills
| 20% experience relevance
| 15% project relevance
|
|--------------------------------------------------------------------------
*/

export function calculateJobFit(
  analysis: ResumeAnalysis
): JobFitResult {
  const requiredStatuses =
    analysis.required_skill_matches.map(
      (item) => item.status
    );

  const preferredStatuses =
    analysis.preferred_skill_matches.map(
      (item) => item.status
    );

  const requiredSkillsScore =
    averageStatus(requiredStatuses);

  /*
   * If the JD has no preferred skills, treat that category
   * as neutral rather than penalizing the candidate.
   */
  const preferredSkillsScore =
    preferredStatuses.length > 0
      ? averageStatus(preferredStatuses)
      : 1;

  const experienceScore =
    relevanceToScore(
      analysis.experience_relevance.rating
    );

  const projectScore =
    relevanceToScore(
      analysis.project_relevance.rating
    );

  const rawScore =
    requiredSkillsScore * 50 +
    preferredSkillsScore * 15 +
    experienceScore * 20 +
    projectScore * 15;

  const score = Math.round(
    Math.max(0, Math.min(100, rawScore))
  );

  let label:
    | "Strong Match"
    | "Moderate Match"
    | "Weak Match";

  if (score >= 80) {
    label = "Strong Match";
  } else if (score >= 60) {
    label = "Moderate Match";
  } else {
    label = "Weak Match";
  }

  const allMatches = [
    ...analysis.required_skill_matches,
    ...analysis.preferred_skill_matches,
  ];

  const strongMatches = allMatches
    .filter((item) => item.status === "strong")
    .map((item) => item.skill);

  const partialMatches = allMatches
    .filter((item) => item.status === "partial")
    .map((item) => item.skill);

  const missingWeakMatches = allMatches
    .filter((item) => item.status === "missing")
    .map((item) => item.skill);

  return {
    score,
    label,

    requiredSkillsScore,
    preferredSkillsScore,
    experienceScore,
    projectScore,

    strongMatches,
    partialMatches,
    missingWeakMatches,
  };
}