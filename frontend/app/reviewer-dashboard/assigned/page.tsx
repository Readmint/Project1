"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const INITIAL_REVIEWS = [
  {
    id: 1,
    title: "AI in Healthcare",
    author: "Jane Doe",
    category: "Technology",
    submissionDate: "2025-12-01",
    deadline: "2025-12-15",
    priority: "High",
    status: "Pending",
  },
  {
    id: 2,
    title: "Climate Change Policy",
    author: "John Smith",
    category: "Environment",
    submissionDate: "2025-11-28",
    deadline: "2025-12-10",
    priority: "Normal",
    status: "Under Review",
  },
  {
    id: 3,
    title: "Startup Funding Trends",
    author: "Emily Chen",
    category: "Business",
    submissionDate: "2025-11-25",
    deadline: "2025-12-05",
    priority: "Urgent",
    status: "Pending",
  },
];

export default function AssignedReviewsPage() {
  const router = useRouter();

  const [reviews, setReviews] = useState(INITIAL_REVIEWS);

  const [filters, setFilters] = useState({
    category: "All",
    priority: "All",
    status: "All",
  });

  const updateStatus = (id: number, status: string) => {
    setReviews((prev) =>
      prev.map((review) =>
        review.id === id ? { ...review, status } : review
      )
    );
  };

  const filteredReviews = reviews.filter((review) => {
    return (
      (filters.category === "All" || review.category === filters.category) &&
      (filters.priority === "All" || review.priority === filters.priority) &&
      (filters.status === "All" || review.status === filters.status)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* HEADER */}
      <section className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">
          Assigned Reviews
        </h1>
        <p className="text-sm text-muted-foreground">
          Submissions assigned for evaluation and final decision
        </p>
      </section>

      {/* FILTERS */}
      <section className="grid md:grid-cols-4 gap-4">
        <select
          className="border border-border rounded-md p-2 bg-background"
          value={filters.category}
          onChange={(e) =>
            setFilters({ ...filters, category: e.target.value })
          }
        >
          <option>All</option>
          <option>Technology</option>
          <option>Environment</option>
          <option>Business</option>
        </select>

        <select
          className="border border-border rounded-md p-2 bg-background"
          value={filters.priority}
          onChange={(e) =>
            setFilters({ ...filters, priority: e.target.value })
          }
        >
          <option>All</option>
          <option>Normal</option>
          <option>High</option>
          <option>Urgent</option>
        </select>

        <select
          className="border border-border rounded-md p-2 bg-background"
          value={filters.status}
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value })
          }
        >
          <option>All</option>
          <option>Pending</option>
          <option>Under Review</option>
          <option>Returned</option>
          <option>Submitted</option>
        </select>
      </section>

      {/* TABLE */}
      <section className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-sm text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Author</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Submitted</th>
                <th className="text-left px-4 py-3 font-medium">Deadline</th>
                <th className="text-left px-4 py-3 font-medium">Priority</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((review) => (
                <tr
                  key={review.id}
                  className="border-t border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-4 font-medium text-foreground">
                    {review.title}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground text-sm">
                    {review.author}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground text-sm">
                    {review.category}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground text-sm">
                    {review.submissionDate}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground text-sm">
                    {review.deadline}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span
                      className={
                        review.priority === "Urgent"
                          ? "text-destructive font-medium"
                          : review.priority === "High"
                          ? "text-primary font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {review.priority}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {review.status}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1.5 min-w-[110px]">
                      <button
                        onClick={() =>
                          router.push(`/reviewer/submissions/${review.id}`)
                        }
                        className="text-xs text-left text-primary hover:underline font-medium"
                      >
                        Open
                      </button>

                      <button
                        onClick={() =>
                          updateStatus(review.id, "Under Review")
                        }
                        disabled={review.status === "Under Review"}
                        className="text-xs text-left hover:underline disabled:opacity-50"
                      >
                        Under Review
                      </button>

                      <button
                        onClick={() => updateStatus(review.id, "Returned")}
                        className="text-xs text-left hover:underline text-warning"
                      >
                        Return
                      </button>

                      <button
                        onClick={() => updateStatus(review.id, "Submitted")}
                        className="text-xs text-left hover:underline text-success"
                      >
                        Submit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredReviews.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">
              No submissions match the selected filters.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
