"use client";

import { useState } from "react";
import { Users, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { getJSON, postJSON } from "@/lib/api";
import { useEffect } from "react";

export default function ReviewerAssignments() {
  const [selectedReviewer, setSelectedReviewer] = useState("Select Reviewer");
  const [reviewers, setReviewers] = useState<string[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reviewersRes, submissionsRes] = await Promise.all([
        getJSON('/content-manager/reviewers'),
        getJSON('/content-manager/submissions')
      ]);
      setReviewers(reviewersRes.data);
      setSubmissions(submissionsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle deadline update
  const updateDeadline = (id: string, value: string) => {
    setSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === id ? { ...sub, deadline: value } : sub
      )
    );
  };

  // Handle reviewer assignment + status update
  const handleAssignReviewer = async (id: string, deadline: string) => {
    if (selectedReviewer === "Select Reviewer") {
      alert("Please select a reviewer first.");
      return;
    }

    try {
      await postJSON('/content-manager/assign-reviewer', {
        submissionId: id,
        reviewerName: selectedReviewer,
        deadline
      });

      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === id
            ? {
              ...sub,
              assignedReviewer: selectedReviewer,
              status: "Reviewer Assigned",
            }
            : sub
        )
      );
      alert("Reviewer assigned successfully!");
    } catch (error) {
      console.error('Failed to assign reviewer', error);
      alert("Failed to assign reviewer");
    }
  };

  return (
    <main className="px-6 py-6 space-y-6">
      <h1 className="text-2xl font-semibold">Reviewer Assignments</h1>
      <p className="text-slate-500 text-sm">
        Assign reviewers based on expertise, set deadlines, and track progress.
      </p>

      {/* Reviewer Selector */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border px-3 py-2 rounded-lg">
            <Users size={16} />
            {selectedReviewer}
            <ChevronDown size={14} />
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            <DropdownMenuLabel>Available Reviewers</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {reviewers.map((r: any) => (
              <DropdownMenuItem key={r.user_id} onClick={() => setSelectedReviewer(r.name)}>
                {r.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* TABLE */}
      <div className="border rounded-xl bg-white dark:bg-slate-900 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500 border-b">
              <th className="py-2 px-3">Title</th>
              <th className="py-2 px-3">Category</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Deadline</th>
              <th className="py-2 px-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {submissions.map((sub) => (
              <tr key={sub.id} className="border-b last:border-0">
                <td className="py-2 px-3 text-indigo-600 cursor-pointer hover:underline">
                  {sub.title}
                </td>

                <td className="py-2 px-3">{sub.category}</td>

                <td className="py-2 px-3">
                  <span
                    className={`px-2 py-1 rounded-md text-xs ${sub.status === "Reviewer Assigned"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                      }`}
                  >
                    {sub.status}
                  </span>
                </td>

                {/* Deadline */}
                <td className="py-2 px-3">
                  <input
                    type="date"
                    value={sub.deadline || ""}
                    onChange={(e) => updateDeadline(sub.id, e.target.value)}
                    className="rounded border dark:bg-slate-800 px-2 py-1 text-xs"
                  />
                </td>

                {/* Action Button */}
                <td className="py-2 px-3">
                  {!sub.assignedReviewer ? (
                    <button
                      className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg"
                      onClick={() => handleAssignReviewer(sub.id, sub.deadline)}
                    >
                      Assign Reviewer
                    </button>
                  ) : (
                    <button
                      className="bg-amber-600 text-white text-xs px-3 py-1.5 rounded-lg"
                      onClick={() =>
                        alert(`Reassigning reviewer for ${sub.title}`)
                      }
                    >
                      Reassign Reviewer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
