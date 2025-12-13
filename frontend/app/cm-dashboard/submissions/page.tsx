"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Filter,
  ChevronDown,
  Users,
  FileEdit,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { ActionModal } from "@/components/ui/action-modal";
import Link from "next/link";
import { getJSON, postJSON } from "@/lib/api";
import { useEffect } from "react";

interface Submission {
  id: string;
  title: string;
  author: string;
  category: string;
  date: string;
  status: string;
  priority: string;
}

export default function SubmissionsPage() {
  const router = useRouter();

  // STATEFUL SUBMISSIONS (so we can update statuses)
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await getJSON('/content-manager/submissions');
      setSubmissions(res.data);
    } catch (err) {
      console.error('Failed to fetch submissions', err);
    } finally {
      setLoading(false);
    }
  };

  // MODAL STATE ONLY FOR sendback & approve
  const [modal, setModal] = useState<{
    type: "sendback" | "approve" | null;
    submission: Submission | null;
  }>({
    type: null,
    submission: null,
  });

  const openModal = (type: "sendback" | "approve", submission: Submission) => {
    setModal({ type, submission });
  };

  const closeModal = () => {
    setModal({ type: null, submission: null });
  };

  // UPDATE STATUS FUNCTION
  const updateStatus = (id: string, newStatus: string) => {
    setSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === id ? { ...sub, status: newStatus } : sub
      )
    );
  };

  return (
    <main className="w-full px-6 py-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-semibold">Submissions</h1>

        {/* FILTER BUTTON */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg text-sm border">
            <Filter size={14} />
            Filters
            <ChevronDown size={14} />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Filter Submissions</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Category Filter */}
            <DropdownMenuLabel className="text-xs text-slate-400">Category</DropdownMenuLabel>
            <DropdownMenuItem>All</DropdownMenuItem>
            <DropdownMenuItem>Tech</DropdownMenuItem>
            <DropdownMenuItem>Lifestyle</DropdownMenuItem>
            <DropdownMenuItem>Science</DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Status Filter */}
            <DropdownMenuLabel className="text-xs text-slate-400">Status</DropdownMenuLabel>
            <DropdownMenuItem>All</DropdownMenuItem>
            <DropdownMenuItem>New</DropdownMenuItem>
            <DropdownMenuItem>Under Review</DropdownMenuItem>
            <DropdownMenuItem>Editor Review</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* TABLE */}
      <div className="border rounded-xl bg-white dark:bg-slate-900 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase border-b text-slate-500">
              <th className="py-2 px-3">Title</th>
              <th className="py-2 px-3">Author</th>
              <th className="py-2 px-3">Category</th>
              <th className="py-2 px-3">Date</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Priority</th>
              <th className="py-2 px-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {submissions.map((sub) => (
              <tr key={sub.id} className="border-b last:border-0">
                <td
                  className="py-2 px-3 text-indigo-600 cursor-pointer hover:underline"
                  onClick={() => router.push(`/cm-dashboard/submissions/${sub.id}`)}
                >
                  {sub.title}
                </td>

                <td className="py-2 px-3">{sub.author}</td>
                <td className="py-2 px-3">{sub.category}</td>
                <td className="py-2 px-3">{sub.date}</td>
                <td className="py-2 px-3">{getStatusBadge(sub.status)}</td>
                <td className="py-2 px-3">{sub.priority}</td>

                <td className="py-2 px-3 flex gap-2">
                  {/* Assign Reviewer → PAGE */}
                  <button
                    title="Assign Reviewer"
                    className="p-2 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-600"
                    onClick={() =>
                      router.push(`/cm-dashboard/reviewer-assignments?submission=${sub.id}`)
                    }
                  >
                    <Users size={14} />
                  </button>

                  {/* Assign Editor → PAGE */}
                  <button
                    title="Assign Editor"
                    className="p-2 rounded-md bg-amber-100 dark:bg-amber-900 text-amber-600"
                    onClick={() =>
                      router.push(`/cm-dashboard/editor-assignments?submission=${sub.id}`)
                    }
                  >
                    <FileEdit size={14} />
                  </button>

                  {/* Send Back → MODAL */}
                  <button
                    title="Send Back for Changes"
                    className="p-2 rounded-md bg-rose-100 dark:bg-rose-900 text-rose-600"
                    onClick={() => openModal("sendback", sub)}
                  >
                    <RefreshCw size={14} />
                  </button>

                  {/* Approve → MODAL */}
                  <button
                    title="Approve"
                    className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-600"
                    onClick={() => openModal("approve", sub)}
                  >
                    <CheckCircle2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SEND BACK MODAL */}
      {modal.type === "sendback" && modal.submission && (
        <ActionModal title="Send Back for Changes" open onClose={closeModal}>
          <textarea
            className="w-full border rounded p-2"
            rows={4}
            placeholder="Write feedback..."
          />

          <button
            className="mt-4 bg-rose-600 text-white px-4 py-2 rounded w-full"
            onClick={() => {
              updateStatus(modal.submission!.id, "Changes Requested");
              closeModal();
            }}
          >
            Send Back
          </button>
        </ActionModal>
      )}

      {/* APPROVE MODAL */}
      {modal.type === "approve" && modal.submission && (
        <ActionModal title="Approve Submission" open onClose={closeModal}>
          <p>
            Are you sure you want to approve{" "}
            <strong>{modal.submission.title}</strong>?
          </p>

          <button
            className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded w-full"
            onClick={() => {
              updateStatus(modal.submission!.id, "Approved");
              closeModal();
            }}
          >
            Approve
          </button>
        </ActionModal>
      )}
    </main>
  );
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    submitted: "bg-yellow-100 text-yellow-700 border-yellow-200",
    under_review: "bg-blue-100 text-blue-700 border-blue-200",
    changes_requested: "bg-orange-100 text-orange-700 border-orange-200",
    approved: "bg-green-100 text-green-700 border-green-200",
    published: "bg-purple-100 text-purple-700 border-purple-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  };

  const labels: Record<string, string> = {
    submitted: "Pending",
    under_review: "Under Review",
    changes_requested: "Changes Requested",
    approved: "Approved",
    published: "Published",
    rejected: "Rejected",
  };

  const normalized = status.toLowerCase();
  const style = styles[normalized] || "bg-slate-100 text-slate-700 border-slate-200";
  const label = labels[normalized] || status;

  return (
    <span className={`px-2 py-1 rounded-md text-xs border ${style} whitespace-nowrap`}>
      {label}
    </span>
  );
}