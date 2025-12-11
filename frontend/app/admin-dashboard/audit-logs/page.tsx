// app/admin-dashboard/audit-logs/page.tsx
"use client";

import {
  Search,
  Calendar,
  Download,
  FileText,
  ShieldCheck,
  CircleDot,
} from "lucide-react";

export default function AuditLogsPage() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-foreground">Audit Trail & Activity Logs</h2>
        <p className="text-muted-foreground text-sm">
          Tamper-evident logs for compliance. Search, filter, and export.
        </p>
      </section>

      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search logs (user, action, id)"
              className="w-full pl-10 pr-3 py-2 bg-muted border border-border rounded-lg"
            />
          </div>

          {/* Start Date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              className="pl-10 pr-3 py-2 bg-muted border border-border rounded-lg"
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              className="pl-10 pr-3 py-2 bg-muted border border-border rounded-lg"
            />
          </div>

          {/* Export Button */}
          <button className="px-4 py-2 rounded border border-border bg-card hover:bg-muted transition-all flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto max-h-[600px] border border-border rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground sticky top-0 bg-card border-b border-border">
              <tr>
                <th className="py-2 px-3">Timestamp</th>
                <th className="px-3">User</th>
                <th className="px-3">Role</th>
                <th className="px-3">Action</th>
                <th className="px-3">Target</th>
                <th className="px-3">Meta</th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="py-3 px-3 flex items-center gap-2">
                  <CircleDot className="h-3 w-3 text-blue-500" />
                  2025-12-01 10:00
                </td>
                <td className="px-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  Admin B
                </td>
                <td className="px-3">Admin</td>
                <td className="px-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Forced re-scan
                </td>
                <td className="px-3">PLG-0002</td>
                <td className="px-3">IP: 1.2.3.4</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
