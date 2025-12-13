"use client";

import { useState } from "react";

type ReviewEvent = {
  revision: number;
  reviewer: string;
  decision: "Accepted" | "Rejected" | "Request Changes";
  date: string;
  notes: string;
};

type ArticleHistory = {
  id: string;
  title: string;
  revisionCount: number;
  history: ReviewEvent[];
};

const MOCK_HISTORY: ArticleHistory[] = [
  {
    id: "ART-001",
    title: "AI in Healthcare",
    revisionCount: 2,
    history: [
      {
        revision: 1,
        reviewer: "You",
        decision: "Request Changes",
        date: "2025-11-28",
        notes: "Improve clarity in methodology section.",
      },
      {
        revision: 2,
        reviewer: "You",
        decision: "Accepted",
        date: "2025-12-02",
        notes: "All issues resolved satisfactorily.",
      },
    ],
  },
  {
    id: "ART-002",
    title: "Climate Change Policy",
    revisionCount: 1,
    history: [
      {
        revision: 1,
        reviewer: "You",
        decision: "Accepted",
        date: "2025-11-25",
        notes: "Well-structured and factually sound.",
      },
    ],
  },
  {
    id: "ART-003",
    title: "Startup Funding Trends",
    revisionCount: 1,
    history: [
      {
        revision: 1,
        reviewer: "You",
        decision: "Rejected",
        date: "2025-11-18",
        notes: "High plagiarism detected.",
      },
    ],
  },
];

export default function ReviewHistoryPage() {
  const [selectedArticle, setSelectedArticle] =
    useState<ArticleHistory | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* HEADER */}
      <section className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">
          Review History & Logs
        </h1>
        <p className="text-sm text-muted-foreground">
          Full editorial decision trail and revision lifecycle
        </p>
      </section>

      {/* ARTICLE SELECTION */}
      <section className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
        <h3 className="font-medium text-foreground">
          Select Article
        </h3>

        <select
          value={selectedArticle?.id ?? ""}
          onChange={(e) => {
            const article = MOCK_HISTORY.find(
              (a) => a.id === e.target.value
            );
            setSelectedArticle(article ?? null);
          }}
          className="w-full border border-border rounded-md p-2 bg-background"
        >
          <option value="">Choose an article…</option>
          {MOCK_HISTORY.map((article) => (
            <option key={article.id} value={article.id}>
              {article.title}
            </option>
          ))}
        </select>

        {selectedArticle && (
          <div className="text-sm text-muted-foreground border border-border rounded-md p-3 space-y-1">
            <p>
              <span className="font-medium text-foreground">Title:</span>{" "}
              {selectedArticle.title}
            </p>
            <p>
              <span className="font-medium text-foreground">
                Total Revisions:
              </span>{" "}
              {selectedArticle.revisionCount}
            </p>
            <p>
              <span className="font-medium text-foreground">
                Article ID:
              </span>{" "}
              {selectedArticle.id}
            </p>
          </div>
        )}
      </section>

      {/* HISTORY TIMELINE */}
      {selectedArticle && (
        <section className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">
          <h3 className="font-medium text-foreground">
            Decision Timeline
          </h3>

          <div className="grid grid-cols-6 gap-4 text-sm text-muted-foreground">
            <span>Revision</span>
            <span>Reviewer</span>
            <span>Decision</span>
            <span>Date</span>
            <span className="col-span-2">Notes</span>
          </div>

          {selectedArticle.history.map((event, index) => (
            <div
              key={index}
              className="grid grid-cols-6 gap-4 items-start border-t border-border pt-3 text-sm"
            >
              <span className="font-medium">
                v{event.revision}
              </span>
              <span>{event.reviewer}</span>
              <span
                className={
                  event.decision === "Accepted"
                    ? "text-success"
                    : event.decision === "Rejected"
                    ? "text-destructive"
                    : "text-warning"
                }
              >
                {event.decision}
              </span>
              <span className="text-muted-foreground">
                {event.date}
              </span>
              <span className="col-span-2 text-muted-foreground">
                {event.notes}
              </span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
