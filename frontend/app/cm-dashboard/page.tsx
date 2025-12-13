"use client";

import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Users,
  FileEdit,
  CheckCircle2,
  Clock,
  RefreshCw,
  CalendarDays,
  Layers,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import React from "react";

// Initial empty states, will be populated by API
const initialStats = [
  { label: "Total Submissions", value: 0, description: "All-time submissions", icon: ClipboardList },
  { label: "Pending Assignments", value: 0, description: "Awaiting reviewer/editor assignment", icon: Users },
  { label: "Under Review", value: 0, description: "Actively being reviewed", icon: Clock },
  { label: "Changes Requested", value: 0, description: "Awaiting author changes", icon: RefreshCw },
  { label: "Editor Queue", value: 0, description: "Waiting for editing", icon: FileEdit },
  { label: "Ready to Publish", value: 0, description: "Cleared by QC", icon: CheckCircle2 },
  { label: "Published", value: 0, description: "Live articles", icon: Layers },
  // { label: "Upcoming Publications", value: 0, description: "Scheduled items", icon: CalendarDays },
];

import { getJSON } from "@/lib/api"; // Ensure getJSON is available

export default function Page() {
  const router = useRouter();
  const [statsData, setStatsData] = React.useState(initialStats);
  const [recentSubmissions, setRecentSubmissions] = React.useState<any[]>([]);
  const [upcomingPublications, setUpcomingPublications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getJSON("/content-manager/dashboard-stats");
        if (res.status === "success") {
          const { stats: apiStats, recentSubmissions: apiRecent, upcomingPublications: apiUpcoming } = res.data;

          // Merge API values into our stats structure to keep icons
          const mergedStats = initialStats.map(stat => {
            const apiStat = apiStats.find((s: any) => s.label === stat.label);
            return apiStat ? { ...stat, value: apiStat.value } : stat;
          });

          setStatsData(mergedStats);
          setRecentSubmissions(apiRecent);
          setUpcomingPublications(apiUpcoming);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-10 text-center">Loading dashboard...</div>;
  }

  return (
    <main className="w-full px-6 py-6 space-y-6">
      {/* HEADER */}
      <header>
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">
          Content Manager Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monitor submissions, manage workflow, and publish efficiently.
        </p>
      </header>

      {/* STAT GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex items-start gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-sm">
              <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
                <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">{stat.label}</p>
                <p className="text-xl font-semibold">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.description}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* QUICK ACTIONS + WORKFLOW SNAPSHOT */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* QUICK ACTIONS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Quick Actions</h2>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push("/cm-dashboard/reviewer-assignments")}
              className="w-full flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 px-3 py-2 rounded-lg text-sm"
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Assign Reviewer
              </span>
              <ArrowRight className="h-3 w-3" />
            </button>

            <button
              onClick={() => router.push("/cm-dashboard/submissions?filter=ready")}
              className="w-full flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 px-3 py-2 rounded-lg text-sm"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Approve Content
              </span>
              <ArrowRight className="h-3 w-3" />
            </button>

            <button
              onClick={() => router.push("/cm-dashboard/change-requests")}
              className="w-full flex justify-between items-center bg-rose-50 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800 px-3 py-2 rounded-lg text-sm"
            >
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" /> Send Back for Changes
              </span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* WORKFLOW SNAPSHOT */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-3">Workflow Snapshot</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
            {[
              "1. Submitted",
              "2. Under Review",
              "3. Editor Stage",
              "4. QC & Scheduling",
            ].map((step, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="inline-block mb-1 text-indigo-600 font-semibold">{step}</span>
                <p className="text-[11px] text-slate-500">
                  Step {i + 1} of the publication pipeline.
                </p>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* RECENT SUBMISSIONS + UPCOMING PUBLICATIONS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* RECENT SUBMISSIONS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold">Recent Submissions</h2>
            <button onClick={() => router.push("/cm-dashboard/submissions")} className="text-xs text-indigo-600 hover:underline">
              View all →
            </button>
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[11px] uppercase text-slate-400 border-b">
                <th className="py-2">Title</th>
                <th className="py-2">Author</th>
                <th className="py-2">Status</th>
                <th className="py-2">Priority</th>
              </tr>
            </thead>
            <tbody>
              {recentSubmissions.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2">
                    <button onClick={() => router.push(`/cm-dashboard/submissions/${s.id}`)} className="text-indigo-600 hover:underline">
                      {s.title}
                    </button>
                  </td>
                  <td className="py-2">{s.author}</td>
                  <td className="py-2">{s.status}</td>
                  <td className="py-2">{s.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* UPCOMING SCHEDULED PUBLICATIONS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold">Scheduled Publications</h2>
            <button onClick={() => router.push("/cm-dashboard/scheduling")} className="text-xs text-indigo-600 hover:underline">
              Manage →
            </button>
          </div>

          <ul className="space-y-3">
            {upcomingPublications.map((item, i) => (
              <li key={i} className="flex justify-between bg-slate-50 dark:bg-slate-800/50 rounded-md p-3 border">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.date} • {item.time}
                  </p>
                </div>
                <span className="text-xs bg-indigo-100 px-2 py-1 rounded-full">{item.visibility}</span>
              </li>
            ))}
          </ul>
        </div>

      </section>
    </main>
  );
}
