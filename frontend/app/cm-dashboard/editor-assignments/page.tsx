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

// STATIC EDITORS LIST
const editors = ["Anita Rao", "Michael Thomas", "Isha Banerjee", "Kai Wong"];

// INITIAL ITEMS
const initialItems = [
  {
    id: "RM-1012",
    title: "The Psychology of Influence",
    priority: "High",
    category: "Psychology",
    status: "Pending Assignment",
    deadline: "2025-12-10",
    assignedEditor: null as string | null,
  },
  {
    id: "RM-1011",
    title: "Autonomous Vehicles in 2030",
    priority: "Normal",
    category: "Technology",
    status: "Pending Assignment",
    deadline: "2025-12-15",
    assignedEditor: null as string | null,
  },
  {
    id: "RM-1010",
    title: "Work-Life Balance Hacks",
    priority: "Urgent",
    category: "Lifestyle",
    status: "Pending Assignment",
    deadline: "2025-12-08",
    assignedEditor: null as string | null,
  },
];

export default function EditorAssignments() {
  const [editor, setEditor] = useState("Select Editor");
  const [items, setItems] = useState(initialItems);

  // HANDLE ASSIGNING EDITOR + STATUS UPDATE
  const handleAssign = (id: string) => {
    if (editor === "Select Editor") {
      alert("Please select an editor first.");
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              assignedEditor: editor,
              status: "Editor Assigned",
            }
          : item
      )
    );
  };

  return (
    <main className="px-6 py-6 space-y-6">
      <h1 className="text-2xl font-semibold">Editor Assignments</h1>
      <p className="text-slate-500 text-sm">
        Assign editors, set priorities, and track editing progress.
      </p>

      {/* EDITOR SELECTOR */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border px-3 py-2 rounded-lg text-sm">
          <FileEdit size={16} /> {editor} <ChevronDown size={14} />
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          <DropdownMenuLabel>Select an Editor</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {editors.map((e) => (
            <DropdownMenuItem key={e} onClick={() => setEditor(e)}>
              {e}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

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
                  <span
                    className={`px-2 py-1 rounded-md text-xs ${
                      item.status === "Pending Assignment"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>

                <td className="py-2 px-3">
                  {!item.assignedEditor ? (
                    <button
                      className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg"
                      onClick={() => handleAssign(item.id)}
                    >
                      Assign Editor
                    </button>
                  ) : (
                    <button
                      className="bg-amber-600 text-white text-xs px-3 py-1.5 rounded-lg"
                      onClick={() => alert(`Reassigning editor for ${item.title}`)}
                    >
                      Reassign Editor
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
