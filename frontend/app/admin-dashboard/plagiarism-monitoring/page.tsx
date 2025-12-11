// app/admin-dashboard/plagiarism-monitoring/page.tsx
"use client";

export default function PlagiarismMonitoringPage() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-foreground">Plagiarism Monitoring</h2>
        <p className="text-muted-foreground text-sm">
          Recent plagiarism reports, cross-verification workflow, and rule engine controls.
        </p>
      </section>

      {/* Filters + Rules */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input placeholder="Submission ID / Title" className="px-3 py-2 bg-muted border border-border rounded-lg" />
          <input placeholder="Author" className="px-3 py-2 bg-muted border border-border rounded-lg" />
          <input type="date" className="px-3 py-2 bg-muted border border-border rounded-lg" />
          <select className="px-3 py-2 bg-muted border border-border rounded-lg">
            <option>All reviewers</option>
          </select>
          <input placeholder="Similarity ≥ %" className="px-3 py-2 bg-muted border border-border rounded-lg w-40" />
          <button className="px-3 py-2 rounded-lg border border-border bg-card">Apply</button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Auto-flag threshold</p>
            <div className="mt-2 flex gap-3">
              <input className="px-3 py-2 bg-muted border border-border rounded-lg w-28" placeholder="e.g. 30" />
              <button className="px-3 py-2 rounded-lg border border-border bg-card">Save</button>
            </div>
          </div>

          <div>
            <button className="px-3 py-2 rounded-lg border border-border bg-card">Export flagged CSV</button>
            <button className="px-3 py-2 rounded-lg border border-border bg-card ml-2">Run bulk re-scan</button>
          </div>
        </div>
      </div>

      {/* Recent Reports table */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5">
        <h3 className="font-medium text-foreground mb-3">Recent Plagiarism Reports</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-sm text-muted-foreground">
              <tr>
                <th className="py-2">ID</th>
                <th>Title</th>
                <th>Author</th>
                <th>Reviewer Ran Check</th>
                <th>Reviewer Similarity %</th>
                <th>CM Verified</th>
                <th>Admin Action</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="py-3">PLG-0001</td>
                <td>Deep Dive on X</td>
                <td>Author A</td>
                <td>No</td>
                <td>—</td>
                <td>No</td>
                <td>
                  <div className="flex gap-2">
                    <button className="px-2 py-1 rounded border border-border bg-card">Force Re-scan</button>
                    <button className="px-2 py-1 rounded border border-border bg-card">Notify</button>
                    <button className="px-2 py-1 rounded border border-border bg-card">Lock</button>
                  </div>
                </td>
                <td>2025-12-01 11:24</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-6">
          <div className="bg-muted border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Selected Report — Inline Viewer</p>
            <div className="mt-3 h-40 overflow-auto bg-card border border-border rounded p-3">
              {/* Placeholder for highlighted segments + source URLs */}
              <p className="text-muted-foreground text-sm">Similarity highlights and matched sources will appear here.</p>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="px-3 py-2 rounded border border-border bg-card">Download PDF</button>
              <button className="px-3 py-2 rounded border border-border bg-card">Add Admin Note</button>
              <button className="px-3 py-2 rounded border border-border bg-card">Mark Reviewed</button>
            </div>
          </div>

          <div className="bg-muted border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Cross-Verification Workflow</p>
            <ol className="text-sm list-decimal ml-5 mt-2 text-muted-foreground">
              <li>Reviewer runs scan → system records event</li>
              <li>CM validates & marks CM Verified</li>
              <li>If missing: Admin can force re-scan, notify, or lock</li>
            </ol>
            <p className="text-sm text-muted-foreground mt-3">Admin can escalate if misconduct is suspected.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
