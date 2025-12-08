"use client";

import { useState } from "react";
import { GitBranch, Clock, User, FileText } from "lucide-react";

type TimelineStage =
  | "Draft"
  | "Submitted"
  | "Assigned"
  | "Under Review"
  | "Editor Stage"
  | "Approved"
  | "Scheduled"
  | "Published";

interface TimelineEntry {
  stage: TimelineStage;
  timestamp: string;
  person: string;
  notes: string;
}

const contentItems = [
  {
    id: "RM-1024",
    title: "The Future of Quantum Computing",
    timeline: [
      {
        stage: "Draft",
        timestamp: "2025-12-01 09:12",
        person: "Author: Aarav Mehta",
        notes: "Initial draft created.",
      },
      {
        stage: "Submitted",
        timestamp: "2025-12-02 11:30",
        person: "Author: Aarav Mehta",
        notes: "Submitted for review.",
      },
      {
        stage: "Assigned",
        timestamp: "2025-12-02 12:15",
        person: "Manager: You",
        notes: "Assigned to Reviewer Arjun (Science).",
      },
      {
        stage: "Under Review",
        timestamp: "2025-12-03 10:05",
        person: "Reviewer: Arjun",
        notes: "Review in progress.",
      },
      {
        stage: "Editor Stage",
        timestamp: "2025-12-05 16:40",
        person: "Editor: Anita",
        notes: "Editing for clarity & tone.",
      },
      {
        stage: "Approved",
        timestamp: "2025-12-06 14:20",
        person: "Manager: You",
        notes: "Passed QC & approved.",
      },
      {
        stage: "Scheduled",
        timestamp: "2025-12-07 09:00",
        person: "Manager: You",
        notes: "Scheduled for featured slot.",
      },
      {
        stage: "Published",
        timestamp: "2025-12-10 10:30",
        person: "System",
        notes: "Article published successfully.",
      },
    ] as TimelineEntry[],
  },
  {
    id: "RM-1023",
    title: "Mindful Living in a Busy World",
    timeline: [
      {
        stage: "Draft",
        timestamp: "2025-12-02 08:10",
        person: "Author: Sara Kapoor",
        notes: "Draft outline completed.",
      },
      {
        stage: "Submitted",
        timestamp: "2025-12-03 09:45",
        person: "Author: Sara Kapoor",
        notes: "Submitted for review.",
      },
      {
        stage: "Assigned",
        timestamp: "2025-12-03 10:20",
        person: "Manager: You",
        notes: "Assigned to Reviewer Meera (Lifestyle).",
      },
      {
        stage: "Under Review",
        timestamp: "2025-12-04 13:00",
        person: "Reviewer: Meera",
        notes: "Review in progress.",
      },
    ] as TimelineEntry[],
  },
];

export default function WorkflowTimelinePage() {
  const [selectedId, setSelectedId] = useState(contentItems[0]?.id);

  const selectedItem = contentItems.find((c) => c.id === selectedId);

  return (
    <main className="px-6 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <GitBranch className="h-6 w-6 text-indigo-600" />
          Workflow Timeline
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Track each content piece through Draft → Submitted → Assigned → Review → Editor → Approved → Scheduled → Published.
        </p>
      </header>

      {/* Content selector */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Select Content
        </label>
        <select
          className="border rounded-lg px-3 py-2 text-sm dark:bg-slate-900 dark:border-slate-700"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {contentItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </section>

      {/* Timeline */}
      {selectedItem && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-slate-500" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {selectedItem.title}
              </h2>
              <p className="text-xs text-slate-500">{selectedItem.id}</p>
            </div>
          </div>

          <ol className="relative border-l border-slate-200 dark:border-slate-700 ml-2 space-y-4">
            {selectedItem.timeline.map((entry, idx) => (
              <li key={idx} className="ml-4">
                <div className="absolute -left-[9px] mt-1 h-3 w-3 rounded-full bg-indigo-600" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase text-indigo-600">
                      {entry.stage}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock className="h-3 w-3" />
                      {entry.timestamp}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <User className="h-3 w-3" />
                    {entry.person}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {entry.notes}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
