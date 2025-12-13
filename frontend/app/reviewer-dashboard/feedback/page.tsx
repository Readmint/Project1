"use client";

import { useState } from "react";

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

export default function FeedbackCenterPage() {
  /* ARTICLE SELECTION */
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  /* FEEDBACK STATE */
  const [summary, setSummary] = useState(
    "The article is well-researched and relevant, but several sections require clarity improvements and tighter structure."
  );

  const [ratings, setRatings] = useState({
    clarity: 4,
    quality: 3,
    structure: 3,
  });

  const [generalComments, setGeneralComments] = useState("");

  const [inlineComments, setInlineComments] = useState([
    {
      line: "Introduction paragraph",
      comment: "Consider adding a clearer thesis statement.",
    },
    {
      line: "Section on AI Ethics",
      comment: "Provide at least one real-world example.",
    },
  ]);

  const [mandatoryCorrections, setMandatoryCorrections] = useState([
    "Fix grammatical errors in paragraph 3",
    "Reorganize section headings for better flow",
  ]);

  const handleAddCorrection = () => {
    setMandatoryCorrections((prev) => [
      ...prev,
      "New mandatory correction (dummy)",
    ]);
  };

  const handleSubmitFeedback = () => {
    if (!selectedArticle) return;
    setIsLocked(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* HEADER */}
      <section className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">
          Feedback Center
        </h1>
        <p className="text-sm text-muted-foreground">
          Structured reviewer feedback with explicit article context
        </p>
      </section>

      {/* ARTICLE SELECTION */}
      <section className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
        <h3 className="font-medium text-foreground">Select Article</h3>

        <select
          disabled={isLocked}
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
          <div className="text-sm text-muted-foreground border border-border rounded-md p-3 space-y-1">
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

      {/* BLOCK EVERYTHING UNTIL ARTICLE IS SELECTED */}
      {selectedArticle && (
        <>
          {/* OVERALL SUMMARY */}
          <section className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
            <h3 className="font-medium text-foreground">
              Overall Review Summary
            </h3>
            <textarea
              value={summary}
              disabled={isLocked}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full min-h-[120px] border border-border rounded-md p-2 text-sm disabled:opacity-50"
            />
          </section>

          {/* RATINGS */}
          <section className="grid md:grid-cols-3 gap-6">
            {Object.entries(ratings).map(([key, value]) => (
              <div
                key={key}
                className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-2"
              >
                <p className="text-sm text-muted-foreground capitalize">
                  {key} Rating
                </p>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={value}
                  disabled={isLocked}
                  onChange={(e) =>
                    setRatings({
                      ...ratings,
                      [key]: Number(e.target.value),
                    })
                  }
                />
                <p className="text-sm">Score: {value}/5</p>
              </div>
            ))}
          </section>

          {/* INLINE COMMENTS */}
          <section className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
            <h3 className="font-medium text-foreground">Inline Comments</h3>
            {inlineComments.map((item, index) => (
              <div key={index} className="text-sm space-y-1">
                <p className="font-medium">{item.line}</p>
                <p className="text-muted-foreground">{item.comment}</p>
              </div>
            ))}
          </section>

          {/* GENERAL COMMENTS */}
          <section className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
            <h3 className="font-medium text-foreground">
              General Comments
            </h3>
            <textarea
              value={generalComments}
              disabled={isLocked}
              onChange={(e) => setGeneralComments(e.target.value)}
              placeholder="Add general feedback..."
              className="w-full min-h-[100px] border border-border rounded-md p-2 text-sm disabled:opacity-50"
            />
          </section>

          {/* MANDATORY CORRECTIONS */}
          <section className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-foreground">
                Mandatory Corrections
              </h3>
              {!isLocked && (
                <button
                  onClick={handleAddCorrection}
                  className="text-sm underline text-primary"
                >
                  Add Correction
                </button>
              )}
            </div>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              {mandatoryCorrections.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* ACTION */}
          <section className="flex justify-end">
            <button
              onClick={handleSubmitFeedback}
              disabled={isLocked}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50"
            >
              {isLocked ? "Feedback Submitted" : "Submit Feedback"}
            </button>
          </section>
        </>
      )}
    </div>
  );
}
