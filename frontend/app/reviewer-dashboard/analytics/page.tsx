"use client";

import { useState } from "react";

type Reviewer = {
  id: string;
  name: string;
};

const MOCK_REVIEWERS: Reviewer[] = [
  { id: "REV-001", name: "You" },
  { id: "REV-002", name: "Senior Reviewer" },
];

export default function ReviewerAnalyticsPage() {
  /* ANALYTICS CONTEXT */
  const [selectedReviewer, setSelectedReviewer] =
    useState<Reviewer | null>(null);
  const [timeRange, setTimeRange] = useState("Last 30 Days");

  /* DUMMY ANALYTICS DATA — SCOPED */
  const metrics = selectedReviewer
    ? {
        completed: 42,
        avgTime: "1.8 days",
        rating: 4.6,
      }
    : null;

  const categoryReport = selectedReviewer
    ? [
        { category: "Technology", count: 18 },
        { category: "Business", count: 10 },
        { category: "Environment", count: 8 },
        { category: "Health", count: 6 },
      ]
    : [];

  const workload = selectedReviewer
    ? {
        pending: 8,
        completed: 42,
      }
    : null;

  const handleRefresh = () => {
    if (!selectedReviewer) return;
    // frontend-only placeholder
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* HEADER */}
      <section className="space-y-1 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Reviewer Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Performance metrics and contribution insights
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={!selectedReviewer}
          className="px-4 py-2 rounded-md border border-border disabled:opacity-50"
        >
          Refresh
        </button>
      </section>

      {/* CONTEXT SELECTION */}
      <section className="bg-card border border-border rounded-lg shadow-sm p-5 grid md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Select Reviewer
          </p>
          <select
            value={selectedReviewer?.id ?? ""}
            onChange={(e) => {
              const reviewer = MOCK_REVIEWERS.find(
                (r) => r.id === e.target.value
              );
              setSelectedReviewer(reviewer ?? null);
            }}
            className="w-full border border-border rounded-md p-2 bg-background"
          >
            <option value="">Choose reviewer…</option>
            {MOCK_REVIEWERS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Time Range
          </p>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-full border border-border rounded-md p-2 bg-background"
          >
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 6 Months</option>
            <option>All Time</option>
          </select>
        </div>
      </section>

      {/* METRICS */}
      {metrics && (
        <>
          {/* TOP METRICS */}
          <section className="grid md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-2">
              <p className="text-sm text-muted-foreground">
                Total Completed Reviews
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {metrics.completed}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-2">
              <p className="text-sm text-muted-foreground">
                Average Review Time
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {metrics.avgTime}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-2">
              <p className="text-sm text-muted-foreground">
                Reviewer Rating
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {metrics.rating} / 5
              </p>
            </div>
          </section>

          {/* CATEGORY CONTRIBUTION */}
          <section className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">
            <h3 className="font-medium text-foreground">
              Contribution by Category
            </h3>
            {categoryReport.map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{item.category}</span>
                  <span>{item.count} reviews</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${
                        (item.count / metrics.completed) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </section>

          {/* PENDING VS COMPLETED */}
          {workload && (
            <section className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">
              <h3 className="font-medium text-foreground">
                Pending vs Completed Reviews
              </h3>
              <div className="flex items-end gap-10 h-40">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-12 bg-warning rounded-md"
                    style={{ height: `${workload.pending * 4}px` }}
                  />
                  <p className="text-sm">
                    Pending ({workload.pending})
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-12 bg-success rounded-md"
                    style={{
                      height: `${workload.completed * 2}px`,
                    }}
                  />
                  <p className="text-sm">
                    Completed ({workload.completed})
                  </p>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
