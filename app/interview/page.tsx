
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type InterviewType = "mixed" | "technical" | "hr" | "project";
type InterviewLevel = "screening" | "competency" | "deep-dive";
type Difficulty = "easy" | "medium" | "hard";

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
          "Job description or resume is missing. Please return to the analysis page and submit both again."
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

  const inputClass =
    "mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400";

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => router.push("/analysis")}
          className="mb-8 text-sm text-zinc-400 transition hover:text-white"
        >
          ← Back to Analysis
        </button>

        <p className="text-sm font-medium text-cyan-400">
          AI Interview Accelerator
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Interview Preparation
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Set up a personalized mock interview based on your job
          description and resume.
        </p>

        {loading ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-zinc-900 p-6 text-zinc-400">
            Loading your saved job description and resume...
          </div>
        ) : (
          <>
            <section className="mt-8 rounded-2xl border border-white/10 bg-zinc-900/70 p-5 sm:p-7">
              <h2 className="text-lg font-semibold">
                Your interview inputs
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-medium">Job Description</p>
                  <p className="mt-2 text-sm text-zinc-400">
                    {jd
                      ? `${jd.length.toLocaleString()} characters loaded`
                      : "Not available"}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-medium">Resume</p>
                  <p className="mt-2 text-sm text-zinc-400">
                    {resume
                      ? `${resume.length.toLocaleString()} characters loaded`
                      : "Not available"}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-white/10 bg-zinc-900/70 p-5 sm:p-7">
              <h2 className="text-lg font-semibold">
                Configure your interview
              </h2>
              
<div>
  <label htmlFor="interviewLevel" className="mb-2 block text-sm font-medium">
    Interview Level
  </label>

  <select
    id="interviewLevel"
    value={interviewLevel}
    onChange={(event) =>
      setInterviewLevel(event.target.value as InterviewLevel)
    }
    className={inputClass}
  >
    <option value="screening">
      Screening — Resume, motivation & role fit
    </option>
    <option value="competency">
      Competency — Technical skills, projects & problem-solving
    </option>
    <option value="deep-dive">
      Deep Dive — Architecture, trade-offs & challenging follow-ups
    </option>
  </select>
</div>


              <div className="mt-6">
                <label
                  htmlFor="interviewType"
                  className="text-sm font-medium text-zinc-200"
                >
                  Interview type
                </label>

                <select
                  id="interviewType"
                  value={interviewType}
                  onChange={(event) =>
                    setInterviewType(
                      event.target.value as InterviewType
                    )
                  }
                  className={inputClass}
                >
                  <option value="mixed">
                    Mixed — Technical + HR + Projects
                  </option>
                  <option value="technical">Technical</option>
                  <option value="hr">HR / Behavioural</option>
                  <option value="project">Resume & Project Deep Dive</option>
                </select>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="difficulty"
                  className="text-sm font-medium text-zinc-200"
                >
                  Difficulty
                </label>

                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(event.target.value as Difficulty)
                  }
                  className={inputClass}
                >
                  <option value="easy">Easy — Fundamentals</option>
                  <option value="medium">Medium — Practical</option>
                  <option value="hard">Hard — In-depth</option>
                </select>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="questionCount"
                  className="text-sm font-medium text-zinc-200"
                >
                  Number of questions
                </label>

                <select
                  id="questionCount"
                  value={questionCount}
                  onChange={(event) =>
                    setQuestionCount(event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="5">5 questions — Quick practice</option>
                  <option value="10">10 questions — Standard</option>
                  <option value="15">15 questions — Extended</option>
                </select>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
                >
                  {error}
                </div>
              )}

              <button
                onClick={handleStart}
                disabled={loading || !jd.trim() || !resume.trim()}
                className="mt-7 w-full rounded-xl bg-cyan-400 px-5 py-3.5 font-semibold text-zinc-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Start Interview Setup →
              </button>

              <p className="mt-3 text-center text-xs text-zinc-500">
                Your saved inputs stay in this browser session.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
