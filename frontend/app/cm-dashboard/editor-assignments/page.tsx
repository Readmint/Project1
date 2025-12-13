"use client";

import { useState } from "react";
import { FileEdit, ChevronDown } from "lucide-react";
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

export default function EditorAssignments() {
  const [editors, setEditors] = useState<{ name: string, id: string }[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [editorsRes, submissionsRes] = await Promise.all([
        getJSON('/content-manager/editors'),
        getJSON('/content-manager/submissions')
      ]);
      setEditors(editorsRes.data);
      // Filter for items that need editor assignment or have one
      setItems(submissionsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  // HANDLE ASSIGNING EDITOR + STATUS UPDATE
  const handleAssign = async (id: string, editorName: string) => {
    try {
      await postJSON('/content-manager/assign-editor', {
        submissionId: id,
        editorName: editorName
      });

      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
              ...item,
              assignedEditor: editorName,
              status: "Editor Assigned", // Optimistic update
            }
            : item
        )
      );
    } catch (error) {
      console.error('Failed to assign editor', error);
      alert("Failed to assign editor");
    }
  };

  // HANDLE UNASSIGN
  const handleUnassign = async (id: string) => {
    try {
      await postJSON('/content-manager/unassign-editor', {
        submissionId: id
      });

      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
              ...item,
              assignedEditor: null,
              status: "Pending", // Reset status
            }
            : item
        )
      );
    } catch (error) {
      console.error('Failed to unassign editor', error);
      alert("Failed to unassign editor");
    }
  };

  return (
    <main className="px-6 py-6 space-y-6">
      <h1 className="text-2xl font-semibold">Editor Assignments</h1>
      <p className="text-slate-500 text-sm">
        Assign editors, set priorities, and track editing progress.
      </p>

      {/* TABLE */}
      <div className="border rounded-xl bg-white dark:bg-slate-900 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500 border-b">
              <th className="py-2 px-3">Title</th>
              <th className="py-2 px-3">Category</th>
              <th className="py-2 px-3">Priority</th>
              <th className="py-2 px-3">Deadline</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="py-2 px-3">{item.title}</td>

                <td className="py-2 px-3">{item.category}</td>

                <td className="py-2 px-3">
                  <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs">
                    {item.priority}
                  </span>
                </td>

                <td className="py-2 px-3">{item.deadline}</td>

                <td className="py-2 px-3">
                  {getStatusBadge(item.status)}
                </td>

                <td className="py-2 px-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg text-xs ${item.assignedEditor ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-indigo-600 text-white border-indigo-600'}`}>
                      {item.assignedEditor ? (
                        <>
                          {item.assignedEditor} <ChevronDown size={12} />
                        </>
                      ) : (
                        <>
                          Assign Editor <ChevronDown size={12} />
                        </>
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Choose Editor</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {editors.map((e) => (
                        <DropdownMenuItem
                          key={e.id}
                          onClick={() => handleAssign(item.id, e.name)}
                          className={item.assignedEditor === e.name ? "bg-slate-100" : ""}
                        >
                          {e.name}
                        </DropdownMenuItem>
                      ))}
                      {/* Show Unassign if assigned OR if status is stuck in under_review */
                        (item.assignedEditor || item.status === 'under_review') && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              onClick={() => handleUnassign(item.id)}
                            >
                              {item.assignedEditor ? "Unassign" : "Reset Status"}
                            </DropdownMenuItem>
                          </>
                        )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main >
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
    "Editor Assigned": "Under Review" // Optimistic update fallback
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
