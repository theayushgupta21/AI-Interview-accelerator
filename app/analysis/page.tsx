
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
  label: "Strong Match" | "Moderate Match" | "Weak Match";
  requiredSkillsScore: number;
  preferredSkillsScore: number;
  experienceScore: number;
  projectScore: number;
  strongMatches: string[];
  partialMatches: string[];
  missingWeakMatches: string[];
};

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-white/[0.08] bg-[#11131a]/90 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

function SectionHeading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.08] text-xs font-semibold text-cyan-300">
        {number}
      </span>
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm leading-6 text-white/40">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function ListCard({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon?: string;
}) {
  return (
    <Panel className="h-full transition duration-200 hover:border-white/[0.14]">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
        {icon && (
          <span className="text-base text-cyan-300">{icon}</span>
        )}
        {title}
        <span className="ml-auto rounded-lg bg-white/[0.05] px-2 py-1 text-xs font-medium text-white/40">
          {items?.length ?? 0}
        </span>
      </h3>

      {!items || items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-sm text-white/35">
          Nothing identified in the analysis.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex gap-3 rounded-xl bg-white/[0.025] px-3.5 py-3 text-sm leading-6 text-white/70"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/70" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Chips({ items }: { items: string[] }) {
  if (!items || items.length === 0) {
    return (
      <p className="text-sm text-white/35">
        No skills identified.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className="rounded-lg border border-white/[0.09] bg-white/[0.035] px-3 py-2 text-xs font-medium text-white/75 transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.06]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const safeScore = Math.max(0, Math.min(100, score));

  return (
    <div
      className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full sm:h-48 sm:w-48"
      style={{
        background: `conic-gradient(#22d3ee ${safeScore * 3.6}deg, rgba(255,255,255,0.07) 0deg)`,
      }}
      role="img"
      aria-label={`Job Fit score: ${safeScore} out of 100`}
    >
      <div className="absolute inset-[7px] rounded-full border border-white/[0.06] bg-[#11131a]" />
      <div className="relative text-center">
        <p className="text-5xl font-semibold tracking-tighter text-white sm:text-6xl">
          {safeScore}
        </p>
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-white/40">
          Out of 100
        </p>
      </div>
    </div>
  );
}

function ScoreBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  const percentage = Math.round(
    Math.max(0, Math.min(1, value)) * 100
  );

  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-lg text-cyan-300">{icon}</span>
        <span className="text-xl font-semibold tabular-nums text-white">
          {percentage}%
        </span>
      </div>
      <p className="mt-3 text-xs text-white/45">{label}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function SkillMatchCard({ match }: { match: SkillMatch }) {
  const styles = {
    strong: {
      badge: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      dot: "bg-emerald-400",
      label: "Strong match",
    },
    partial: {
      badge: "border-amber-400/20 bg-amber-400/10 text-amber-300",
      dot: "bg-amber-400",
      label: "Partial match",
    },
    missing: {
      badge: "border-rose-400/20 bg-rose-400/10 text-rose-300",
      dot: "bg-rose-400",
      label: "Missing",
    },
  };

  const style = styles[match.status];

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition hover:border-white/[0.14]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
          <h4 className="font-medium text-white">{match.skill}</h4>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${style.badge}`}
        >
          {style.label}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/50">
        {match.evidence}
      </p>
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
    strong: {
      border: "border-emerald-400/15",
      dot: "bg-emerald-400",
      text: "text-emerald-300",
    },
    partial: {
      border: "border-amber-400/15",
      dot: "bg-amber-400",
      text: "text-amber-300",
    },
    missing: {
      border: "border-rose-400/15",
      dot: "bg-rose-400",
      text: "text-rose-300",
    },
  };

  const style = styles[type];

  return (
    <div className={`rounded-2xl border bg-[#11131a] p-5 ${style.border}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${style.dot}`} />
        <h3 className={`font-semibold ${style.text}`}>{title}</h3>
        <span className="ml-auto rounded-md bg-white/[0.05] px-2 py-1 text-xs text-white/45">
          {items?.length ?? 0}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {!items || items.length === 0 ? (
          <p className="text-sm text-white/35">None identified.</p>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="rounded-lg bg-white/[0.025] px-3 py-2.5 text-sm leading-5 text-white/70"
            >
              {item}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RatingCard({
  title,
  rating,
  evidence,
}: {
  title: string;
  rating: "strong" | "partial" | "missing";
  evidence: string;
}) {
  const styles = {
    strong: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    partial: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    missing: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  };

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-white">{title}</h3>
        <span
          className={`rounded-full border px-3 py-1 text-xs capitalize ${styles[rating]}`}
        >
          {rating}
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/55">
        {evidence || "No supporting evidence was provided."}
      </p>
    </Panel>
  );
}

export default function AnalysisPage() {
  const router = useRouter();
const [jdText, setJdText] = useState("");
const [resumeText, setResumeText] = useState("");
const [retryKey, setRetryKey] = useState<number>(0);
const [jdAnalysis, setJdAnalysis] =
  useState<JDAnalysis | null>(null);

const [resumeAnalysis, setResumeAnalysis] =
  useState<ResumeAnalysis | null>(null);

const [jobFit, setJobFit] =
  useState<JobFit | null>(null);

const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
  let isActive = true;
  const controller = new AbortController();

  const runAnalysis = async () => {
    try {
      setLoading(true);
      setError("");

      const savedJD = sessionStorage.getItem("ai-interview-jd");
      const savedResume = sessionStorage.getItem("ai-interview-resume");

      if (!savedJD?.trim() || !savedResume?.trim()) {
        router.replace("/");
        return;
      }

      setJdText(savedJD);
      setResumeText(savedResume);

      // 1. Reuse cached analysis if the inputs have not changed.
      try {
        const cached = sessionStorage.getItem("ai-interview-analysis");

        if (cached) {
          const parsed = JSON.parse(cached);

          if (
            parsed.jdText === savedJD &&
            parsed.resumeText === savedResume &&
            parsed.jdAnalysis &&
            parsed.resumeAnalysis &&
            parsed.jobFit
          ) {
            if (isActive) {
              setJdAnalysis(parsed.jdAnalysis);
              setResumeAnalysis(parsed.resumeAnalysis);
              setJobFit(parsed.jobFit);
            }
            return;
          }
        }
      } catch {
        // Invalid cache: continue with a fresh analysis.
      }

      // 2. Run both independent API requests in parallel.
      const [jdResponse, resumeResponse] = await Promise.all([
        fetch("/api/analyze-jd", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jdText: savedJD }),
          signal: controller.signal,
        }),

        fetch("/api/analyze-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jdText: savedJD,
            resumeText: savedResume,
          }),
          signal: controller.signal,
        }),
      ]);

      // 3. Handle invalid JSON responses safely.
      const [jdData, resumeData] = await Promise.all([
        jdResponse.json().catch(() => ({})),
        resumeResponse.json().catch(() => ({})),
      ]);

      if (!jdResponse.ok) {
        throw new Error(
          jdData.error || `JD analysis failed (${jdResponse.status}).`
        );
      }

      if (!resumeResponse.ok) {
        throw new Error(
          resumeData.error ||
            `Resume analysis failed (${resumeResponse.status}).`
        );
      }

      if (
        !jdData.analysis ||
        !resumeData.analysis ||
        !resumeData.jobFit
      ) {
        throw new Error("Incomplete analysis response. Please retry.");
      }

      // 4. Save the completed analysis.
      const result = {
        jdText: savedJD,
        resumeText: savedResume,
        jdAnalysis: jdData.analysis,
        resumeAnalysis: resumeData.analysis,
        jobFit: resumeData.jobFit,
      };

      try {
        sessionStorage.setItem(
          "ai-interview-analysis",
          JSON.stringify(result)
        );
      } catch {
        // Storage errors should not prevent displaying the results.
      }

      if (!isActive) return;

      setJdAnalysis(result.jdAnalysis);
      setResumeAnalysis(result.resumeAnalysis);
      setJobFit(result.jobFit);
    } catch (err) {
      if (!isActive || controller.signal.aborted) return;

      setError(
        err instanceof Error
          ? err.message
          : "Analysis failed. Please try again."
      );
    } finally {
      if (isActive) {
        setLoading(false);
      }
    }
  };

  runAnalysis();

  return () => {
    isActive = false;
    controller.abort();
  };
}, [router]);


  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#08090d] px-4 py-12 text-white sm:px-6">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.08),transparent_45%)]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="mb-10">
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] px-3 py-1.5 text-xs font-medium text-cyan-300">
              PHASE 02 / ANALYSIS
            </span>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
              Understanding your fit
              <span className="text-cyan-300">.</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/45 sm:text-base">
              Comparing role requirements with your skills, experience,
              and projects.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-2xl border border-white/[0.07] bg-white/[0.025]"
              />
            ))}
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-56 animate-pulse rounded-2xl border border-white/[0.07] bg-white/[0.025]"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090d] px-4 py-12 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-rose-400/15 bg-[#11131a] p-7 sm:p-9">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/[0.08] text-xl text-rose-300">
            !
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">
            Analysis interrupted
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            We couldn&apos;t finish your analysis.
          </h1>
          <p className="mt-3 break-words text-sm leading-6 text-white/50">
            {error}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => setRetryKey((value) => value + 1)}
              className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-[#071014] transition hover:bg-cyan-200"
            >
              Try again
            </button>
            <button
              onClick={() => router.push("/")}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/75 transition hover:bg-white/[0.08]"
            >
              Back to inputs
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!jdAnalysis || !resumeAnalysis || !jobFit) return null;

  const score = Math.max(0, Math.min(100, Math.round(jobFit.score)));

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08090d] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-cyan-500/[0.07] blur-[120px]" />
        <div className="absolute -right-40 top-[30%] h-[460px] w-[460px] rounded-full bg-violet-500/[0.06] blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] text-lg font-bold text-cyan-300">
                A
              </div>
              <div>
                <p className="font-semibold tracking-tight">
                  Interview<span className="text-cyan-300">Accelerator</span>
                </p>
                <p className="text-xs text-white/35">
                  Your personalized preparation workspace
                </p>
              </div>
            </div>
            <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-xs text-emerald-300">
              Analysis ready
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2 text-xs text-white/35">
            <span>01 Input</span>
            <span>/</span>
            <span className="text-cyan-300">02 Role & profile analysis</span>
            <span>/</span>
            <span>03 Adaptive interview</span>
          </div>

          <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-cyan-300">
                YOUR ANALYSIS REPORT
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
                {jdAnalysis.role_title}
                <span className="text-cyan-300">.</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45 sm:text-base">
                See where your profile aligns with the role, which skills
                need attention, and what to prepare before your interview.
              </p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="self-start rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2.5 text-sm text-white/65 transition hover:bg-white/[0.08] sm:self-auto"
            >
              Edit inputs ↗
            </button>
          </div>
        </header>

        {/* Job Fit hero */}
        <section className="relative mb-10 overflow-hidden rounded-3xl border border-white/[0.09] bg-gradient-to-br from-[#151b24] via-[#11131a] to-[#111019] p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-cyan-400/[0.07] blur-[90px]" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-80 rounded-full bg-violet-500/[0.05] blur-[80px]" />

          <div className="relative grid gap-8 lg:grid-cols-[0.85fr_1.5fr] lg:items-center">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
              <ScoreRing score={score} />
              <div className="text-center sm:text-left">
                <p className="text-sm text-white/45">Your Job Fit score</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  {jobFit.label}
                </h2>
                <p className="mt-2 max-w-xs text-sm leading-6 text-white/45">
                  A structured comparison of your profile against the
                  requirements provided.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/[0.06] px-3 py-1.5 text-xs text-cyan-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                  Profile comparison complete
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ScoreBox
                label="Required skills"
                value={jobFit.requiredSkillsScore}
                icon="⌘"
              />
              <ScoreBox
                label="Preferred skills"
                value={jobFit.preferredSkillsScore}
                icon="✳"
              />
              <ScoreBox
                label="Experience"
                value={jobFit.experienceScore}
                icon="↗"
              />
              <ScoreBox
                label="Projects"
                value={jobFit.projectScore}
                icon="◇"
              />
            </div>
          </div>
          <p className="relative mt-6 border-t border-white/[0.07] pt-4 text-xs leading-5 text-white/35">
            Job Fit is an estimate based on the supplied resume and job
            description. It is not a hiring decision or a guarantee of
            interview performance.
          </p>
        </section>

        {/* Role analysis */}
        <section className="mb-12">
          <SectionHeading
            number="01"
            title="Understand the role"
            description="The key expectations and capabilities identified in the job description."
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <ListCard
              title="Key responsibilities"
              items={jdAnalysis.key_responsibilities}
              icon="↗"
            />
            <ListCard
              title="Experience expectations"
              items={jdAnalysis.experience_expectations}
              icon="◷"
            />
            <ListCard
              title="Technical competencies"
              items={jdAnalysis.technical_competencies}
              icon="⌘"
            />
            <ListCard
              title="Behavioural competencies"
              items={jdAnalysis.behavioural_competencies}
              icon="◎"
            />

            <Panel>
              <h3 className="mb-4 text-base font-semibold text-white">
                Required skills
              </h3>
              <Chips items={jdAnalysis.required_skills} />
            </Panel>

            <Panel>
              <h3 className="mb-4 text-base font-semibold text-white">
                Preferred skills
              </h3>
              <Chips items={jdAnalysis.preferred_skills} />
            </Panel>
          </div>
        </section>

        {/* Candidate analysis */}
        <section className="mb-12">
          <SectionHeading
            number="02"
            title="Your candidate profile"
            description="Your resume evidence, relevant work, and preparation priorities."
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <ListCard
              title="Candidate skills"
              items={resumeAnalysis.candidate_skills}
              icon="⌘"
            />
            <ListCard
              title="Relevant experience"
              items={resumeAnalysis.relevant_experience}
              icon="◷"
            />
            <ListCard
              title="Relevant projects"
              items={resumeAnalysis.relevant_projects}
              icon="◇"
            />
            <ListCard
              title="Relevant achievements"
              items={resumeAnalysis.relevant_achievements}
              icon="✳"
            />
            <ListCard
              title="Strengths against the JD"
              items={resumeAnalysis.strengths_vs_jd}
              icon="↗"
            />
            <ListCard
              title="Preparation areas"
              items={resumeAnalysis.preparation_areas}
              icon="◎"
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <RatingCard
              title="Experience relevance"
              rating={resumeAnalysis.experience_relevance.rating}
              evidence={resumeAnalysis.experience_relevance.evidence}
            />
            <RatingCard
              title="Project relevance"
              rating={resumeAnalysis.project_relevance.rating}
              evidence={resumeAnalysis.project_relevance.evidence}
            />
          </div>
        </section>

        {/* Skills comparison */}
        <section className="mb-12">
          <SectionHeading
            number="03"
            title="Skill-by-skill comparison"
            description="Review the evidence for each skill and identify gaps to work on."
          />

          <Panel>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">
                Required skills
              </h3>
              <div className="flex flex-wrap gap-3 text-xs text-white/45">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Strong
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Partial
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  Missing
                </span>
              </div>
            </div>

            {resumeAnalysis.required_skill_matches.length === 0 ? (
              <p className="text-sm text-white/40">
                No required skill matches were returned.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {resumeAnalysis.required_skill_matches.map((match, index) => (
                  <SkillMatchCard
                    key={`${match.skill}-${index}`}
                    match={match}
                  />
                ))}
              </div>
            )}
          </Panel>

          {resumeAnalysis.preferred_skill_matches.length > 0 && (
            <Panel className="mt-4">
              <h3 className="mb-5 text-lg font-semibold">
                Preferred skills
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {resumeAnalysis.preferred_skill_matches.map((match, index) => (
                  <SkillMatchCard
                    key={`${match.skill}-${index}`}
                    match={match}
                  />
                ))}
              </div>
            </Panel>
          )}
        </section>

        {/* Match summary */}
        <section className="mb-12">
          <SectionHeading
            number="04"
            title="Match summary"
            description="A quick overview of where your profile aligns and where to focus next."
          />

          <div className="grid gap-4 md:grid-cols-3">
            <MatchGroup
              title="Strong matches"
              items={jobFit.strongMatches}
              type="strong"
            />
            <MatchGroup
              title="Partial matches"
              items={jobFit.partialMatches}
              type="partial"
            />
            <MatchGroup
              title="Missing / weak"
              items={jobFit.missingWeakMatches}
              type="missing"
            />
          </div>
        </section>

        {/* Interview preparation */}
        <section className="mb-12">
          <SectionHeading
            number="05"
            title="Prepare for the interview"
            description="Identify resume claims that deserve deeper questions and areas worth revising."
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <ListCard
              title="Claims to probe"
              items={resumeAnalysis.claims_to_probe}
              icon="?"
            />
            <ListCard
              title="Weak or insufficient areas"
              items={resumeAnalysis.weak_areas}
              icon="!"
            />
            <ListCard
              title="Important job keywords"
              items={jdAnalysis.important_keywords}
              icon="#"
            />
            <ListCard
              title="Important concepts"
              items={jdAnalysis.important_concepts}
              icon="◇"
            />
          </div>
        </section>

        {/* Continue CTA */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[0.08] via-[#11131a] to-violet-500/[0.07] p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-20 h-56 w-56 rounded-full bg-cyan-400/[0.08] blur-[80px]" />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="max-w-xl">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                NEXT STEP / PHASE 03
              </span>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                Turn your gaps into interview practice.
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/50">
                Generate role-specific questions, explain your project
                decisions, and practice answering with adaptive feedback.
              </p>
            </div>

            <button
              onClick={() => router.push("/interview")}
              className="inline-flex shrink-0 items-center justify-center gap-3 rounded-xl bg-cyan-300 px-6 py-3.5 text-sm font-semibold text-[#071014] shadow-[0_0_30px_rgba(34,211,238,0.12)] transition hover:-translate-y-0.5 hover:bg-cyan-200"
            >
              Continue to interview
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>

        <footer className="flex flex-col justify-between gap-2 border-t border-white/[0.07] py-5 text-xs text-white/30 sm:flex-row">
          <p>Interview Accelerator · Personalized interview preparation</p>
          <p>Your report is stored in this browser session.</p>
        </footer>
      </div>
    </main>
  );
}
