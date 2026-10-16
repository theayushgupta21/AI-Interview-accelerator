
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type InterviewType = "mixed" | "technical" | "hr" | "project";
type InterviewLevel = "screening" | "competency" | "deep-dive";
type Difficulty = "easy" | "medium" | "hard";

const interviewTypes: {
  value: InterviewType;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "mixed",
    title: "Mixed interview",
    description: "Technical, HR & projects",
    icon: "◈",
  },
  {
    value: "technical",
    title: "Technical",
    description: "Concepts & problem solving",
    icon: "⌘",
  },
  {
    value: "hr",
    title: "HR & behavioral",
    description: "Communication & mindset",
    icon: "◎",
  },
  {
    value: "project",
    title: "Project deep dive",
    description: "Decisions, trade-offs & impact",
    icon: "◇",
  },
];

const levels: {
  value: InterviewLevel;
  number: string;
  title: string;
  description: string;
}[] = [
  {
    value: "screening",
    number: "01",
    title: "Screening",
    description: "Resume, motivation & role fit",
  },
  {
    value: "competency",
    number: "02",
    title: "Competency",
    description: "Technical skills, projects & problem-solving",
  },
  {
    value: "deep-dive",
    number: "03",
    title: "Deep dive",
    description: "Architecture, trade-offs & challenging follow-ups",
  },
];

const difficulties: {
  value: Difficulty;
  title: string;
  description: string;
}[] = [
  {
    value: "easy",
    title: "Easy",
    description: "Fundamentals",
  },
  {
    value: "medium",
    title: "Medium",
    description: "Practical questions",
  },
  {
    value: "hard",
    title: "Hard",
    description: "In-depth reasoning",
  },
];

const panelClass =
  "rounded-2xl border border-white/[0.08] bg-[#11131a]/90 p-5 shadow-[0_16px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:p-6";

export default function InterviewPage() {
  const router = useRouter();

  const [interviewType, setInterviewType] =
    useState<InterviewType>("mixed");
  const [difficulty, setDifficulty] =
    useState<Difficulty>("medium");
  const [questionCount, setQuestionCount] = useState("10");
  const [interviewLevel, setInterviewLevel] =
    useState<InterviewLevel>("screening");

  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const savedJD = sessionStorage.getItem("ai-interview-jd") || "";
      const savedResume =
        sessionStorage.getItem("ai-interview-resume") || "";

      setJd(savedJD);
      setResume(savedResume);

      if (!savedJD.trim() || !savedResume.trim()) {
        setError(
          "Job description or resume is missing. Please return to the input page and submit both again."
        );
      }
    } catch {
      setError("Could not load your saved inputs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  function handleStart() {
    setError("");

    if (!jd.trim() || !resume.trim()) {
      setError("Both your job description and resume are required.");
      return;
    }

    const config = {
      interviewType,
      difficulty,
      questionCount: Number(questionCount),
      interviewLevel,
    };

    try {
      sessionStorage.setItem(
        "ai-interview-config",
        JSON.stringify(config)
      );

      router.push("/interview/session");
    } catch {
      setError("Could not save interview settings. Please try again.");
    }
  }

  const selectedLevel = levels.find(
    (level) => level.value === interviewLevel
  );

  const selectedType = interviewTypes.find(
    (type) => type.value === interviewType
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090d] px-4 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-cyan-300" />
          <p className="mt-4 text-sm text-white/50">
            Loading your interview workspace...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08090d] px-4 py-7 text-white sm:px-6 lg:px-8">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-cyan-500/[0.08] blur-[130px]" />
        <div className="absolute -right-40 top-[25%] h-[460px] w-[460px] rounded-full bg-violet-500/[0.07] blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* Navigation */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08] text-lg font-bold text-cyan-300">
              A
            </div>
            <div>
              <p className="font-semibold tracking-tight">
                Interview<span className="text-cyan-300">Accelerator</span>
              </p>
              <p className="text-xs text-white/35">
                AI-powered interview preparation
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/analysis")}
            className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2.5 text-sm text-white/65 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
          >
            <span aria-hidden="true">← </span>
            Back to analysis
          </button>
        </header>

        {/* Progress */}
        <div className="mt-8 flex items-center gap-3 text-xs sm:gap-4">
          <div className="flex items-center gap-2 text-emerald-300">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/10">
              ✓
            </span>
            <span className="hidden sm:inline">Profile analysis</span>
            <span className="sm:hidden">Analysis</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-emerald-400/30 to-cyan-400/30" />
          <div className="flex items-center gap-2 text-cyan-300">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10">
              2
            </span>
            <span className="font-medium">Configure interview</span>
          </div>
          <div className="h-px flex-1 bg-white/10" />
          <div className="flex items-center gap-2 text-white/30">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10">
              3
            </span>
            <span className="hidden sm:inline">Interview session</span>
            <span className="sm:hidden">Session</span>
          </div>
        </div>

        {/* Page heading */}
        <section className="mb-8 mt-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-xs font-medium text-cyan-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
            YOUR NEXT STEP
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Your interview.
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 bg-clip-text text-transparent">
              Your rules.
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45 sm:text-base">
            Configure a personalized mock interview based on your resume
            and target role. Practice with purpose, identify weak spots,
            and get ready to explain what you know.
          </p>
        </section>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.07] p-4 text-sm leading-6 text-rose-200"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-rose-400/10">
              !
            </span>
            <div>
              <p className="font-medium">Something needs your attention</p>
              <p className="mt-1 text-rose-200/70">{error}</p>
              {(!jd.trim() || !resume.trim()) && (
                <button
                  onClick={() => router.push("/")}
                  className="mt-2 underline underline-offset-4 hover:text-white"
                >
                  Return to inputs
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
          {/* Configuration */}
          <div className="space-y-6">
            {/* Saved inputs */}
            <section className={panelClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                    STEP 01
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    Your interview context
                  </h2>
                  <p className="mt-1 text-sm text-white/40">
                    Your saved documents will guide question generation.
                  </p>
                </div>
                <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-xs text-emerald-300">
                  {jd.trim() && resume.trim() ? "✓ Ready" : "Needs input"}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/[0.08] text-lg text-cyan-300">
                      ▤
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Job description</p>
                      <p className="mt-1 text-xs text-white/35">
                        {jd.trim()
                          ? `${jd.length.toLocaleString()} characters loaded`
                          : "Not available"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className={`h-full rounded-full ${jd.trim() ? "w-full bg-cyan-300" : "w-0"}`}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-300/[0.08] text-lg text-violet-300">
                      ▧
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Your resume</p>
                      <p className="mt-1 text-xs text-white/35">
                        {resume.trim()
                          ? `${resume.length.toLocaleString()} characters loaded`
                          : "Not available"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className={`h-full rounded-full ${resume.trim() ? "w-full bg-violet-300" : "w-0"}`}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Interview level */}
            <section className={panelClass}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/[0.08] text-cyan-300">
                  01
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    Choose your interview level
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-white/40">
                    Decide how deeply the interviewer should challenge you.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {levels.map((level) => {
                  const selected = interviewLevel === level.value;

                  return (
                    <button
                      key={level.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setInterviewLevel(level.value)}
                      className={`group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition duration-200 ${
                        selected
                          ? "border-cyan-300/40 bg-cyan-300/[0.07] shadow-[0_0_24px_rgba(34,211,238,0.04)]"
                          : "border-white/[0.07] bg-black/15 hover:border-white/15 hover:bg-white/[0.025]"
                      }`}
                    >
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
                          selected
                            ? "bg-cyan-300 text-[#071014]"
                            : "border border-white/10 bg-white/[0.035] text-white/45"
                        }`}
                      >
                        {level.number}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-white">
                          {level.title}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-white/40 sm:text-sm">
                          {level.description}
                        </span>
                      </span>

                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                          selected
                            ? "border-cyan-300 bg-cyan-300 text-[#071014]"
                            : "border-white/20 text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Interview type */}
            <section className={panelClass}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-300/[0.08] text-violet-300">
                  02
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    What do you want to practice?
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-white/40">
                    Select the focus of your interview session.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {interviewTypes.map((type) => {
                  const selected = interviewType === type.value;

                  return (
                    <button
                      key={type.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setInterviewType(type.value)}
                      className={`rounded-xl border p-4 text-left transition duration-200 ${
                        selected
                          ? "border-violet-300/35 bg-violet-300/[0.07]"
                          : "border-white/[0.07] bg-black/15 hover:border-white/15 hover:bg-white/[0.025]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${
                            selected
                              ? "bg-violet-300/[0.13] text-violet-200"
                              : "bg-white/[0.04] text-white/55"
                          }`}
                        >
                          {type.icon}
                        </span>
                        <span
                          className={`h-4 w-4 rounded-full border ${
                            selected
                              ? "border-violet-300 bg-violet-300 shadow-[inset_0_0_0_3px_#11131a]"
                              : "border-white/20"
                          }`}
                        />
                      </div>
                      <p className="mt-4 font-medium">{type.title}</p>
                      <p className="mt-1 text-xs leading-5 text-white/40">
                        {type.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Difficulty and question count */}
            <section className={panelClass}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-300/[0.08] text-amber-200">
                  03
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    Set the challenge
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-white/40">
                    Choose the starting difficulty and session length.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm font-medium text-white/75">
                  Starting difficulty
                </p>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {difficulties.map((item) => {
                    const selected = difficulty === item.value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setDifficulty(item.value)}
                        className={`rounded-xl border px-2 py-4 text-center transition sm:px-4 ${
                          selected
                            ? "border-amber-300/35 bg-amber-300/[0.07]"
                            : "border-white/[0.07] bg-black/15 hover:border-white/15"
                        }`}
                      >
                        <span
                          className={`block text-sm font-semibold ${
                            selected ? "text-amber-200" : "text-white/80"
                          }`}
                        >
                          {item.title}
                        </span>
                        <span className="mt-1 block text-[10px] leading-4 text-white/40 sm:text-xs">
                          {item.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs leading-5 text-white/35">
                  Starting difficulty only. Adaptive difficulty depends on
                  how your evaluation endpoint is configured.
                </p>
              </div>

              <div className="mt-7 border-t border-white/[0.07] pt-6">
                <label
                  htmlFor="questionCount"
                  className="text-sm font-medium text-white/75"
                >
                  Number of questions
                </label>

                <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { value: "5", title: "Quick", detail: "~5 questions" },
                    { value: "10", title: "Standard", detail: "~10 questions" },
                    { value: "15", title: "Extended", detail: "~15 questions" },
                  ].map((item) => {
                    const selected = questionCount === item.value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setQuestionCount(item.value)}
                        className={`rounded-xl border p-3 text-center transition sm:p-4 ${
                          selected
                            ? "border-cyan-300/35 bg-cyan-300/[0.07]"
                            : "border-white/[0.07] bg-black/15 hover:border-white/15"
                        }`}
                      >
                        <span className="block text-xl font-semibold tabular-nums">
                          {item.value}
                        </span>
                        <span className="mt-1 block text-xs font-medium text-white/75">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-[10px] text-white/35 sm:text-xs">
                          {item.detail}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <input
                  id="questionCount"
                  type="hidden"
                  value={questionCount}
                  readOnly
                />
              </div>
            </section>
          </div>

          {/* Live summary sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-6">
            <section className="overflow-hidden rounded-2xl border border-white/[0.09] bg-[#11131a]/95 shadow-[0_16px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl">
              <div className="border-b border-white/[0.07] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  SESSION PREVIEW
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  Your game plan
                </h2>
                <p className="mt-1 text-sm text-white/40">
                  Review your setup before starting.
                </p>
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <p className="text-xs text-white/35">Interview level</p>
                  <p className="mt-1 font-medium">
                    {selectedLevel?.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/40">
                    {selectedLevel?.description}
                  </p>
                </div>

                <div className="h-px bg-white/[0.06]" />

                <div>
                  <p className="text-xs text-white/35">Interview type</p>
                  <p className="mt-1 font-medium">{selectedType?.title}</p>
                  <p className="mt-1 text-xs text-white/40">
                    {selectedType?.description}
                  </p>
                </div>

                <div className="h-px bg-white/[0.06]" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                    <p className="text-xs text-white/40">Questions</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {questionCount}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                    <p className="text-xs text-white/40">Difficulty</p>
                    <p className="mt-2 text-sm font-semibold capitalize">
                      {difficulty}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-cyan-300/10 bg-cyan-300/[0.04] p-4">
                  <p className="text-sm font-medium text-cyan-100">
                    Built around your profile
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/45">
                    Your saved resume and job description provide context
                    for personalized questions.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStart}
                  disabled={!jd.trim() || !resume.trim()}
                  className="group flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-300 to-sky-300 px-5 py-4 font-semibold text-[#071014] shadow-[0_0_30px_rgba(34,211,238,0.12)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  Start interview
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </button>

                <p className="text-center text-[11px] leading-5 text-white/30">
                  Settings are saved to this browser session.
                </p>
              </div>
            </section>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2">
                <span className="text-cyan-300">✳</span>
                <p className="text-sm font-medium">A useful reminder</p>
              </div>
              <p className="mt-2 text-xs leading-6 text-white/40">
                Explain your reasoning, use specific examples from your
                projects, and be honest about what you have not used yet.
              </p>
            </div>
          </aside>
        </div>

        <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-white/[0.07] py-5 text-xs text-white/30 sm:flex-row">
          <p>Interview Accelerator · Practice with purpose.</p>
          <p>Your inputs remain in this browser session.</p>
        </footer>
      </div>
    </main>
  );
}
