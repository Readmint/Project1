"use client";

import { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function QualityCheckPage() {
  const [showPlagiarism, setShowPlagiarism] = useState(false);

  // FORM STATES
  const [wordCount, setWordCount] = useState<number | "">("");
  const [category, setCategory] = useState("Select Category");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [imageVerified, setImageVerified] = useState(false);

  const categories = ["Tech", "Lifestyle", "Science", "Business", "Health"];

  // VALIDATION LOGIC
  const isWordCountValid = typeof wordCount === "number" && wordCount >= 300;
  const isCategoryValid = category !== "Select Category";
  const isSeoValid = seoTitle.trim().length > 0 && seoDesc.trim().length >= 50;
  const isImageCopyrightValid = imageVerified;

  const plagiarismReport = {
    score: "0%",
    summary: "No matches found across indexed sources.",
  };

  const allChecksPass =
    isWordCountValid &&
    isCategoryValid &&
    isSeoValid &&
    isImageCopyrightValid;

  return (
    <main className="px-6 py-6 space-y-8">
      <h1 className="text-2xl font-semibold">Quality Check</h1>
      <p className="text-slate-600 text-sm">
        Final review before approving content for publication.
      </p>

      {/* 1️⃣ Plagiarism Report Viewer */}
      <div className="border rounded-lg bg-white dark:bg-slate-900 shadow-sm">
        <button
          className="w-full flex justify-between px-4 py-3 text-sm font-medium"
          onClick={() => setShowPlagiarism(!showPlagiarism)}
        >
          <span className="flex items-center gap-2">
            <ShieldCheck size={18} /> Plagiarism Report
          </span>
          {showPlagiarism ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showPlagiarism && (
          <div className="px-4 pb-4 text-sm space-y-2 border-t mt-2">
            <p><strong>Score:</strong> {plagiarismReport.score}</p>
            <p><strong>Summary:</strong> {plagiarismReport.summary}</p>
          </div>
        )}
      </div>

      {/* 2️⃣ Word Count Check */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Word Count</label>
        <input
          type="number"
          value={wordCount}
          onChange={(e) =>
            setWordCount(e.target.value === "" ? "" : Number(e.target.value))
          }
          placeholder="Enter word count"
          className="border rounded-lg px-3 py-2 dark:bg-slate-800"
        />
        {!isWordCountValid && wordCount !== "" && (
          <p className="text-xs text-rose-500">
            Minimum required: 300 words.
          </p>
        )}
      </div>

      {/* 3️⃣ Category Relevance Check */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Category</label>
        <select
          className="border rounded-lg px-3 py-2 dark:bg-slate-800"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>Select Category</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        {!isCategoryValid && (
          <p className="text-xs text-rose-500">Please select a category.</p>
        )}
      </div>

      {/* 4️⃣ SEO Fields Validation */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">SEO Title</label>
          <input
            type="text"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="border rounded-lg px-3 py-2 dark:bg-slate-800"
            placeholder="Enter SEO title"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Meta Description</label>
          <textarea
            value={seoDesc}
            onChange={(e) => setSeoDesc(e.target.value)}
            className="border rounded-lg px-3 py-2 dark:bg-slate-800"
            rows={3}
            placeholder="Enter meta description (min 50 characters)"
          ></textarea>
        </div>

        {!isSeoValid && (seoTitle || seoDesc) && (
          <p className="text-xs text-rose-500">
            SEO title required & description must be at least 50 characters.
          </p>
        )}
      </div>

      {/* 5️⃣ Image Copyright Verification */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border rounded-lg px-4 py-3 shadow-sm">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={imageVerified}
          onChange={(e) => setImageVerified(e.target.checked)}
        />
        <span className="text-sm">I confirm all images used have proper licensing.</span>
      </div>

      {/* 6️⃣ Approve / Reject */}
      <div className="flex gap-3 pt-4">
        <button
          disabled={!allChecksPass}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white
            ${
              allChecksPass
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-emerald-300 cursor-not-allowed"
            }
          `}
        >
          <CheckCircle2 size={16} /> Approve
        </button>

        <button className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg text-sm">
          <XCircle size={16} /> Reject
        </button>
      </div>
    </main>
  );
}
