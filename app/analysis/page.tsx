"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type JDAnalysis = {
  role_title: string;
  key_responsibilities: string[];
  required_skills: string[];
  preferred_skills: string[];
  technical_competencies: string[];
  behavioural_competencies: string[];
  experience_expectations: string[];
  important_keywords: string[];
  important_concepts: string[];
  key_qualifications: string[];
};

type SkillMatch = {
  skill: string;
  status: "strong" | "partial" | "missing";
  evidence: string;
};

type ResumeAnalysis = {
  candidate_skills: string[];
  relevant_experience: string[];
  relevant_projects: string[];
  relevant_achievements: string[];
  strengths_vs_jd: string[];
  missing_skills: string[];
  weak_areas: string[];
  claims_to_probe: string[];
  preparation_areas: string[];

  required_skill_matches: SkillMatch[];
  preferred_skill_matches: SkillMatch[];

  experience_relevance: {
    rating: "strong" | "partial" | "missing";
    evidence: string;
  };

  project_relevance: {
    rating: "strong" | "partial" | "missing";
    evidence: string;
  };
};

type JobFit = {
  score: number;
  label:
    | "Strong Match"
    | "Moderate Match"
    | "Weak Match";

  requiredSkillsScore: number;
  preferredSkillsScore: number;
  experienceScore: number;
  projectScore: number;

  strongMatches: string[];
  partialMatches: string[];
  missingWeakMatches: string[];
};

function ListCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="mb-4 text-lg font-semibold">
        {title}
      </h3>

      {items.length === 0 ? (
        <p className="text-sm text-white/40">
          Nothing identified.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="rounded-xl bg-black/20 px-4 py-3 text-sm text-white/80"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Chips({
  items,
}: {
  items: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/75"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function SkillMatchCard({
  match,
}: {
  match: SkillMatch;
}) {
  const statusStyles = {
    strong:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    partial:
      "border-amber-400/20 bg-amber-400/10 text-amber-300",
    missing:
      "border-red-400/20 bg-red-400/10 text-red-300",
  };

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-4">
        <h4 className="font-medium">
          {match.skill}
        </h4>

        <span
          className={`rounded-full border px-3 py-1 text-xs capitalize ${
            statusStyles[match.status]
          }`}
        >
          {match.status}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/60">
        {match.evidence}
      </p>
    </div>
  );
}

export default function AnalysisPage() {
  const router = useRouter();

  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] =
    useState("");

  const [jdAnalysis, setJdAnalysis] =
    useState<JDAnalysis | null>(null);

  const [resumeAnalysis, setResumeAnalysis] =
    useState<ResumeAnalysis | null>(null);

  const [jobFit, setJobFit] =
    useState<JobFit | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const savedJD =
      sessionStorage.getItem(
        "ai-interview-jd"
      );

    const savedResume =
      sessionStorage.getItem(
        "ai-interview-resume"
      );

    if (!savedJD || !savedResume) {
      router.replace("/");
      return;
    }

    setJdText(savedJD);
    setResumeText(savedResume);

    const runAnalysis = async () => {
      try {
        setLoading(true);
        setError("");

        const [jdResponse, resumeResponse] =
          await Promise.all([
            fetch("/api/analyze-jd", {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                jdText: savedJD,
              }),
            }),

            fetch("/api/analyze-resume", {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                jdText: savedJD,
                resumeText: savedResume,
              }),
            }),
          ]);

        const jdData =
          await jdResponse.json();

        const resumeData =
          await resumeResponse.json();

        if (!jdResponse.ok) {
          throw new Error(
            jdData.error ||
              "JD analysis failed."
          );
        }

        if (!resumeResponse.ok) {
          throw new Error(
            resumeData.error ||
              "Resume analysis failed."
          );
        }

        setJdAnalysis(
          jdData.analysis
        );

        setResumeAnalysis(
          resumeData.analysis
        );

        setJobFit(
          resumeData.jobFit
        );

        sessionStorage.setItem(
          "ai-interview-analysis",
          JSON.stringify({
            jdText: savedJD,
            resumeText: savedResume,
            jdAnalysis:
              jdData.analysis,
            resumeAnalysis:
              resumeData.analysis,
            jobFit:
              resumeData.jobFit,
          })
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Analysis failed."
        );
      } finally {
        setLoading(false);
      }
    };

    runAnalysis();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#09090b] px-6 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10">
            <p className="text-sm text-cyan-300">
              Phase 2
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Analyzing your role and profile
            </h1>

            <p className="mt-3 text-white/50">
              Extracting requirements,
              comparing your experience,
              and calculating Job Fit...
            </p>
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-2xl bg-white/5"
                />
              )
            )}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090b] px-6 text-white">
        <div className="w-full max-w-xl rounded-2xl border border-red-400/20 bg-red-400/5 p-8">
          <p className="text-sm text-red-300">
            Analysis failed
          </p>

          <h1 className="mt-2 text-2xl font-bold">
            We couldn't analyze the inputs.
          </h1>

          <p className="mt-4 text-sm leading-6 text-white/60">
            {error}
          </p>

          <button
            onClick={() =>
              window.location.reload()
            }
            className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (
    !jdAnalysis ||
    !resumeAnalysis ||
    !jobFit
  ) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#09090b] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}

        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/40">
            <span>Input</span>
            <span>→</span>
            <span className="text-cyan-300">
              Role Analysis
            </span>
            <span>→</span>
            <span>Candidate Analysis</span>
            <span>→</span>
            <span>Interview</span>
          </div>

          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            {jdAnalysis.role_title}
          </h1>

          <p className="mt-3 max-w-2xl text-white/50">
            Your role requirements,
            candidate strengths, gaps,
            and code-calculated Job Fit.
          </p>
        </header>

        {/* Job Fit */}

        <section className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] p-6">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-white/40">
                Job Fit
              </p>

              <div className="mt-2 flex items-end gap-4">
                <span className="text-6xl font-bold">
                  {jobFit.score}
                </span>

                <span className="pb-2 text-xl text-white/40">
                  / 100
                </span>
              </div>

              <p className="mt-2 text-sm text-cyan-300">
                {jobFit.label}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ScoreBox
                label="Required"
                value={Math.round(
                  jobFit.requiredSkillsScore *
                    100
                )}
              />

              <ScoreBox
                label="Preferred"
                value={Math.round(
                  jobFit.preferredSkillsScore *
                    100
                )}
              />

              <ScoreBox
                label="Experience"
                value={Math.round(
                  jobFit.experienceScore *
                    100
                )}
              />

              <ScoreBox
                label="Projects"
                value={Math.round(
                  jobFit.projectScore *
                    100
                )}
              />
            </div>
          </div>
        </section>

        {/* Role Analysis */}

        <section className="mb-10">
          <SectionHeading
            eyebrow="01"
            title="Role Analysis"
          />

          <div className="grid gap-5 lg:grid-cols-2">
            <ListCard
              title="Key Responsibilities"
              items={
                jdAnalysis.key_responsibilities
              }
            />

            <ListCard
              title="Experience Expectations"
              items={
                jdAnalysis.experience_expectations
              }
            />

            <ListCard
              title="Technical Competencies"
              items={
                jdAnalysis.technical_competencies
              }
            />

            <ListCard
              title="Behavioural Competencies"
              items={
                jdAnalysis.behavioural_competencies
              }
            />

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="mb-4 text-lg font-semibold">
                Required Skills
              </h3>

              <Chips
                items={
                  jdAnalysis.required_skills
                }
              />
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="mb-4 text-lg font-semibold">
                Preferred Skills
              </h3>

              <Chips
                items={
                  jdAnalysis.preferred_skills
                }
              />
            </section>
          </div>
        </section>

        {/* Candidate Analysis */}

        <section className="mb-10">
          <SectionHeading
            eyebrow="02"
            title="Candidate Analysis"
          />

          <div className="grid gap-5 lg:grid-cols-2">
            <ListCard
              title="Candidate Skills"
              items={
                resumeAnalysis.candidate_skills
              }
            />

            <ListCard
              title="Relevant Experience"
              items={
                resumeAnalysis.relevant_experience
              }
            />

            <ListCard
              title="Relevant Projects"
              items={
                resumeAnalysis.relevant_projects
              }
            />

            <ListCard
              title="Relevant Achievements"
              items={
                resumeAnalysis.relevant_achievements
              }
            />

            <ListCard
              title="Strengths vs JD"
              items={
                resumeAnalysis.strengths_vs_jd
              }
            />

            <ListCard
              title="Preparation Areas"
              items={
                resumeAnalysis.preparation_areas
              }
            />
          </div>
        </section>

        {/* Skill comparison */}

        <section className="mb-10">
          <SectionHeading
            eyebrow="03"
            title="Skill-by-Skill Match"
          />

          <div className="space-y-8">
            <div>
              <h3 className="mb-4 text-xl font-semibold">
                Required Skills
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                {resumeAnalysis.required_skill_matches.map(
                  (match) => (
                    <SkillMatchCard
                      key={match.skill}
                      match={match}
                    />
                  )
                )}
              </div>
            </div>

            {resumeAnalysis
              .preferred_skill_matches.length >
              0 && (
              <div>
                <h3 className="mb-4 text-xl font-semibold">
                  Preferred Skills
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  {resumeAnalysis.preferred_skill_matches.map(
                    (match) => (
                      <SkillMatchCard
                        key={match.skill}
                        match={match}
                      />
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Three match groups */}

        <section className="mb-10">
          <SectionHeading
            eyebrow="04"
            title="Match Summary"
          />

          <div className="grid gap-5 md:grid-cols-3">
            <MatchGroup
              title="Strong Match"
              items={
                jobFit.strongMatches
              }
              type="strong"
            />

            <MatchGroup
              title="Partial Match"
              items={
                jobFit.partialMatches
              }
              type="partial"
            />

            <MatchGroup
              title="Missing / Weak"
              items={
                jobFit.missingWeakMatches
              }
              type="missing"
            />
          </div>
        </section>

        {/* Interview preparation */}

        <section className="mb-10 grid gap-5 lg:grid-cols-2">
          <ListCard
            title="Claims to Probe"
            items={
              resumeAnalysis.claims_to_probe
            }
          />

          <ListCard
            title="Weak / Insufficient Areas"
            items={
              resumeAnalysis.weak_areas
            }
          />
        </section>

        {/* Continue */}

        <div className="flex justify-end border-t border-white/10 pt-8">
          <button
            onClick={() =>
              router.push("/interview")
            }
            className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-white/90"
          >
            Continue to Interview →
          </button>
        </div>
      </div>
    </main>
  );
}

function ScoreBox({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
      <p className="text-xs text-white/40">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold">
        {value}%
      </p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-5">
      <p className="text-xs font-medium tracking-[0.2em] text-cyan-300">
        {eyebrow}
      </p>

      <h2 className="mt-1 text-2xl font-bold">
        {title}
      </h2>
    </div>
  );
}

function MatchGroup({
  title,
  items,
  type,
}: {
  title: string;
  items: string[];
  type: "strong" | "partial" | "missing";
}) {
  const styles = {
    strong:
      "border-emerald-400/20 bg-emerald-400/5",
    partial:
      "border-amber-400/20 bg-amber-400/5",
    missing:
      "border-red-400/20 bg-red-400/5",
  };

  return (
    <div
      className={`rounded-2xl border p-5 ${styles[type]}`}
    >
      <h3 className="font-semibold">
        {title}
      </h3>

      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-white/40">
            None identified.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item}
              className="rounded-lg bg-black/20 px-3 py-2 text-sm text-white/75"
            >
              {item}
            </div>
          ))
        )}
      </div>
    </div>
  );
}