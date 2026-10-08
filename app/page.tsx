"use client";

import {
  ChangeEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const [jdText, setJdText] =
    useState("");

  const [resumeText, setResumeText] =
    useState("");

  const [jdLoading, setJdLoading] =
    useState(false);

  const [resumeLoading, setResumeLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function extractFile(
    file: File
  ): Promise<string> {
    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch(
      "/api/parse-file",
      {
        method: "POST",
        body: formData,
      }
    );

    const raw =
      await response.text();

    let data: {
      text?: string;
      error?: string;
    };

    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(
        `File parser returned an invalid response (${response.status}).`
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Failed to parse the file."
      );
    }

    return data.text || "";
  }

  async function handleJDFile(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setError("");
      setJdLoading(true);

      const text =
        await extractFile(file);

      setJdText(text);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to read the JD."
      );
    } finally {
      setJdLoading(false);
    }
  }

  async function handleResumeFile(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setError("");
      setResumeLoading(true);

      const text =
        await extractFile(file);

      setResumeText(text);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to read the resume."
      );
    } finally {
      setResumeLoading(false);
    }
  }

  function startAnalysis() {
    setError("");

    const cleanJD =
      jdText.trim();

    const cleanResume =
      resumeText.trim();

    if (cleanJD.length < 50) {
      setError(
        "Please provide a Job Description with at least 50 characters."
      );
      return;
    }

    if (cleanResume.length < 50) {
      setError(
        "Please provide a Resume with at least 50 characters."
      );
      return;
    }

    /*
     * sessionStorage keeps the data local to the
     * browser session. No resume/JD database is
     * required for this phase.
     */
    sessionStorage.setItem(
      "ai-interview-jd",
      cleanJD
    );

    sessionStorage.setItem(
      "ai-interview-resume",
      cleanResume
    );

    router.push("/analysis");
  }

  return (
    <main className="min-h-screen bg-[#09090b] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}

        <header className="mb-10">
          <div className="mb-4 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-xs text-cyan-300">
            AI Interview Accelerator
          </div>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Turn a job description
            into a personalized
            interview.
          </h1>

          <p className="mt-5 max-w-2xl text-white/50">
            Add the target JD and your
            resume. We'll extract the
            role requirements, compare
            your profile, and calculate
            your Job Fit before the
            interview begins.
          </p>
        </header>

        {/* Inputs */}

        <div className="grid gap-6 lg:grid-cols-2">
          <InputCard
            title="Job Description"
            description="Paste the JD or upload a PDF, DOCX, or TXT file."
            text={jdText}
            setText={setJdText}
            loading={jdLoading}
            onFileChange={handleJDFile}
          />

          <InputCard
            title="Resume"
            description="Paste your resume or upload a PDF, DOCX, or TXT file."
            text={resumeText}
            setText={setResumeText}
            loading={resumeLoading}
            onFileChange={handleResumeFile}
          />
        </div>

        {/* Error */}

        {error && (
          <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* CTA */}

        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:flex-row">
          <div>
            <p className="font-medium">
              Ready to analyze?
            </p>

            <p className="mt-1 text-sm text-white/40">
              The next step uses Gemini
              with Groq fallback and
              calculates Job Fit in code.
            </p>
          </div>

          <button
            onClick={startAnalysis}
            disabled={
              jdLoading ||
              resumeLoading
            }
            className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start Analysis →
          </button>
        </div>

        {/* Pipeline */}

        <div className="mt-10 grid gap-3 sm:grid-cols-4">
          {[
            "01 Input",
            "02 Role Analysis",
            "03 Candidate Fit",
            "04 Adaptive Interview",
          ].map((step) => (
            <div
              key={step}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/50"
            >
              {step}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function InputCard({
  title,
  description,
  text,
  setText,
  loading,
  onFileChange,
}: {
  title: string;
  description: string;
  text: string;
  setText: (value: string) => void;
  loading: boolean;
  onFileChange: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            {title}
          </h2>

          <p className="mt-1 text-sm text-white/40">
            {description}
          </p>
        </div>

        <label className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition hover:bg-white/10">
          {loading
            ? "Reading..."
            : "Choose file"}

          <input
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={onFileChange}
          />
        </label>
      </div>

      <textarea
        value={text}
        onChange={(event) =>
          setText(event.target.value)
        }
        placeholder={`Paste ${title.toLowerCase()} here...`}
        className="mt-5 min-h-[360px] w-full resize-y rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white outline-none placeholder:text-white/20 focus:border-cyan-400/40"
      />

      <div className="mt-3 flex justify-between text-xs text-white/30">
        <span>
          Editable extracted text
        </span>

        <span>
          {text.length.toLocaleString()} chars
        </span>
      </div>
    </section>
  );
}