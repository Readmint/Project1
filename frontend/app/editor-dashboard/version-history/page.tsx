"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  History,
  Clock,
  FileDiff,
  User,
  ArrowLeftCircle,
  ArrowRightCircle,
  CheckCircle2,
  XCircle,
  Layers,
  Eye,
  Download,
  RefreshCw,
  Search,
} from "lucide-react";

type VersionEntry = {
  id: number;
  editor: string;
  timestamp: string;
  status: "Draft Saved" | "Final Edit" | "Author Revision" | "Reviewer Edit" | "Auto-Save";
  changes: string[];
  diffSummary: {
    added: number;
    removed: number;
    modified: number;
  };
};

const mockHistory: VersionEntry[] = [
  {
    id: 15,
    editor: "Alex Morgan",
    timestamp: "Dec 02, 2025 – 05:42 PM",
    status: "Final Edit",
    changes: [
      "Polished conclusion section",
      "Rewrote introduction for clarity",
      "Fixed formatting issues",
    ],
    diffSummary: { added: 32, removed: 11, modified: 14 },
  },
  {
    id: 14,
    editor: "Jamie Lee",
    timestamp: "Dec 02, 2025 – 03:21 PM",
    status: "Reviewer Edit",
    changes: ["Added citation", "Highlighted coherence issues"],
    diffSummary: { added: 9, removed: 3, modified: 4 },
  },
  {
    id: 13,
    editor: "Author",
    timestamp: "Dec 01, 2025 – 08:10 PM",
    status: "Author Revision",
    changes: ["Updated stats", "Expanded section 2"],
    diffSummary: { added: 22, removed: 2, modified: 8 },
  },
  {
    id: 12,
    editor: "System",
    timestamp: "Dec 01, 2025 – 07:49 PM",
    status: "Auto-Save",
    changes: ["Auto-backup created"],
    diffSummary: { added: 0, removed: 0, modified: 1 },
  },
];

const statusBadge: Record<VersionEntry["status"], string> = {
  "Final Edit": "bg-green-100 text-green-600 px-2 py-1 rounded-full text-[9px]",
  "Reviewer Edit": "bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full text-[9px]",
  "Author Revision": "bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full text-[9px]",
  "Draft Saved": "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white px-2 py-1 rounded-full text-[9px]",
  "Auto-Save": "bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-[9px]",
};

export default function VersionHistoryPage() {
  const [selected, setSelected] = useState<VersionEntry | null>(null);
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 max-w-5xl mx-auto">

      {/* Title */}
      <div className="flex items-center gap-2 mb-6">
        <History size={22} className="text-indigo-600" />
        <h1 className="text-xl font-bold">Version History</h1>
      </div>

      <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-6">
        Track previous edits, reviewer changes, author revisions, and automatic backups.
      </p>

      {/* Search Bar */}
      <div className="relative mb-6 max-w-sm">
        <input
          placeholder="Search versions, editors, or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-100 dark:bg-slate-800 pl-8 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-[10px] outline-none focus:border-indigo-600"
        />
        <Search size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
      </div>

      {/* Version Timeline List */}
      <div className="space-y-4">
        {mockHistory
          .filter(
            (v) =>
              v.editor.toLowerCase().includes(search.toLowerCase()) ||
              v.status.toLowerCase().includes(search.toLowerCase())
          )
          .map((v) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 items-start"
            >
              {/* Timeline indicator */}
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                <div className="w-[2px] h-16 bg-slate-300 dark:bg-slate-700"></div>
              </div>

              {/* Card */}
              <Card
                className="flex-1 border bg-white dark:bg-slate-800 shadow-sm rounded-xl cursor-pointer"
                onClick={() => setSelected(v)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <h2 className="font-bold text-sm flex items-center gap-1">
                      <User size={12} /> {v.editor}
                    </h2>
                    <span className={statusBadge[v.status]}>{v.status}</span>
                  </div>

                  <p className="flex items-center gap-1 text-[10px] mt-1 text-slate-500 dark:text-slate-400">
                    <Clock size={10} /> {v.timestamp}
                  </p>

                  <div className="text-[10px] mt-3 space-y-1">
                    {v.changes.map((c, i) => (
                      <p key={i} className="flex items-center gap-1">
                        <CheckCircle2 size={10} className="text-green-600" /> {c}
                      </p>
                    ))}
                  </div>

                  {/* Diff summary */}
                  <div className="flex gap-3 mt-3 text-[10px]">
                    <span className="text-green-600">+{v.diffSummary.added} added</span>
                    <span className="text-red-600">-{v.diffSummary.removed} removed</span>
                    <span className="text-indigo-600">{v.diffSummary.modified} modified</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
      </div>

      {/* View / Compare Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-xl border border-slate-300 dark:border-slate-700"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg flex items-center gap-1">
                  <FileDiff size={16} /> Version {selected.id}
                </h3>
                <Button variant="ghost" onClick={() => setSelected(null)}>
                  <XCircle size={18} />
                </Button>
              </div>

              <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3">
                Edited by <strong>{selected.editor}</strong> on {selected.timestamp}
              </p>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 text-[10px] mb-3">
                <p className={statusBadge[selected.status] + " inline-block mb-2"}>{selected.status}</p>

                <h4 className="font-semibold text-indigo-600 mb-1 flex items-center gap-1">
                  <Layers size={11} /> Changes
                </h4>

                <ul className="list-disc pl-4 space-y-1">
                  {selected.changes.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              {/* Diff Summary */}
              <div className="flex gap-3 mb-4 text-[10px]">
                <span className="text-green-600">+{selected.diffSummary.added} added</span>
                <span className="text-red-600">-{selected.diffSummary.removed} removed</span>
                <span className="text-indigo-600">{selected.diffSummary.modified} modified</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
                  <Eye size={12} /> View Full Diff
                </Button>

                <Button className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
                  <RefreshCw size={12} /> Restore Version
                </Button>

                <Button className="bg-slate-700 hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
                  <Download size={12} /> Export Diff
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
