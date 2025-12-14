"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getJSON } from "@/lib/api";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Activity, Search, ClipboardList, Shield, User } from "lucide-react";
import { toast } from "sonner";

export default function AuditLogsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const query = new URLSearchParams({
        page: page.toString(),
        limit: "25",
      });

      const res = await getJSON(`/admin/audit-logs?${query.toString()}`, token);
      if (res.status === "success") {
        setLogs(res.data.logs);
        setPagination(res.data.pagination);
      } else {
        if (res.status === 401 || res.status === 403) router.push("/admin/login");
        else toast.error("Failed to load logs");
      }
    } catch (error) {
      console.error(error);
      toast.error("System error fetching logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <main className="flex-1 p-8 overflow-y-auto">

        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Audit Logs</h1>
          <p className="text-slate-500 text-sm mt-1">Immutable record of all administrative actions.</p>
        </header>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Admin</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Target</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading logs...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">No activity recorded yet.</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Shield size={14} className="text-indigo-500" />
                          {log.admin_name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 font-mono text-xs uppercase">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {log.target_type}: {log.target_id?.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate" title={JSON.stringify(log.details)}>
                        {JSON.stringify(log.details)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {log.ip_address || "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pagination && (
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
