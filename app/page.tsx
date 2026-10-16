
"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";

type InputCardProps = {
  title: string;
  description: string;
  icon: string;
  accent: "cyan" | "violet";
  text: string;
  setText: (value: string) => void;
  loading: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

const pipeline = [
  {
    number: "01",
    title: "Input",
    description: "Add your resume and target job description.",
  },
  {
    number: "02",
    title: "Role analysis",
    description: "Extract responsibilities and skill requirements.",
  },
  {
    number: "03",
    title: "Candidate fit",
    description: "Compare your profile with the target role.",
  },
  {
    number: "04",
    title: "AI interview",
    description: "Practice with personalized questions and feedback.",
  },
];

export default function HomePage() {
  const router = useRouter();

  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");

  const [jdLoading, setJdLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [error, setError] = useState("");

  async function extractFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/parse-file", {
      method: "POST",
      body: formData,
    });

    const raw = await response.text();

    let data: { text?: string; error?: string };

    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(
        `File parser returned an invalid response (${response.status}).`
      );
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to parse the file.");
    }

    if (!data.text?.trim()) {
      throw new Error(
        "No readable text was found in this file. Try another file or paste the text manually."
      );
    }

    return data.text;
  }

  async function handleJDFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError("");
      setJdLoading(true);
      const text = await extractFile(file);
      setJdText(text);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to read the job description."
      );
    } finally {
      setJdLoading(false);
      event.target.value = "";
    }
  }

  async function handleResumeFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError("");
      setResumeLoading(true);
      const text = await extractFile(file);
      setResumeText(text);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to read the resume."
      );
    } finally {
      setResumeLoading(false);
      event.target.value = "";
    }
  }

  function startAnalysis() {
    setError("");

    const cleanJD = jdText.trim();
    const cleanResume = resumeText.trim();

    if (cleanJD.length < 50) {
      setError(
        "Please provide a job description with at least 50 characters."
      );
      return;
    }

    if (cleanResume.length < 50) {
      setError("Please provide a resume with at least 50 characters.");
      return;
    }

    try {
      sessionStorage.setItem("ai-interview-jd", cleanJD);
      sessionStorage.setItem("ai-interview-resume", cleanResume);
      router.push("/analysis");
    } catch {
      setError(
        "Could not save your inputs in this browser session. Please check your browser settings and try again."
      );
    }
  }

  const canStart =
    jdText.trim().length >= 50 &&
    resumeText.trim().length >= 50 &&
    !jdLoading &&
    !resumeLoading;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08090d] px-4 py-7 text-white sm:px-6 lg:px-8">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[440px] w-[440px] rounded-full bg-cyan-500/[0.08] blur-[135px]" />
        <div className="absolute -right-40 top-[24%] h-[480px] w-[480px] rounded-full bg-violet-500/[0.07] blur-[145px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Navigation */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08] text-lg font-bold text-cyan-300">
              A
            </div>
            <div>
              <p className="font-semibold tracking-tight">
                Interview<span className="text-cyan-300">Accelerator</span>
              </p>
              <p className="text-xs text-white/35">
                Your AI-powered interview workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs text-white/45">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Personalized preparation
          </div>
        </header>

        {/* Hero */}
        <section className="grid items-center gap-10 pb-10 pt-14 lg:grid-cols-[1.15fr_0.85fr] lg:pb-14 lg:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-xs font-medium text-cyan-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
              AI INTERVIEW ACCELERATOR
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
              Turn a job description into
              <span className="block bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 bg-clip-text pb-2 text-transparent">
                your unfair advantage.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">
              Understand what a role demands, discover how your resume
              matches, and prepare for a personalized interview built around
              your target opportunity.
            </p>

            <div className="mt-7 flex flex-wrap gap-3 text-xs text-white/50">
              <span className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2">
                ◈ Job Fit analysis
              </span>
              <span className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2">
                ⌘ Skill gap detection
              </span>
              <span className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2">
                ◎ Mock interviews
              </span>
            </div>
          </div>

          {/* Decorative workflow card */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="pointer-events-none absolute inset-10 rounded-full bg-cyan-400/[0.08] blur-[80px]" />

            <div className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-[#11131a]/90 p-5 shadow-[0_25px_100px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-5">
                <div>
                  <p className="text-xs text-white/40">YOUR WORKFLOW</p>
                  <h2 className="mt-1 text-lg font-semibold">
                    From resume to ready.
                  </h2>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.07] text-xl text-cyan-300">
                  ↗
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {pipeline.map((step, index) => (
                  <div key={step.number} className="relative flex gap-4">
                    {index !== pipeline.length - 1 && (
                      <div className="absolute bottom-0 left-[17px] top-10 w-px bg-gradient-to-b from-white/15 to-transparent" />
                    )}

                    <div
                      className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-semibold ${
                        index === 0
                          ? "border-cyan-300/25 bg-cyan-300/[0.1] text-cyan-200"
                          : "border-white/[0.08] bg-white/[0.025] text-white/40"
                      }`}
                    >
                      {step.number}
                    </div>

                    <div className="pb-5">
                      <p className="text-sm font-medium text-white/85">
                        {step.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/40">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-cyan-300/10 bg-cyan-300/[0.04] p-4">
                <p className="text-sm font-medium text-cyan-100">
                  Start with your target role
                </p>
                <p className="mt-1 text-xs leading-5 text-white/40">
                  Upload or paste your documents below to begin.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section heading */}
        <section className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              STEP 01 / YOUR INPUTS
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Let's get to know your target role.
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/40">
              Both documents are required. Upload a file or paste text directly.
            </p>
          </div>

          <p className="text-xs text-white/30">
            PDF · DOCX · TXT supported
          </p>
        </section>

        {/* Input cards */}
        <div className="grid items-stretch gap-5 lg:grid-cols-2">
          <InputCard
            title="Job description"
            description="What is the company looking for?"
            icon="▤"
            accent="cyan"
            text={jdText}
            setText={setJdText}
            loading={jdLoading}
            onFileChange={handleJDFile}
          />

          <InputCard
            title="Your resume"
            description="What skills and experience do you bring?"
            icon="▧"
            accent="violet"
            text={resumeText}
            setText={setResumeText}
            loading={resumeLoading}
            onFileChange={handleResumeFile}
          />
        </div>

        {/* Input error */}
        {error && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-sm leading-6 text-rose-200"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-rose-400/10">
              !
            </span>
            <div>
              <p className="font-medium">Let's fix that</p>
              <p className="mt-1 text-rose-200/70">{error}</p>
            </div>
          </div>
        )}

        {/* Start analysis */}
        <section className="relative mt-6 overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-r from-[#141923] via-[#11131a] to-[#15121f] p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-10 -top-24 h-52 w-52 rounded-full bg-cyan-400/[0.06] blur-[75px]" />

          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    canStart ? "bg-emerald-400" : "bg-white/20"
                  }`}
                />
                <p className="font-semibold">
                  {canStart ? "Your inputs are ready" : "Ready when you are"}
                </p>
              </div>

              <p className="mt-2 max-w-xl text-sm leading-6 text-white/40">
                {canStart
                  ? "Continue to analyze the role, compare your profile, and calculate your Job Fit."
                  : "Add at least 50 characters to both fields to unlock your personalized analysis."}
              </p>

              <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/35">
                <span>
                  JD: {jdText.trim().length.toLocaleString()} characters
                </span>
                <span className="text-white/15">•</span>
                <span>
                  Resume: {resumeText.trim().length.toLocaleString()} characters
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={startAnalysis}
              disabled={!canStart}
              className="group inline-flex shrink-0 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-300 to-sky-300 px-6 py-4 font-semibold text-[#071014] shadow-[0_0_30px_rgba(34,211,238,0.1)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
            >
              Analyze my profile
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </button>
          </div>
        </section>

        {/* Pipeline footer */}
        <section className="mt-12">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
              THE PROCESS
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              Four steps to better preparation.
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {pipeline.map((step, index) => (
              <div
                key={step.number}
                className={`rounded-2xl border p-4 transition ${
                  index === 0
                    ? "border-cyan-300/20 bg-cyan-300/[0.045]"
                    : "border-white/[0.07] bg-white/[0.02]"
                }`}
              >
                <p
                  className={`text-xs font-semibold ${
                    index === 0 ? "text-cyan-300" : "text-white/30"
                  }`}
                >
                  PHASE {step.number}
                </p>
                <h3 className="mt-3 font-medium">{step.title}</h3>
                <p className="mt-2 text-xs leading-5 text-white/40">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-white/[0.07] py-5 text-xs text-white/30 sm:flex-row">
          <p>Interview Accelerator · Prepare with purpose.</p>
          <p>Your resume and JD are kept in browser session storage.</p>
        </footer>
      </div>
    </main>
  );
}

function InputCard({
  title,
  description,
  icon,
  accent,
  text,
  setText,
  loading,
  onFileChange,
}: InputCardProps) {
  const isCyan = accent === "cyan";

  const accentStyles = isCyan
    ? {
        icon: "border-cyan-300/15 bg-cyan-300/[0.08] text-cyan-300",
        focus: "focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/[0.06]",
        button: "border-cyan-300/15 bg-cyan-300/[0.06] text-cyan-200 hover:bg-cyan-300/[0.12]",
        progress: "bg-cyan-300",
        count: "text-cyan-200",
      }
    : {
        icon: "border-violet-300/15 bg-violet-300/[0.08] text-violet-300",
        focus: "focus:border-violet-300/40 focus:ring-2 focus:ring-violet-300/[0.06]",
        button: "border-violet-300/15 bg-violet-300/[0.06] text-violet-200 hover:bg-violet-300/[0.12]",
        progress: "bg-violet-300",
        count: "text-violet-200",
      };

  const characters = text.trim().length;
  const ready = characters >= 50;

  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-white/[0.08] bg-[#11131a]/90 p-5 shadow-[0_16px_50px_rgba(0,0,0,0.14)] backdrop-blur-xl transition duration-200 hover:border-white/[0.13] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-xl ${accentStyles.icon}`}
          >
            {icon}
          </div>

          <div className="min-w-0">
            <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-white/40 sm:text-sm">
              {description}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] ${
            ready
              ? "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300"
              : "border-white/[0.08] bg-white/[0.025] text-white/35"
          }`}
        >
          {ready ? "Ready" : "Required"}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-white/70">
            Upload a document
          </p>
          <p className="mt-1 text-[11px] text-white/35">
            PDF, DOCX or TXT · Max 8 MB
          </p>
        </div>

        <label
          className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition ${accentStyles.button} ${
            loading ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {loading ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border border-current/30 border-t-current" />
              Reading file...
            </>
          ) : (
            <>＋ Choose file</>
          )}

          <input
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            className="sr-only"
            disabled={loading}
            onChange={onFileChange}
          />
        </label>
      </div>

      <div className="relative mt-4 flex-1">
        <label
          htmlFor={`input-${accent}`}
          className="mb-2 block text-xs font-medium text-white/55"
        >
          Or paste your text
        </label>

        <textarea
          id={`input-${accent}`}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={
            isCyan
              ? "Paste the full job description here...\n\nInclude responsibilities, required skills, qualifications, and experience expectations."
              : "Paste your resume here...\n\nInclude your skills, experience, projects, education, and achievements."
          }
          className={`min-h-[300px] w-full resize-y rounded-xl border border-white/[0.07] bg-[#090a0f] p-4 text-sm leading-6 text-white/80 outline-none transition placeholder:text-white/20 ${accentStyles.focus}`}
        />
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-white/35">
            {ready ? "Minimum length reached" : "Minimum 50 characters"}
          </span>
          <span className={`tabular-nums ${ready ? accentStyles.count : "text-white/35"}`}>
            {characters.toLocaleString()} chars
          </span>
        </div>

        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full transition-all duration-300 ${accentStyles.progress}`}
            style={{ width: `${Math.min(100, (characters / 50) * 100)}%` }}
          />
        </div>
      </div>
    </section>
  );
}
