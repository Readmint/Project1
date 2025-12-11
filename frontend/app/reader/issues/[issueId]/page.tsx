"use client";

import { useRouter } from "next/navigation";
import { BookOpen, ArrowRightLeft } from "lucide-react";
import { useState } from "react";

export default function IssueOverviewPage({ params }: { params: { issueId: string } }) {
  const router = useRouter();
  const [mode, setMode] = useState("scroll"); // temporary toggle ONLY for testing

  const issueId = params.issueId;

  // MOCK DATA — replace with API call
  const issue = {
    id: issueId,
    title: "Future of Tech 2026",
    cover: "/covers/future-tech.jpg",
    description:
      "Explore groundbreaking innovations, climate tech, AI breakthroughs, and global transformations shaping 2026.",
    chapters: [
      { id: 1, title: "Introduction", author: "John Doe", length: "6 min" },
      { id: 2, title: "AI Revolution", author: "Sarah Lee", length: "12 min" },
      { id: 3, title: "Sustainable Tech", author: "Priya Sharma", length: "8 min" },
    ],
    rating: 4.5,
  };

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">

      {/* HEADER */}
      <div className="flex gap-6">
        <img
          src={issue.cover}
          className="w-48 h-64 rounded-lg object-cover shadow"
        />

        <div className="space-y-3">
          <h1 className="text-3xl font-semibold">{issue.title}</h1>

          <p className="text-slate-600 dark:text-slate-300">
            {issue.description}
          </p>

          <div className="mt-3 flex flex-col gap-4">
            <button
              onClick={() =>
                router.push(
                  `/reader/issues/${issueId}/chapters/1?mode=${mode}`
                )
              }
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <BookOpen size={18} /> Continue Reading
            </button>

            {/* TEMPORARY MODE TOGGLE FOR TESTING */}
            <button
              onClick={() =>
                setMode((prev) => (prev === "scroll" ? "paging" : "scroll"))
              }
              className="px-4 py-2 rounded-lg border flex items-center gap-2"
            >
              <ArrowRightLeft size={16} />
              Mode: {mode === "scroll" ? "Scrolling" : "Paging"}
            </button>
          </div>
        </div>
      </div>

      {/* CHAPTER LIST */}
      <section>
        <h2 className="text-xl font-semibold mt-6">Chapters</h2>

        <div className="mt-3 space-y-3">
          {issue.chapters.map((ch) => (
            <div
              key={ch.id}
              onClick={() =>
                router.push(
                  `/reader/issues/${issueId}/chapters/${ch.id}?mode=${mode}`
                )
              }
              className="p-4 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <h3 className="font-medium">{ch.title}</h3>
              <p className="text-xs text-slate-500">
                {ch.author} • {ch.length}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
