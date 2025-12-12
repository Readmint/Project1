// app/admin-dashboard/plagiarism-monitoring/page.tsx
"use client";

/**
 * Plagiarism Monitoring Panel
 * SRS Mapping: Section 4 — Cross-Verification & Monitoring
 * Includes:
 * - Filters (date, author, reviewer, similarity %, status)
 * - Rules engine: thresholds, auto-lock, CM-delay notifications
 * - Recent reports table (ID, Title, Reviewer Ran Check, Similarity, CM Verified, Admin Actions, Timestamp)
 * - Inline viewer placeholder for matched segments + metadata
 * - Admin actions (force re-scan, notify, lock, escalate, review)
 *
 * UI standard:
 * - Opaque cards: bg-card border border-border rounded-lg shadow-sm p-5
 * - Section structure: titles + muted descriptions
 * - Balanced whitespace; no clutter; minimal micro-interactions
 */

import { useState } from "react";
import {
  MoreVertical,
  RefreshCcw,
  Lock,
  Bell,
  Eye,
  FileDown,
  StickyNote,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

// Dummy dataset: realistic plagiarism events
const REPORTS = [
  {
    id: "PLG-0011",
    title: "AI and Ethics in Publishing",
    author: "John S.",
    reviewer: "Reviewer A",
    reviewerRanCheck: false,
    similarity: null,
    cmVerified: false,
    timestamp: "2025-12-02 10:12",
    status: "Missing Reviewer Check",
  },
  {
    id: "PLG-0012",
    title: "Modern Print Media",
    author: "Priya N.",
    reviewer: "Reviewer C",
    reviewerRanCheck: true,
    similarity: 68,
    cmVerified: false,
    timestamp: "2025-12-01 19:44",
    status: "Flagged",
  },
  {
    id: "PLG-0013",
    title: "Future of Reading",
    author: "Alicia P.",
    reviewer: "Reviewer B",
    reviewerRanCheck: true,
    similarity: 5,
    cmVerified: true,
    timestamp: "2025-12-01 14:18",
    status: "Cleared",
  },
];

export default function PlagiarismMonitoringPage() {
  const [selected, setSelected] = useState<typeof REPORTS[number] | null>(null);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <section>
        <h2 className="text-xl font-semibold text-foreground">Plagiarism Monitoring</h2>
        <p className="text-muted-foreground text-sm">
          Track plagiarism scans, reviewer compliance, CM verification, and escalation workflow.
        </p>
      </section>

      {/* Filters + Threshold Rules */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-6">

        {/* Filters */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Filters</h3>

          <div className="grid md:grid-cols-4 gap-3">
            <input
              placeholder="Submission ID / Title"
              className="px-3 py-2 bg-muted border border-border rounded-lg text-sm"
            />

            <input
              placeholder="Author"
              className="px-3 py-2 bg-muted border border-border rounded-lg text-sm"
            />

            <select className="px-3 py-2 bg-muted border border-border rounded-lg text-sm">
              <option value="">All Reviewers</option>
              <option>Reviewer A</option>
              <option>Reviewer B</option>
              <option>Reviewer C</option>
            </select>

            <input
              type="date"
              className="px-3 py-2 bg-muted border border-border rounded-lg text-sm"
            />
          </div>

          <div className="grid md:grid-cols-4 gap-3">
            <input
              placeholder="Similarity ≥ %"
              className="px-3 py-2 bg-muted border border-border rounded-lg text-sm"
            />

            <select className="px-3 py-2 bg-muted border border-border rounded-lg text-sm">
              <option value="">Status</option>
              <option>Flagged</option>
              <option>Cleared</option>
              <option>Missing Reviewer Check</option>
            </select>

            <input
              type="date"
              className="px-3 py-2 bg-muted border border-border rounded-lg text-sm"
            />

            <button className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all text-sm">
              Apply Filters
            </button>
          </div>
        </div>

        {/* Rules Engine */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Threshold & Rule Engine</h3>

          <div className="grid md:grid-cols-3 gap-4">

            {/* Similarity threshold */}
            <div>
              <label className="text-muted-foreground text-sm">Auto-Flag similarity ≥ %</label>
              <div className="mt-2 flex gap-3">
                <input
                  placeholder="e.g., 30"
                  className="px-3 py-2 bg-muted border border-border rounded-lg w-32 text-sm"
                />
                <button className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all text-sm">
                  Save
                </button>
              </div>
            </div>

            {/* Missing reviewer check */}
            <div>
              <label className="text-muted-foreground text-sm">Auto-lock if reviewer skipped scan</label>
              <select className="mt-2 px-3 py-2 bg-muted border border-border rounded-lg text-sm">
                <option>Enabled</option>
                <option>Disabled</option>
              </select>
            </div>

            {/* CM delay */}
            <div>
              <label className="text-muted-foreground text-sm">
                Notify CM if verification missing after (hours)
              </label>
              <div className="mt-2 flex gap-3">
                <input
                  placeholder="e.g., 12"
                  className="px-3 py-2 bg-muted border border-border rounded-lg w-32 text-sm"
                />
                <button className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all text-sm">
                  Save
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all text-sm">
              Export Flagged CSV
            </button>
            <button className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all text-sm">
              Run Bulk Re-scan
            </button>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">

        <h3 className="font-medium text-foreground">Recent Reports</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-muted-foreground">
                <th className="py-2">ID</th>
                <th>Title</th>
                <th>Author</th>
                <th>Reviewer Ran Check</th>
                <th>Similarity %</th>
                <th>CM Verified</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {REPORTS.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="py-3">{r.id}</td>
                  <td>{r.title}</td>
                  <td>{r.author}</td>

                  <td className={r.reviewerRanCheck ? "text-primary" : "text-destructive"}>
                    {r.reviewerRanCheck ? "Yes" : "No"}
                  </td>

                  <td>{r.similarity ?? "—"}</td>

                  <td className={r.cmVerified ? "text-primary" : "text-muted-foreground"}>
                    {r.cmVerified ? "Yes" : "No"}
                  </td>

                  <td
                    className={
                      r.status === "Flagged"
                        ? "text-destructive"
                        : r.status === "Cleared"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                  >
                    {r.status}
                  </td>

                  {/* Compact overflow actions */}
                  <td className="text-right">
                    <details className="relative inline-block">
                      <summary className="list-none cursor-pointer px-2 py-1 rounded hover:bg-muted transition-all">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </summary>

                      <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-sm p-3 z-50">
                        
                        <button
                          onClick={() => setSelected(r)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-all flex items-center gap-2 text-sm"
                        >
                          <Eye className="h-4 w-4" /> View Report
                        </button>

                        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-all flex items-center gap-2 text-sm mt-1">
                          <RefreshCcw className="h-4 w-4" /> Force Re-scan
                        </button>

                        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-all flex items-center gap-2 text-sm mt-1">
                          <Bell className="h-4 w-4" /> Notify Reviewer/CM
                        </button>

                        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-all flex items-center gap-2 text-sm mt-1">
                          <Lock className="h-4 w-4" /> Lock Content
                        </button>

                        <div className="border-t border-border my-2" />

                        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-all flex items-center gap-2 text-sm">
                          <ShieldAlert className="h-4 w-4" /> Escalate
                        </button>

                        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-all flex items-center gap-2 text-sm mt-1">
                          <ShieldCheck className="h-4 w-4" /> Mark Reviewed
                        </button>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inline Viewer + Workflow */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Inline Viewer */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
          <h3 className="font-medium text-foreground">Inline Report Viewer</h3>
          <p className="text-muted-foreground text-sm">
            View similarity breakdown, matched sources, reviewer metadata, and logs.
          </p>

          <div className="h-48 overflow-auto bg-muted border border-border rounded p-3">
            {selected ? (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Submission:</strong> {selected.title}</p>
                <p><strong className="text-foreground">Similarity:</strong> {selected.similarity ?? "—"}%</p>
                <p>Matched segments & sources would appear here.</p>
                <p>Reviewer: {selected.reviewer}</p>
                <p>Timestamp: {selected.timestamp}</p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Select a report from the table to view details.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all text-sm">
              <FileDown className="h-4 w-4 inline-block mr-1" />
              Download PDF
            </button>

            <button className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all text-sm">
              <StickyNote className="h-4 w-4 inline-block mr-1" />
              Add Note
            </button>
          </div>
        </div>

        {/* Workflow Explanation */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
          <h3 className="font-medium text-foreground">Cross-Verification Workflow</h3>

          <ol className="list-decimal ml-5 text-sm text-muted-foreground space-y-2">
            <li>Reviewer runs scan → system logs event.</li>
            <li>CM verifies similarity result and marks CM Verified.</li>
            <li>If reviewer skipped scan → Admin may force re-scan, notify, or lock content.</li>
            <li>High similarity → Admin can require re-evaluation or rollback to Author.</li>
            <li>Suspicious reviewer behavior → Escalation path to compliance/legal.</li>
          </ol>

          <p className="text-muted-foreground text-sm">
            All actions generate audit logs for compliance and traceability.
          </p>
        </div>
      </div>
    </div>
  );
}
