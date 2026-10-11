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
  difficulty: "easy" | "medium" | "hard";
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
  nextDifficulty: "easy" | "medium" | "hard";
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

    // Restore interview configuration
    const savedConfig = sessionStorage.getItem("ai-interview-config");

    if (savedConfig) {
      try {
        const parsed: unknown = JSON.parse(savedConfig);

        if (parsed && typeof parsed === "object") {
          const value = parsed as Record<string, unknown>;

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
        }
      } catch {
        console.warn("Saved interview configuration is invalid.");
      }
    }

    // Restore saved interview session
    const savedAnswers = sessionStorage.getItem(ANSWERS_KEY);
    const savedQuestions = sessionStorage.getItem(QUESTIONS_KEY);
    const savedEvaluations =
      sessionStorage.getItem(EVALUATIONS_KEY);

    if (savedAnswers) {
      setAnswers(JSON.parse(savedAnswers) as AnswerMap);
    }

    if (savedQuestions) {
      setQuestions(JSON.parse(savedQuestions) as SessionQuestion[]);
    }

    if (savedEvaluations) {
      setEvaluations(JSON.parse(savedEvaluations) as EvaluationMap);
    }
  } catch {
    setError("Could not restore the saved interview session.");
  } finally {
    setLoading(false);
    setLoaded(true);
  }
}, []);


  useEffect(() => {
    if (!loaded) return;

    sessionStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
    sessionStorage.setItem(
      QUESTIONS_KEY,
      JSON.stringify(questions)
    );
    sessionStorage.setItem(
      EVALUATIONS_KEY,
      JSON.stringify(evaluations)
    );
  }, [answers, questions, evaluations, loaded]);

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

      const result =
        (await response.json()) as GenerationResponse;

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
      setError("Please enter your answer before submitting.");
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

      const result =
        (await response.json()) as EvaluationResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.error ?? "Could not evaluate your answer."
        );
      }

      const evaluation = result.data;

      setEvaluations((previous) => ({
        ...previous,
        [question.id]: evaluation,
      }));

      // Insert the adaptive follow-up directly after this question.
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
        // Prevent duplicate follow-ups for the same question.
        if (previous.some((item) => item.id === followUp.id)) {
          return previous;
        }

        const updated = [...previous];
        updated.splice(currentIndex + 1, 0, followUp);
        return updated;
      });

      // Move to the new follow-up after the state update.
      setCurrentIndex((index) => index + 1);
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
    setFinished(true);
    sessionStorage.setItem("ai-interview-finished", "true");
  };

  const startNewSession = () => {
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
      <main className="mx-auto max-w-4xl p-6">
        Loading your interview session...
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
      <main className="mx-auto max-w-4xl space-y-6 p-6">
        <h1 className="text-3xl font-bold">Interview Completed</h1>

        <p className="text-gray-600">
          Review your practice results below. These scores reflect
          the AI's assessment of submitted answers, not a guaranteed
          prediction of hiring outcomes.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border p-5">
            <p className="text-sm text-gray-500">Questions</p>
            <p className="text-2xl font-bold">{questions.length}</p>
          </div>

          <div className="rounded-xl border p-5">
            <p className="text-sm text-gray-500">Answers submitted</p>
            <p className="text-2xl font-bold">{answeredCount}</p>
          </div>

          <div className="rounded-xl border p-5">
            <p className="text-sm text-gray-500">Average AI score</p>
            <p className="text-2xl font-bold">
              {evaluated.length > 0 ? `${averageScore}/100` : "N/A"}
            </p>
          </div>
        </div>

        <h2 className="text-xl font-semibold">Answer review</h2>

        <div className="space-y-4">
          {questions.map((question, index) => {
            const evaluation = evaluations[question.id];

            return (
              <article
                key={question.id}
                className="space-y-3 rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">
                    {index + 1}. {question.question}
                  </h3>

                  {evaluation && (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
                      {evaluation.score}/100
                    </span>
                  )}
                </div>

                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {answers[question.id] || "No answer submitted."}
                </p>

                {evaluation && (
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Feedback:</strong> {evaluation.feedback}
                    </p>

                    {evaluation.strengths.length > 0 && (
                      <div>
                        <strong>Strengths</strong>
                        <ul className="list-disc pl-5">
                          {evaluation.strengths.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {evaluation.improvements.length > 0 && (
                      <div>
                        <strong>Areas to improve</strong>
                        <ul className="list-disc pl-5">
                          {evaluation.improvements.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {evaluation.missed_points.length > 0 && (
                      <div>
                        <strong>Missed points</strong>
                        <ul className="list-disc pl-5">
                          {evaluation.missed_points.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={startNewSession}
            className="rounded-lg bg-black px-5 py-3 text-white"
          >
            Start new practice session
          </button>

          <Link
            href="/analysis"
            className="rounded-lg border px-5 py-3"
          >
            Back to analysis
          </Link>
        </div>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="mx-auto max-w-3xl space-y-5 p-6">
        <h1 className="text-3xl font-bold">Interview Practice</h1>

        <p className="text-gray-600">
          Generate questions from your job description and resume,
          then answer them one at a time.
        </p>

        {error && (
          <p role="alert" className="rounded-lg border border-red-300 p-3 text-red-700">
            {error}
          </p>
        )}

        <button
          onClick={generateQuestions}
          disabled={generating}
          className="rounded-lg bg-black px-5 py-3 text-white disabled:opacity-50"
        >
          {generating ? "Generating questions..." : "Generate interview"}
        </button>

        <div>
          <Link href="/analysis" className="underline">
            Back to analysis
          </Link>
        </div>
      </main>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentEvaluation = evaluations[currentQuestion.id];
  const answeredCount = questions.filter(
    (question) => (answers[question.id] ?? "").trim().length > 0
  ).length;
  const evaluatedCount = Object.keys(evaluations).length;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{roleTitle}</p>
          <h1 className="text-3xl font-bold">Interview Practice</h1>
        </div>

        <button
          onClick={finishInterview}
          className="rounded-lg border px-4 py-2"
        >
          Finish interview
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <button
            key={question.id}
            onClick={() => {
              setCurrentIndex(index);
              setError("");
            }}
            aria-label={`Go to question ${index + 1}`}
            aria-current={index === currentIndex ? "step" : undefined}
            className={`h-10 min-w-10 rounded-lg border px-3 ${
              index === currentIndex
                ? "border-blue-600 bg-blue-600 text-white"
                : evaluations[question.id]
                  ? "border-green-500"
                  : ""
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <section className="space-y-5 rounded-2xl border p-5 sm:p-7">
        <div className="flex flex-wrap gap-2 text-xs font-medium uppercase">
          <span className="rounded-full bg-gray-100 px-3 py-1">
            {currentQuestion.category}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1">
            {currentQuestion.difficulty}
          </span>
          {currentQuestion.isFollowUp && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800">
              Adaptive follow-up
            </span>
          )}
        </div>

        <h2 className="text-xl font-semibold sm:text-2xl">
          {currentQuestion.question}
        </h2>
        
<button
  type="button"
  onClick={() => speakText(currentQuestion.question)}
  className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
>
  🔊 Read Question
</button>

<button
  type="button"
  onClick={stopSpeaking}
  className="ml-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
>
  ⏹ Stop Voice
</button>


        {currentQuestion.isFollowUp && currentQuestion.followUpReason && (
          <p className="text-sm text-gray-600">
            <strong>Why this follow-up?</strong>{" "}
            {currentQuestion.followUpReason}
          </p>
        )}

        {!currentQuestion.isFollowUp && (
          <p className="text-sm text-gray-600">
            <strong>What this tests:</strong>{" "}
            {currentQuestion.why_asked}
          </p>
        )}

        <div>
          <label
            htmlFor="candidate-answer"
            className="mb-2 block font-medium"
          >
            Your answer
          </label>

          <textarea
            id="candidate-answer"
            value={answers[currentQuestion.id] ?? ""}
            onChange={(event) => {
              setAnswers((previous) => ({
                ...previous,
                [currentQuestion.id]: event.target.value,
              }));
            }}
            disabled={Boolean(currentEvaluation)}
            maxLength={5000}
            rows={7}
            placeholder="Explain your approach, reasoning, and examples..."
            className="w-full rounded-xl border p-4 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />

          <p className="mt-1 text-right text-xs text-gray-500">
            {(answers[currentQuestion.id] ?? "").length}/5000
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-red-300 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {!currentEvaluation ? (
          <button
            onClick={submitAnswer}
            disabled={evaluating || generating}
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white disabled:opacity-50"
          >
            {evaluating ? "Evaluating your answer..." : "Submit answer & get feedback"}
          </button>
        ) : (
          <div className="space-y-4 rounded-xl bg-gray-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">AI feedback</h3>
              <span className="rounded-full border px-3 py-1 font-semibold">
                {currentEvaluation.score}/100
              </span>
            </div>

            <p>{currentEvaluation.feedback}</p>

            {currentEvaluation.strengths.length > 0 && (
              <div>
                <h4 className="font-semibold">Strengths</h4>
                <ul className="list-disc pl-5">
                  {currentEvaluation.strengths.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {currentEvaluation.improvements.length > 0 && (
              <div>
                <h4 className="font-semibold">Areas to improve</h4>
                <ul className="list-disc pl-5">
                  {currentEvaluation.improvements.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {currentEvaluation.missed_points.length > 0 && (
              <div>
                <h4 className="font-semibold">Missed points</h4>
                <ul className="list-disc pl-5">
                  {currentEvaluation.missed_points.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-sm text-gray-600">
              Next follow-up difficulty:{" "}
              <strong>{currentEvaluation.nextDifficulty}</strong>
            </p>
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => {
            setCurrentIndex((index) => Math.max(0, index - 1));
            setError("");
          }}
          disabled={currentIndex === 0 || evaluating}
          className="rounded-lg border px-4 py-2 disabled:opacity-40"
        >
          Previous
        </button>

        <p className="text-sm text-gray-500">
          {answeredCount} answered · {evaluatedCount} evaluated
        </p>

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
          }}
          disabled={evaluating}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-40"
        >
          {currentIndex === questions.length - 1
            ? "Finish interview"
            : "Next question"}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Your answers and evaluations are saved in this browser session.
      </p>
    </main>
  );
}
