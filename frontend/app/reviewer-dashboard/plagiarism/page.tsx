"use client";

import { useState } from "react";

type DecisionStatus =
  | "Not Checked"
  | "Needs Validation"
  | "Approved"
  | "Returned for Rewrite"
  | "Flagged";

type Article = {
  id: string;
  title: string;
  author: string;
  revision: string;
};

const MOCK_ARTICLES: Article[] = [
  {
    id: "ART-001",
    title: "AI in Healthcare",
    author: "Jane Doe",
    revision: "v2",
  },
  {
    id: "ART-002",
    title: "Climate Change Policy",
    author: "John Smith",
    revision: "v1",
  },
  {
    id: "ART-003",
    title: "Startup Funding Trends",
    author: "Emily Chen",
    revision: "v3",
  },
];

export default function PlagiarismPage() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [notes, setNotes] = useState("");

  const [report, setReport] = useState({
    similarity: 18,
    unique: 82,
    status: "Needs Validation" as DecisionStatus,
    matches: [
      {
        text: "Artificial Intelligence is transforming industries worldwide.",
        source: "https://example.com/ai-industry-overview",
        type: "External Web",
      },
      {
        text: "AI-driven systems improve efficiency and decision-making.",
        source: "Internal Archive: Article #124",
        type: "Internal Database",
      },
    ],
  });

  const getThresholdLabel = (similarity: number) => {
    if (similarity <= 10) return "Acceptable";
    if (similarity <= 20) return "Needs Reviewer Validation";
    if (similarity <= 40) return "Must Be Revised";
    return "High Plagiarism";
  };

  const getStatusColor = (status: DecisionStatus) => {
    switch (status) {
      case "Approved":
        return "text-success";
      case "Returned for Rewrite":
        return "text-warning";
      case "Flagged":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  /* ACTIONS */
  const handleRunCheck = () => {
    if (!selectedArticle) return;
    setHasRun(true);
  };

  const handleApprove = () => {
    setReport((prev) => ({ ...prev, status: "Approved" }));
  };

  const handleSendBack = () => {
    setReport((prev) => ({ ...prev, status: "Returned for Rewrite" }));
  };

  const handleFlag = () => {
    setReport((prev) => ({ ...prev, status: "Flagged" }));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* HEADER */}
      <section className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">
          Plagiarism Check
        </h1>
        <p className="text-sm text-muted-foreground">
          Standalone plagiarism analysis tool with explicit article selection
        </p>
      </section>

      {/* ARTICLE SELECTION */}
      <section className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
        <h3 className="font-medium text-foreground">Select Article</h3>

        <select
          disabled={hasRun}
          value={selectedArticle?.id ?? ""}
          onChange={(e) => {
            const article = MOCK_ARTICLES.find(
              (a) => a.id === e.target.value
            );
            setSelectedArticle(article ?? null);
          }}
          className="w-full border border-border rounded-md p-2 bg-background disabled:opacity-50"
        >
          <option value="">Choose an article…</option>
          {MOCK_ARTICLES.map((article) => (
            <option key={article.id} value={article.id}>
              {article.title} — {article.author}
            </option>
          ))}
        </select>

        {selectedArticle && (
          <div className="text-sm text-muted-foreground border border-border rounded-md p-3">
            <p>
              <span className="font-medium text-foreground">Title:</span>{" "}
              {selectedArticle.title}
            </p>
            <p>
              <span className="font-medium text-foreground">Author:</span>{" "}
              {selectedArticle.author}
            </p>
            <p>
              <span className="font-medium text-foreground">Revision:</span>{" "}
              {selectedArticle.revision}
            </p>
            <p>
              <span className="font-medium text-foreground">Article ID:</span>{" "}
              {selectedArticle.id}
            </p>
          </div>
        )}
      </section>

      {/* RUN CHECK */}
      <section>
        <button
          onClick={handleRunCheck}
          disabled={!selectedArticle || hasRun}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50"
        >
          {hasRun ? "Check Completed" : "Run Plagiarism Check"}
        </button>
      </section>

      {hasRun && selectedArticle && (
        <>
          {/* STATUS */}
          <section className="bg-muted/40 border border-border rounded-lg p-4 flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Review Status
            </p>
            <p className={`font-medium ${getStatusColor(report.status)}`}>
              {report.status}
            </p>
          </section>

          {/* SUMMARY */}
          <section className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-2">
              <p className="text-sm text-muted-foreground">Total Similarity</p>
              <p className="text-3xl font-semibold text-primary">
                {report.similarity}%
              </p>
              <p className="text-sm text-muted-foreground">
                {getThresholdLabel(report.similarity)}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-2">
              <p className="text-sm text-muted-foreground">Unique Content</p>
              <p className="text-3xl font-semibold text-foreground">
                {report.unique}%
              </p>
            </div>
          </section>

          {/* MATCHES */}
          <section className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">
            <h3 className="font-medium text-foreground">Matched Sources</h3>

            {report.matches.map((match, index) => (
              <div
                key={index}
                className="border border-border rounded-md p-3 space-y-1"
              >
                <p className="text-sm text-destructive">“{match.text}”</p>
                <p className="text-xs text-muted-foreground">
                  Source ({match.type}):{" "}
                  <a
                    href={match.source}
                    target="_blank"
                    className="underline"
                  >
                    {match.source}
                  </a>
                </p>
              </div>
            ))}
          </section>

          {/* NOTES */}
          <section className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
            <h3 className="font-medium text-foreground">Reviewer Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add justification, comments, or instructions for the author..."
              className="w-full min-h-[120px] border border-border rounded-md p-2 text-sm"
            />
          </section>

          {/* ACTIONS */}
          <section className="flex justify-end gap-4">
            <button
              onClick={handleApprove}
              disabled={report.similarity > 20 || report.status === "Approved"}
              className="px-4 py-2 rounded-md border border-border disabled:opacity-50"
            >
              Approve
            </button>

            <button
              onClick={handleSendBack}
              disabled={report.status === "Returned for Rewrite"}
              className="px-4 py-2 rounded-md border border-warning text-warning disabled:opacity-50"
            >
              Send Back for Rewrite
            </button>

            <button
              onClick={handleFlag}
              disabled={report.status === "Flagged"}
              className="px-4 py-2 rounded-md border border-destructive text-destructive disabled:opacity-50"
            >
              Flag High Plagiarism
            </button>
          </section>
        </>
      )}
    </div>
  );
}
