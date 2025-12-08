"use client";

import { useRouter } from "next/navigation";
import { RefreshCw, MessageCircle } from "lucide-react";

const changeRequests = [
  {
    id: "RM-1022",
    title: "AI in Small Businesses",
    reviewerNotes: "Rewrite section 3 for clarity.",
    status: "Awaiting Author",
  },
  {
    id: "RM-1018",
    title: "Healthy Habits for Remote Work",
    reviewerNotes: "Expand introduction.",
    status: "Resubmitted",
  },
];

export default function ChangeRequestPage() {
  const router = useRouter();

  return (
    <main className="px-6 py-6 space-y-6">
      <h1 className="text-2xl font-semibold">Change Requests</h1>
      <p className="text-sm text-slate-500">
        Manage revision requests from reviewers and editors.
      </p>

      <div className="space-y-4">
        {changeRequests.map((req) => (
          <div
            key={req.id}
            className="border rounded-xl bg-white dark:bg-slate-900 px-5 py-4 shadow-sm"
          >
            <h3 className="font-medium">{req.title}</h3>
            <p className="text-xs text-slate-500 mt-2">{req.reviewerNotes}</p>

            <div className="flex justify-between items-center mt-3">
              <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                {req.status}
              </span>

              <button
                className="flex items-center gap-1 text-indigo-600 text-sm"
                onClick={() => router.push(`/cm-dashboard/submissions/${req.id}`)}
              >
                <MessageCircle size={14} />
                View Submission
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
