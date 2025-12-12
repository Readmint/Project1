// app/admin-dashboard/audit-logs/page.tsx
"use client";

/**
 * Audit Logs — SRS Section 5
 * Includes:
 * - Search (user, action, submission ID)
 * - Date range filters
 * - Export logs
 * - Scrollable, structured log table
 * - Shows: plagiarism scans, reviewer decisions, CM checks, editor approvals,
 *          admin overrides & takedowns.
 * 
 * UI rules:
 * - Opaque cards only: bg-card border border-border rounded-lg shadow-sm p-5
 * - Clean vertical rhythm: space-y-8 and space-y-6
 * - Muted headers, editorial typography
 * - Aurora only around layout (cards remain opaque)
 */

import {
  Search,
  Calendar,
  Download,
  FileText,
  ShieldCheck,
  CircleDot,
  ScanSearch,
  UserCheck,
  CheckCircle2,
  Gavel,
  Trash2,
} from "lucide-react";

// Dummy logs showing all SRS events
const LOGS = [
  {
    ts: "2025-12-02 10:12",
    user: "Reviewer A",
    role: "Reviewer",
    action: "Ran plagiarism scan",
    target: "CNT-1001",
    meta: "Similarity: 12%",
    icon: ScanSearch,
  },
  {
    ts: "2025-12-02 11:02",
    user: "CM Priya",
    role: "Content Manager",
    action: "Verified plagiarism report",
    target: "CNT-1001",
    meta: "CM Verified: Yes",
    icon: UserCheck,
  },
  {
    ts: "2025-12-01 19:44",
    user: "Editor X",
    role: "Editor",
    action: "Approved content",
    target: "CNT-1003",
    meta: "Status changed: Approved",
    icon: CheckCircle2,
  },
  {
    ts: "2025-12-01 17:12",
    user: "Admin B",
    role: "Admin",
    action: "Forced re-scan",
    target: "CNT-1002",
    meta: "Reason: Reviewer skipped scan",
    icon: FileText,
  },
  {
    ts: "2025-12-01 16:50",
    user: "Admin A",
    role: "Admin",
    action: "Overrode decision",
    target: "CNT-1002",
    meta: "Override: Rejected",
    icon: Gavel,
  },
  {
    ts: "2025-12-01 15:32",
    user: "Admin A",
    role: "Admin",
    action: "Takedown published content",
    target: "CNT-0483",
    meta: "Removed for policy violation",
    icon: Trash2,
  },
];

export default function AuditLogsPage() {
  return (
    <div className="space-y-8">

      {/* Header */}
      <section>
        <h2 className="text-xl font-semibold text-foreground">Audit Trail & Activity Logs</h2>
        <p className="text-muted-foreground text-sm">
          Tamper-evident logs for compliance. Search, filter, review, and export activity.
        </p>
      </section>

      {/* Filters + Export */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-6">

        {/* Filters row */}
        <div className="grid md:grid-cols-4 gap-4">

          {/* Search */}
          <div className="relative col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search logs (user, action, submission ID)"
              className="w-full pl-10 pr-3 py-2 bg-muted border border-border rounded-lg text-sm"
            />
          </div>

          {/* Start date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              className="pl-10 pr-3 py-2 bg-muted border border-border rounded-lg text-sm w-full"
            />
          </div>

          {/* End date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              className="pl-10 pr-3 py-2 bg-muted border border-border rounded-lg text-sm w-full"
            />
          </div>
        </div>

        {/* Export */}
        <div className="flex justify-end">
          <button className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all flex items-center gap-2 text-sm">
            <Download className="h-4 w-4" />
            Export All Logs
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
        <h3 className="font-medium text-foreground">Activity Log</h3>

        <div className="overflow-auto max-h-[600px] border border-border rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground sticky top-0 bg-card border-b border-border">
              <tr>
                <th className="py-2 px-3">Timestamp</th>
                <th className="px-3">User</th>
                <th className="px-3">Role</th>
                <th className="px-3">Action</th>
                <th className="px-3">Target</th>
                <th className="px-3">Metadata</th>
              </tr>
            </thead>

            <tbody>
              {LOGS.map((l, i) => {
                const Icon = l.icon;
                return (
                  <tr
                    key={i}
                    className="border-b border-border hover:bg-muted transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-3 flex items-center gap-2 text-foreground">
                      <CircleDot className="h-3 w-3 text-primary" />
                      {l.ts}
                    </td>

                    {/* User */}
                    <td className="px-3 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      {l.user}
                    </td>

                    <td className="px-3">{l.role}</td>

                    {/* Action */}
                    <td className="px-3 flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {l.action}
                    </td>

                    {/* Target */}
                    <td className="px-3">{l.target}</td>

                    {/* Metadata */}
                    <td className="px-3">{l.meta}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
