"use client";

import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export default function ReviewPage() {
  const plagiarism = [
    { topic: "AI in Healthcare", score: "12%", result: "Clear" },
    { topic: "Blockchain Security", score: "48%", result: "High Similarity" },
  ];

  const reviews = [
    { topic: "AI in Healthcare", reviewer: "Dr. Patel", status: "Approved" },
    { topic: "Quantum Materials", reviewer: "Prof. Verma", status: "Needs Correction" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-2 py-2 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Review & Plagiarism</h1>
        <p className="text-muted-foreground text-sm">
          Check plagiarism and manage reviewer decisions.
        </p>
      </div>

      {/* PLAGIARISM */}
      <section className="space-y-6">
        <h2 className="text-foreground font-medium">Plagiarism Check Results</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {plagiarism.map((p, i) => (
            <div key={i} className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
              <h3 className="font-semibold text-foreground">{p.topic}</h3>
              <p className="text-sm text-muted-foreground">Similarity: {p.score}</p>
              <p className="text-sm font-medium text-primary">{p.result}</p>
            </div>
          ))}
        </div>
      </section>

      {/* REVIEW PANEL */}
      <section className="space-y-6">
        <h2 className="text-foreground font-medium">Reviewer Decisions</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {reviews.map((r, i) => (
            <div key={i} className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
              <h3 className="font-semibold text-foreground">{r.topic}</h3>
              <p className="text-sm text-muted-foreground">Reviewer: {r.reviewer}</p>
              <p className="text-sm font-medium text-primary">{r.status}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
