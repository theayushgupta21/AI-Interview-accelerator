
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { speakText, stopSpeaking } from "@/lib/speech";

type InterviewType = "mixed" | "technical" | "hr" | "project";
type Difficulty = "easy" | "medium" | "hard";

type InterviewConfig = {
  interviewType: InterviewType;
  difficulty: Difficulty;
  questionCount: 5 | 10 | 15;
};

type InterviewQuestion = {
  category: "technical" | "project" | "behavioral";
  difficulty: Difficulty;
  question: string;
  why_asked: string;
  evaluation_points: string[];
};

type SessionQuestion = InterviewQuestion & {
  id: string;
  isFollowUp?: boolean;
  followUpReason?: string;
};

type InterviewData = {
  role_title: string;
  questions: InterviewQuestion[];
};

type AnswerEvaluation = {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  missed_points: string[];
  follow_up_question: string;
  follow_up_reason: string;
  nextDifficulty: Difficulty;
};

type EvaluationResponse = {
  success: boolean;
  data?: AnswerEvaluation;
  error?: string;
};

type GenerationResponse = {
  success: boolean;
  data?: InterviewData;
  error?: string;
};

type AnswerMap = Record<string, string>;
type EvaluationMap = Record<string, AnswerEvaluation>;

const ANSWERS_KEY = "ai-interview-answers";
const QUESTIONS_KEY = "ai-interview-session-questions";
const EVALUATIONS_KEY = "ai-interview-evaluations";

const difficultyColor: Record<Difficulty, string> = {
  easy: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  medium: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  hard: "border-rose-400/20 bg-rose-400/10 text-rose-300",
};

const categoryLabel: Record<InterviewQuestion["category"], string> = {
  technical: "Technical",
  project: "Project deep dive",
  behavioral: "Behavioral",
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
      className={`rounded-2xl border border-white/[0.09] bg-[#11131a] ${className}`}
    >
      {children}
    </section>
  );
}

function SectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
      {children}
    </p>
  );
}

function EmptyList({ text }: { text: string }) {
  return <p className="text-sm text-white/35">{text}</p>;
}

function FeedbackList({
  title,
  items,
  color,
  icon,
}: {
  title: string;
  items: string[];
  color: "emerald" | "amber" | "rose";
  icon: string;
}) {
  const colors = {
    emerald: "text-emerald-300 bg-emerald-300/10",
    amber: "text-amber-300 bg-amber-300/10",
    rose: "text-rose-300 bg-rose-300/10",
  };

  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${colors[color]}`}
        >
          {icon}
        </span>
        <h4 className="text-sm font-semibold text-white/90">{title}</h4>
      </div>

      {items.length === 0 ? (
        <EmptyList text="Nothing specific identified." />
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex gap-2 text-sm leading-6 text-white/65"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function InterviewSessionPage() {
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");

  const [config, setConfig] = useState<InterviewConfig>({
    interviewType: "mixed",
    difficulty: "medium",
    questionCount: 10,
  });

  const [questions, setQuestions] = useState<SessionQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [evaluations, setEvaluations] = useState<EvaluationMap>({});
  const [roleTitle, setRoleTitle] = useState("Interview Practice");
  const [currentIndex, setCurrentIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    try {
      const jd = sessionStorage.getItem("ai-interview-jd") ?? "";
      const resume =
        sessionStorage.getItem("ai-interview-resume") ?? "";

      setJdText(jd);
      setResumeText(resume);

      const savedConfig = sessionStorage.getItem("ai-interview-config");

      if (savedConfig) {
        try {
          const value = JSON.parse(savedConfig) as Record<string, unknown>;

          if (
            ["mixed", "technical", "hr", "project"].includes(
              String(value.interviewType)
            ) &&
            ["easy", "medium", "hard"].includes(
              String(value.difficulty)
            ) &&
            [5, 10, 15].includes(Number(value.questionCount))
          ) {
            setConfig({
              interviewType: value.interviewType as InterviewType,
              difficulty: value.difficulty as Difficulty,
              questionCount: Number(value.questionCount) as 5 | 10 | 15,
            });
          }
        } catch {
          console.warn("Invalid saved interview configuration.");
        }
      }

      const savedAnswers = sessionStorage.getItem(ANSWERS_KEY);
      const savedQuestions = sessionStorage.getItem(QUESTIONS_KEY);
      const savedEvaluations = sessionStorage.getItem(EVALUATIONS_KEY);

      if (savedAnswers) {
        setAnswers(JSON.parse(savedAnswers) as AnswerMap);
      }

      if (savedQuestions) {
        setQuestions(JSON.parse(savedQuestions) as SessionQuestion[]);
      }

      if (savedEvaluations) {
        setEvaluations(JSON.parse(savedEvaluations) as EvaluationMap);
      }

      setFinished(
        sessionStorage.getItem("ai-interview-finished") === "true"
      );
    } catch {
      setError("Could not restore the saved interview session.");
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      sessionStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
      sessionStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
      sessionStorage.setItem(
        EVALUATIONS_KEY,
        JSON.stringify(evaluations)
      );
    } catch {
      setError("Browser storage is full. Some progress may not be saved.");
    }
  }, [answers, questions, evaluations, loaded]);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const generateQuestions = useCallback(async () => {
    if (jdText.trim().length < 50 || resumeText.trim().length < 50) {
      setError(
        "Your job description and resume must each contain at least 50 characters."
      );
      return;
    }

    setGenerating(true);
    setError("");
    setFinished(false);
    setCurrentIndex(0);
    setQuestions([]);
    setAnswers({});
    setEvaluations({});

    sessionStorage.removeItem(ANSWERS_KEY);
    sessionStorage.removeItem(QUESTIONS_KEY);
    sessionStorage.removeItem(EVALUATIONS_KEY);
    sessionStorage.removeItem("ai-interview-finished");

    try {
      const response = await fetch("/api/generate-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jdText,
          resumeText,
          interviewType: config.interviewType,
          difficulty: config.difficulty,
          questionCount: config.questionCount,
        }),
      });

      const result = (await response.json()) as GenerationResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.error ?? "Could not generate interview questions."
        );
      }

      const initialQuestions: SessionQuestion[] =
        result.data.questions.map((question, index) => ({
          ...question,
          id: `initial-${index}-${Date.now()}`,
        }));

      if (initialQuestions.length === 0) {
        throw new Error("No questions were generated. Please try again.");
      }

      setRoleTitle(result.data.role_title);
      setQuestions(initialQuestions);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating questions."
      );
    } finally {
      setGenerating(false);
    }
  }, [jdText, resumeText, config]);

  const submitAnswer = async () => {
    const question = questions[currentIndex];
    if (!question || evaluating) return;

    const answer = (answers[question.id] ?? "").trim();

    if (!answer) {
      setError("Write your answer before submitting.");
      return;
    }

    if (evaluations[question.id]) {
      setError("This answer has already been evaluated.");
      return;
    }

    setEvaluating(true);
    setError("");

    try {
      const response = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleTitle,
          question: question.question,
          answer,
          evaluationPoints: question.evaluation_points,
        }),
      });

      const result = (await response.json()) as EvaluationResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error ?? "Could not evaluate your answer.");
      }

      const evaluation = result.data;

      setEvaluations((previous) => ({
        ...previous,
        [question.id]: evaluation,
      }));

      // Create a follow-up only when the model returns a usable question.
      if (evaluation.follow_up_question?.trim()) {
        const followUp: SessionQuestion = {
          id: `follow-up-${question.id}`,
          category: question.category,
          difficulty: evaluation.nextDifficulty,
          question: evaluation.follow_up_question,
          why_asked: evaluation.follow_up_reason,
          evaluation_points: question.evaluation_points,
          isFollowUp: true,
          followUpReason: evaluation.follow_up_reason,
        };

        setQuestions((previous) => {
          if (previous.some((item) => item.id === followUp.id)) {
            return previous;
          }

          const updated = [...previous];
          updated.splice(currentIndex + 1, 0, followUp);
          return updated;
        });

        setCurrentIndex((index) => index + 1);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Evaluation failed. Please try again."
      );
    } finally {
      setEvaluating(false);
    }
  };

  const finishInterview = () => {
    stopSpeaking();
    setFinished(true);
    sessionStorage.setItem("ai-interview-finished", "true");
  };

  const startNewSession = () => {
    stopSpeaking();
    setQuestions([]);
    setAnswers({});
    setEvaluations({});
    setCurrentIndex(0);
    setFinished(false);
    setError("");

    sessionStorage.removeItem(ANSWERS_KEY);
    sessionStorage.removeItem(QUESTIONS_KEY);
    sessionStorage.removeItem(EVALUATIONS_KEY);
    sessionStorage.removeItem("ai-interview-finished");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090a0f] px-5 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
          <p className="text-sm text-white/60">Restoring your workspace...</p>
        </div>
      </main>
    );
  }

  if (finished) {
    const evaluated = Object.values(evaluations);
    const averageScore =
      evaluated.length > 0
        ? Math.round(
            evaluated.reduce((sum, item) => sum + item.score, 0) /
              evaluated.length
          )
        : 0;

    const answeredCount = questions.filter(
      (question) => (answers[question.id] ?? "").trim().length > 0
    ).length;

    return (
      <main className="min-h-screen bg-[#090a0f] px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-5xl">
          <header className="mb-8">
            <Link
              href="/analysis"
              className="text-sm text-cyan-300 transition hover:text-cyan-200"
            >
              ← Back to analysis
            </Link>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Session complete
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Interview debrief<span className="text-cyan-300">.</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">
              Review your practice performance, strengths, and areas to
              improve. This AI assessment is not a prediction of hiring
              outcomes.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "Questions",
                value: questions.length,
                note: "Including follow-ups",
              },
              {
                label: "Answers submitted",
                value: answeredCount,
                note: "Your responses",
              },
              {
                label: "Average AI score",
                value: evaluated.length ? `${averageScore}/100` : "N/A",
                note: `${evaluated.length} evaluated`,
              },
            ].map((stat) => (
              <Panel key={stat.label} className="p-5">
                <SectionLabel>{stat.label}</SectionLabel>
                <p className="mt-4 text-3xl font-semibold">{stat.value}</p>
                <p className="mt-2 text-xs text-white/40">{stat.note}</p>
              </Panel>
            ))}
          </div>

          <div className="mt-8">
            <SectionLabel>Answer review</SectionLabel>
            <div className="mt-4 space-y-4">
              {questions.map((question, index) => {
                const evaluation = evaluations[question.id];

                return (
                  <Panel key={question.id} className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-xs text-cyan-300">
                          QUESTION {index + 1}
                        </p>
                        <h3 className="mt-2 font-medium leading-7">
                          {question.question}
                        </h3>
                      </div>
                      {evaluation && (
                        <span className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-cyan-200">
                          {evaluation.score}/100
                        </span>
                      )}
                    </div>

                    <div className="mt-4 rounded-xl bg-black/20 p-4">
                      <SectionLabel>Your answer</SectionLabel>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/65">
                        {answers[question.id] || "No answer submitted."}
                      </p>
                    </div>

                    {evaluation && (
                      <div className="mt-4 space-y-3">
                        <p className="text-sm leading-6 text-white/70">
                          {evaluation.feedback}
                        </p>
                        <FeedbackList
                          title="Strengths"
                          items={evaluation.strengths}
                          color="emerald"
                          icon="✓"
                        />
                        <FeedbackList
                          title="Areas to improve"
                          items={evaluation.improvements}
                          color="amber"
                          icon="↗"
                        />
                        <FeedbackList
                          title="Missed concepts"
                          items={evaluation.missed_points}
                          color="rose"
                          icon="!"
                        />
                      </div>
                    )}
                  </Panel>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={startNewSession}
              className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-[#071015] transition hover:bg-cyan-200"
            >
              Start new practice
            </button>
            <Link
              href="/analysis"
              className="rounded-xl border border-white/10 px-5 py-3 text-sm text-white/75 transition hover:bg-white/5"
            >
              Back to analysis
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#090a0f] px-4 py-8 text-white sm:px-6 sm:py-12">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/[0.08] blur-3xl" />

        <div className="relative mx-auto max-w-4xl">
          <Link
            href="/analysis"
            className="text-sm text-white/50 transition hover:text-cyan-300"
          >
            ← Back to candidate analysis
          </Link>

          <div className="mt-12 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-2 text-xs text-cyan-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              AI INTERVIEW WORKSPACE
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
              Your next interview.
              <span className="block text-white/40">Your practice ground.</span>
            </h1>
            <p className="mt-5 text-sm leading-7 text-white/55 sm:text-base">
              Generate personalized questions from your job description and
              resume. Answer at your own pace and get actionable feedback on
              every response.
            </p>
          </div>

          <Panel className="mt-10 p-5 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <SectionLabel>Session setup</SectionLabel>
                <h2 className="mt-2 text-xl font-semibold">
                  Configure your interview
                </h2>
              </div>
              <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/50">
                01 / 02
              </span>
            </div>

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/75">
                  Interview type
                </span>
                <select
                  value={config.interviewType}
                  onChange={(event) =>
                    setConfig((previous) => ({
                      ...previous,
                      interviewType: event.target.value as InterviewType,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#171922] px-4 py-3 text-sm outline-none focus:border-cyan-300/50"
                >
                  <option value="mixed">Mixed interview</option>
                  <option value="technical">Technical</option>
                  <option value="project">Project deep dive</option>
                  <option value="hr">HR / Behavioral</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/75">
                  Starting difficulty
                </span>
                <select
                  value={config.difficulty}
                  onChange={(event) =>
                    setConfig((previous) => ({
                      ...previous,
                      difficulty: event.target.value as Difficulty,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#171922] px-4 py-3 text-sm outline-none focus:border-cyan-300/50"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-white/75">
                  Initial question count
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {([5, 10, 15] as const).map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() =>
                        setConfig((previous) => ({
                          ...previous,
                          questionCount: count,
                        }))
                      }
                      className={`rounded-xl border px-4 py-4 text-sm transition ${
                        config.questionCount === count
                          ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-200"
                          : "border-white/10 bg-black/10 text-white/55 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="block text-xl font-semibold">
                        {count}
                      </span>
                      <span className="mt-1 block text-xs opacity-70">
                        questions
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs leading-5 text-white/35">
                  Adaptive follow-up questions may increase the total.
                </p>
              </label>
            </div>

            <div className="mt-7 rounded-xl border border-white/[0.07] bg-black/20 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-300/10 text-lg text-violet-200">
                  ✦
                </span>
                <div>
                  <p className="text-sm font-medium">Personalized evaluation</p>
                  <p className="mt-1 text-xs leading-5 text-white/45">
                    Technical accuracy, missed concepts, strengths, and
                    actionable improvements.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-sm text-rose-200"
              >
                {error}
              </p>
            )}

            <button
              onClick={generateQuestions}
              disabled={generating}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-cyan-300 px-5 py-4 text-sm font-semibold text-[#071015] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                  Building your interview...
                </>
              ) : (
                <>Generate personalized interview <span>→</span></>
              )}
            </button>
            <p className="mt-3 text-center text-xs text-white/30">
              Uses your saved job description and resume
            </p>
          </Panel>
        </div>
      </main>
    );
  }

  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return (
      <main className="min-h-screen bg-[#090a0f] p-8 text-white">
        <p className="text-white/70">Could not find the current question.</p>
        <button
          onClick={() => setCurrentIndex(0)}
          className="mt-4 rounded-lg bg-cyan-300 px-4 py-2 text-black"
        >
          Return to first question
        </button>
      </main>
    );
  }

  const currentEvaluation = evaluations[currentQuestion.id];
  const answeredCount = questions.filter(
    (question) => (answers[question.id] ?? "").trim().length > 0
  ).length;
  const evaluatedCount = Object.keys(evaluations).length;
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answer = answers[currentQuestion.id] ?? "";
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  return (
    <main className="min-h-screen bg-[#090a0f] text-white">
      <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#090a0f]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 font-semibold text-cyan-200">
              AI
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                Interview Accelerator
              </p>
              <p className="truncate text-xs text-white/40">{roleTitle}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-2 text-xs text-emerald-200 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Practice mode
            </span>
            <button
              onClick={finishInterview}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/65 transition hover:bg-white/[0.06] sm:px-4 sm:text-sm"
            >
              Finish session
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:py-8">
        <aside className="space-y-4">
          <Panel className="p-5">
            <SectionLabel>Session progress</SectionLabel>
            <div className="mt-4 flex items-end justify-between">
              <p className="text-3xl font-semibold">
                {String(currentIndex + 1).padStart(2, "0")}
                <span className="text-base font-normal text-white/35">
                  {" "}
                  / {String(questions.length).padStart(2, "0")}
                </span>
              </p>
              <span className="text-sm text-cyan-200">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/[0.035] p-3">
                <p className="text-xl font-semibold">{answeredCount}</p>
                <p className="mt-1 text-xs text-white/40">Answered</p>
              </div>
              <div className="rounded-xl bg-white/[0.035] p-3">
                <p className="text-xl font-semibold">{evaluatedCount}</p>
                <p className="mt-1 text-xs text-white/40">Evaluated</p>
              </div>
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center justify-between px-1">
              <SectionLabel>Question navigator</SectionLabel>
              <span className="text-xs text-white/35">{questions.length}</span>
            </div>
            <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-4">
              {questions.map((question, index) => {
                const active = index === currentIndex;
                const completed = Boolean(evaluations[question.id]);

                return (
                  <button
                    key={question.id}
                    onClick={() => {
                      setCurrentIndex(index);
                      setError("");
                      stopSpeaking();
                    }}
                    aria-label={`Go to question ${index + 1}`}
                    aria-current={active ? "step" : undefined}
                    className={`relative flex aspect-square items-center justify-center rounded-lg border text-xs font-medium transition ${
                      active
                        ? "border-cyan-300/60 bg-cyan-300 text-[#071015]"
                        : completed
                          ? "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-200"
                          : "border-white/[0.08] bg-white/[0.025] text-white/50 hover:bg-white/[0.07]"
                    }`}
                  >
                    {index + 1}
                    {question.isFollowUp && (
                      <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-violet-300" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-white/40">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-cyan-300" /> Current
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-emerald-300" /> Evaluated
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-violet-300" /> Follow-up
              </span>
            </div>
          </Panel>

          <Panel className="hidden p-4 lg:block">
            <SectionLabel>Interview settings</SectionLabel>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-white/45">Type</span>
                <span className="capitalize text-white/80">
                  {config.interviewType}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-white/45">Difficulty</span>
                <span className="capitalize text-white/80">
                  {config.difficulty}
                </span>
              </div>
            </div>
            <p className="mt-4 border-t border-white/[0.07] pt-3 text-xs leading-5 text-white/35">
              Your answers and evaluations are saved in this browser session.
            </p>
          </Panel>
        </aside>

        <div className="min-w-0 space-y-5">
          <Panel className="overflow-hidden">
            <div className="border-b border-white/[0.07] px-5 py-4 sm:px-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/65">
                  {categoryLabel[currentQuestion.category]}
                </span>
                <span
                  className={`rounded-lg border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${difficultyColor[currentQuestion.difficulty]}`}
                >
                  {currentQuestion.difficulty}
                </span>
                {currentQuestion.isFollowUp && (
                  <span className="rounded-lg border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-200">
                    Adaptive follow-up
                  </span>
                )}
                <span className="ml-auto hidden text-xs text-white/30 sm:block">
                  Question {currentIndex + 1}
                </span>
              </div>

              <SectionLabel>
                {currentQuestion.isFollowUp
                  ? "Let's explore your reasoning"
                  : "Interview question"}
              </SectionLabel>

              <h1 className="mt-4 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl sm:leading-snug">
                {currentQuestion.question}
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-white/50">
                <span className="font-medium text-white/75">
                  {currentQuestion.isFollowUp ? "Follow-up context: " : "What this tests: "}
                </span>
                {currentQuestion.isFollowUp
                  ? currentQuestion.followUpReason || currentQuestion.why_asked
                  : currentQuestion.why_asked}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => speakText(currentQuestion.question)}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65 transition hover:bg-white/[0.06]"
                >
                  <span aria-hidden="true">🔊</span> Read question
                </button>
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65 transition hover:bg-white/[0.06]"
                >
                  <span aria-hidden="true">⏹</span> Stop voice
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="mb-3 flex items-center justify-between gap-3">
                <label
                  htmlFor="candidate-answer"
                  className="text-sm font-semibold text-white/85"
                >
                  Your response
                </label>
                <span className="text-xs text-white/35">
                  {wordCount} words
                </span>
              </div>

              <textarea
                id="candidate-answer"
                value={answer}
                onChange={(event) =>
                  setAnswers((previous) => ({
                    ...previous,
                    [currentQuestion.id]: event.target.value,
                  }))
                }
                disabled={Boolean(currentEvaluation) || evaluating}
                maxLength={5000}
                rows={9}
                placeholder="Walk through your approach. Explain why you chose it, the trade-offs you considered, and any examples from your projects..."
                className="w-full resize-y rounded-xl border border-white/10 bg-[#0b0d13] p-4 text-sm leading-7 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/[0.06] disabled:opacity-65 sm:p-5"
              />

              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-white/30">
                <span>Be specific. Explain your reasoning.</span>
                <span>{answer.length}/5000</span>
              </div>

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-sm leading-6 text-rose-200"
                >
                  {error}
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-5">
                <button
                  onClick={() => {
                    setCurrentIndex((index) => Math.max(0, index - 1));
                    setError("");
                    stopSpeaking();
                  }}
                  disabled={currentIndex === 0 || evaluating}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/65 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ← Previous
                </button>

                {!currentEvaluation ? (
                  <button
                    onClick={submitAnswer}
                    disabled={evaluating || generating || !answer.trim()}
                    className="flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-[#071015] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {evaluating ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                        Evaluating...
                      </>
                    ) : (
                      <>Evaluate answer <span>→</span></>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (currentIndex === questions.length - 1) {
                        finishInterview();
                      } else {
                        setCurrentIndex((index) =>
                          Math.min(questions.length - 1, index + 1)
                        );
                      }
                      setError("");
                      stopSpeaking();
                    }}
                    disabled={evaluating}
                    className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-[#071015] transition hover:bg-cyan-200"
                  >
                    {currentIndex === questions.length - 1
                      ? "View interview debrief →"
                      : "Next question →"}
                  </button>
                )}
              </div>
            </div>
          </Panel>

          {currentEvaluation && (
            <Panel className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] p-5 sm:p-6">
                <div>
                  <SectionLabel>AI-powered assessment</SectionLabel>
                  <h2 className="mt-2 text-xl font-semibold">
                    Your answer breakdown
                  </h2>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07] px-4 py-3">
                  <span className="text-3xl font-semibold text-cyan-200">
                    {currentEvaluation.score}
                  </span>
                  <span className="text-xs leading-5 text-white/45">
                    / 100
                    <br />
                    AI score
                  </span>
                </div>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div>
                  <SectionLabel>Overall feedback</SectionLabel>
                  <p className="mt-3 text-sm leading-7 text-white/70">
                    {currentEvaluation.feedback}
                  </p>
                </div>

                <div className="grid gap-3 xl:grid-cols-3">
                  <FeedbackList
                    title="What went well"
                    items={currentEvaluation.strengths}
                    color="emerald"
                    icon="✓"
                  />
                  <FeedbackList
                    title="Improve next time"
                    items={currentEvaluation.improvements}
                    color="amber"
                    icon="↗"
                  />
                  <FeedbackList
                    title="Missed concepts"
                    items={currentEvaluation.missed_points}
                    color="rose"
                    icon="!"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-300/15 bg-violet-300/[0.05] p-4">
                  <div>
                    <p className="text-sm font-medium text-violet-100">
                      Adaptive interview
                    </p>
                    <p className="mt-1 text-xs leading-5 text-white/45">
                      Next follow-up difficulty:{" "}
                      <span className="capitalize text-violet-200">
                        {currentEvaluation.nextDifficulty}
                      </span>
                    </p>
                  </div>
                  <span className="rounded-lg border border-violet-300/20 px-3 py-2 text-xs text-violet-200">
                    Feedback saved
                  </span>
                </div>
              </div>
            </Panel>
          )}

          <footer className="flex flex-wrap items-center justify-between gap-3 px-1 pb-5 text-xs text-white/30">
            <span>Your progress is saved in this browser session.</span>
            <Link
              href="/analysis"
              className="transition hover:text-cyan-200"
            >
              Review job-fit analysis ↗
            </Link>
          </footer>
        </div>
      </div>
    </main>
  );
}
