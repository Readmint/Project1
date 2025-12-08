"use client";

import { BarChart2, Download } from "lucide-react";

const reportData = [
  { metric: "Weekly Submissions", value: 58 },
  { metric: "Reviewer Performance Score", value: "87%" },
  { metric: "Editor Load Balance", value: "Moderate" },
  { metric: "Top Category", value: "Tech" },
];

export default function ReportsPage() {
  return (
    <main className="px-6 py-6 space-y-6">
      <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
      <p className="text-slate-500 text-sm">
        Download insights on platform activity and performance.
      </p>

      <div className="space-y-4">
        {reportData.map((item, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border rounded-lg px-5 py-4 shadow-sm flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{item.metric}</p>
              <p className="text-sm text-slate-500">{item.value}</p>
            </div>
            <BarChart2 className="h-6 w-6 text-indigo-600" />
          </div>
        ))}
      </div>

      {/* Download */}
      <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg">
        <Download size={16} /> Download PDF Report
      </button>
    </main>
  );
}
