"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getJSON } from "@/lib/api";
import { BarChart3, TrendingUp, Users, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AnalyticsReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) {
          router.push("/admin/login");
          return;
        }

        const res = await getJSON("/admin/analytics", token);
        if (res.status === "success") {
          setData(res.data);
        } else {
          if (res.status === 401 || res.status === 403) router.push("/admin/login");
          else toast.error("Failed to load analytics");
        }
      } catch (error) {
        toast.error("System error fetching analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading reports...</div>;
  }

  // Data destructuring with new keys
  const {
    contentVelocity = [],
    editorPerformance = [],
    reviewerStats = []
  } = data || {};

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Deep insights into platform compliance and performance.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

          {/* Content Velocity (Submissions) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="text-indigo-500" size={20} />
                Content Velocity (Last 30 Days)
              </CardTitle>
              <CardDescription>Daily submission volume.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contentVelocity.length === 0 ? (
                  <p className="text-sm text-slate-500">No data available.</p>
                ) : (
                  contentVelocity.map((item: any) => (
                    <div key={item.date} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-700">{new Date(item.date).toLocaleDateString()}</span>
                        <span className="text-slate-500">{item.count} Submissions</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500"
                          style={{ width: `${Math.min((item.count / 10) * 100, 100)}%` }} // Scaling
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Editor Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="text-emerald-500" size={20} />
                Editor Performance
              </CardTitle>
              <CardDescription>Actions taken by editors.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {editorPerformance.map((item: any) => (
                  <div key={item.editor_name} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-700">{item.editor_name}</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      {item.actions_count} Actions
                    </span>
                  </div>
                ))}
                {editorPerformance.length === 0 && <p className="text-sm text-slate-500">No editor activity recorded.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviewer Compliance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="text-blue-500" size={20} />
              Reviewer Compliance Leaderboard
            </CardTitle>
            <CardDescription>Top reviewers by assignment volume and scan compliance.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Reviewer</th>
                    <th className="px-4 py-3">Assigned</th>
                    <th className="px-4 py-3">Completed</th>
                    <th className="px-4 py-3">Scans Run</th>
                    <th className="px-4 py-3">Compliance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reviewerStats.map((r: any, i: number) => {
                    const rate = r.assigned_count > 0 ? (r.scans_run / r.assigned_count) * 100 : 0;
                    return (
                      <tr key={i}>
                        <td className="px-4 py-3 font-medium text-slate-900">{r.reviewer_name}</td>
                        <td className="px-4 py-3">{r.assigned_count}</td>
                        <td className="px-4 py-3">{r.completed_count}</td>
                        <td className="px-4 py-3">{r.scans_run}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${rate >= 90 ? 'bg-emerald-100 text-emerald-700' : rate >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {rate.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {reviewerStats.length === 0 && (
                    <tr><td colSpan={5} className="p-4 text-center text-slate-500">No reviewer activity found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
