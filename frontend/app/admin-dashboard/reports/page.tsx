// app/admin-dashboard/reports/page.tsx
"use client";

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-foreground">Reports & Analytics</h2>
        <p className="text-muted-foreground text-sm">Exportable analytics: plagiarism trends, reviewer compliance, escalations.</p>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-card border border-border rounded-lg shadow-sm p-5">
          <p className="text-muted-foreground text-sm">Plagiarism Trend (Monthly)</p>
          <div className="h-36 mt-3 bg-muted border border-border rounded" />
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm p-5">
          <p className="text-muted-foreground text-sm">Reviewer Compliance</p>
          <div className="h-36 mt-3 bg-muted border border-border rounded" />
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm p-5">
          <p className="text-muted-foreground text-sm">Escalations / Takedowns</p>
          <div className="h-36 mt-3 bg-muted border border-border rounded" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="font-medium text-foreground">Scheduled Reports</h3>
        <p className="text-muted-foreground text-sm mt-2">Schedule exports to stakeholders via email.</p>
        <div className="mt-4 flex gap-3">
          <input placeholder="Report name" className="px-3 py-2 bg-muted border border-border rounded-lg" />
          <select className="px-3 py-2 bg-muted border border-border rounded-lg">
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
          <button className="px-3 py-2 rounded border border-border bg-card">Schedule</button>
        </div>
      </div>
    </div>
  );
}
