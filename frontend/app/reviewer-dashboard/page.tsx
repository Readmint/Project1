"use client";

import { useRouter } from "next/navigation";

export default function ReviewerOverviewPage() {
  const router = useRouter();

  // Mocked frontend-only data
  const stats = [
    { label: "Total Assigned Reviews", value: 24 },
    { label: "Pending Reviews", value: 8 },
    { label: "Under Evaluation", value: 6 },
    { label: "Completed Reviews", value: 10 },
    { label: "High Priority Submissions", value: 3 },
  ];

  // Frontend-only handlers (navigation / placeholders)
  const handleStartReview = () => {
    router.push("/reviewer-dashboard/workspace");
  };

  const handleViewSubmissions = () => {
    router.push("/reviewer-dashboard/assigned");
  };

  const handlePlagiarismCheck = () => {
    router.push("/reviewer-dashboard/plagiarism");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* HEADER */}
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">
          Reviewer Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Overview of assigned reviews, priorities, and actions
        </p>
      </section>

      {/* OVERVIEW STATS */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-2"
          >
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </section>

      {/* QUICK ACTIONS */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Quick Actions
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <button
            onClick={handleStartReview}
            className="bg-card border border-border rounded-lg shadow-sm p-6 text-left hover:bg-muted transition"
          >
            <p className="font-medium text-foreground">Start Review</p>
            <p className="text-sm text-muted-foreground">
              Continue or begin evaluating assigned submissions
            </p>
          </button>

          <button
            onClick={handleViewSubmissions}
            className="bg-card border border-border rounded-lg shadow-sm p-6 text-left hover:bg-muted transition"
          >
            <p className="font-medium text-foreground">View Submissions</p>
            <p className="text-sm text-muted-foreground">
              Browse all assigned and completed submissions
            </p>
          </button>

          <button
            onClick={handlePlagiarismCheck}
            className="bg-card border border-border rounded-lg shadow-sm p-6 text-left hover:bg-muted transition"
          >
            <p className="font-medium text-foreground">Check Plagiarism</p>
            <p className="text-sm text-muted-foreground">
              Run plagiarism detection on selected submissions
            </p>
          </button>
        </div>
      </section>
    </div>
  );
}
