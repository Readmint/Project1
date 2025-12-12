// app/admin-dashboard/reports/page.tsx
"use client";

/**
 * Reports & Analytics — SRS Section 6
 *
 * Includes:
 * - Plagiarism trends (monthly)
 * - Reviewer compliance metrics
 * - Average similarity % by category/author/reviewer
 * - Escalations / takedowns statistics
 * - Repeat offender list
 * - Scheduled reports panel
 *
 * UI rules:
 * - Cards: bg-card border border-border rounded-lg shadow-sm p-5 space-y-3
 * - Section titles + muted subtitles
 * - Responsive grids: grid md:grid-cols-* gap-6
 * - Clean spacing: space-y-8 for page layout
 */

export default function ReportsPage() {
  return (
    <div className="space-y-8">

      {/* Header */}
      <section>
        <h2 className="text-xl font-semibold text-foreground">Reports & Analytics</h2>
        <p className="text-muted-foreground text-sm">
          Platform insights: plagiarism trends, reviewer compliance, and escalation metrics.
        </p>
      </section>

      {/* Grid of high-level analytics modules */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Plagiarism Trend (Monthly) */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
          <div>
            <h3 className="font-medium text-foreground">Plagiarism Trend (Monthly)</h3>
            <p className="text-muted-foreground text-sm">
              Rate of flagged submissions over time.
            </p>
          </div>
          <div className="h-40 bg-muted border border-border rounded" />
        </div>

        {/* Reviewer Compliance */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
          <div>
            <h3 className="font-medium text-foreground">Reviewer Compliance</h3>
            <p className="text-muted-foreground text-sm">
              Percent of submissions scanned by reviewers.
            </p>
          </div>
          <div className="h-40 bg-muted border border-border rounded" />
        </div>

        {/* Escalations / Takedowns */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
          <div>
            <h3 className="font-medium text-foreground">Escalations & Takedowns</h3>
            <p className="text-muted-foreground text-sm">
              Policy enforcement across the platform.
            </p>
          </div>
          <div className="h-40 bg-muted border border-border rounded" />
        </div>
      </div>

      {/* More detailed analytics */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* Average Similarity by Category */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
          <div>
            <h3 className="font-medium text-foreground">Avg. Similarity by Category</h3>
            <p className="text-muted-foreground text-sm">
              Comparison of similarity percentages across content categories.
            </p>
          </div>
          <div className="h-48 bg-muted border border-border rounded" />
        </div>

        {/* Repeat Offender Authors */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
          <div>
            <h3 className="font-medium text-foreground">Repeat Offender Authors</h3>
            <p className="text-muted-foreground text-sm">
              Authors with multiple flagged submissions.
            </p>
          </div>

          <div className="h-48 bg-muted border border-border rounded" />
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-6">
        <div>
          <h3 className="font-medium text-foreground">Scheduled Reports</h3>
          <p className="text-muted-foreground text-sm">
            Automate periodic analytics delivery to stakeholders.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            placeholder="Report name"
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm"
          />

          <select className="px-3 py-2 bg-muted border border-border rounded-lg text-sm">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          <button className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all text-sm">
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
