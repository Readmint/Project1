"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getJSON, postJSON } from "@/lib/api";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { ShieldAlert, Search, CheckCircle, XCircle, AlertTriangle, Eye, FileText, User, Lock } from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PlagiarismMonitorPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(null);

    const fetchMonitor = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("adminToken");
            if (!token) {
                router.push("/admin/login");
                return;
            }

            const query = new URLSearchParams({
                page: page.toString(),
                limit: "15",
                status: statusFilter,
            });

            const res = await getJSON(`/admin/plagiarism?${query.toString()}`, token);
            if (res.status === "success") {
                setData(res.data.monitor);
                setPagination(res.data.pagination);
            } else {
                if (res.status === 401 || res.status === 403) router.push("/admin/login");
                else toast.error("Failed to load plagiarism monitor");
            }
        } catch (error) {
            console.error(error);
            toast.error("System error fetching data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMonitor();
    }, [page, statusFilter]);

    const handleVerify = async (reportId: string, action: string) => {
        // If reportId is null, we can't verify existing report. logic implies forcing check content action or similar.
        // But verify endpoint expects reportId.
        if (!reportId) {
            toast.error("No report exists to verify. Please force a scan first.");
            return;
        }

        const toastId = toast.loading("Processing...");
        try {
            const token = localStorage.getItem("adminToken");
            if (!token) return;

            const res = await postJSON("/admin/plagiarism/verify", { reportId, action, notes: "Admin Verification" }, token);
            if (res.status === "success") {
                toast.success("Processed successfully", { id: toastId });
                fetchMonitor();
            } else {
                toast.error(res.message, { id: toastId });
            }
        } catch (e) {
            toast.error("System error", { id: toastId });
        }
    }

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            <main className="flex-1 p-8 overflow-y-auto">

                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Plagiarism Monitor</h1>
                        <p className="text-slate-500 text-sm mt-1">Cross-verification of reviewer compliance and content originality.</p>
                    </div>

                    <div className="flex gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm outline-none"
                        >
                            <option value="all">All Content</option>
                            <option value="pending_check">Pending Check</option>
                            <option value="checked">Checked</option>
                        </select>
                    </div>
                </header>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Submission</th>
                                    <th className="px-6 py-4">Reviewer Compliance</th>
                                    <th className="px-6 py-4">Similarity</th>
                                    <th className="px-6 py-4">Last Check</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading monitor...</td></tr>
                                ) : data.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">No records found.</td></tr>
                                ) : (
                                    data.map((item) => (
                                        <tr key={item.article_id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900 dark:text-white max-w-xs truncate" title={item.title}>
                                                    {item.title}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                                    <User size={12} /> {item.author_name}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                {item.reviewer_id ? (
                                                    item.reviewer_ran_check ? (
                                                        <div className="flex items-center gap-2 text-emerald-600">
                                                            <CheckCircle size={16} />
                                                            <div>
                                                                <div className="text-xs font-semibold">Verified</div>
                                                                <div className="text-[10px] text-slate-500">by {item.reviewer_name}</div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-amber-600">
                                                            <AlertTriangle size={16} />
                                                            <div>
                                                                <div className="text-xs font-semibold">Not Run</div>
                                                                <div className="text-[10px] text-slate-500">Assigned: {item.reviewer_name}</div>
                                                            </div>
                                                        </div>
                                                    )
                                                ) : (
                                                    <span className="text-slate-400 text-xs">No Reviewer Assigned</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                {item.check_status === 'checked' ? (
                                                    <SimilarityBadge score={item.similarity_score} />
                                                ) : (
                                                    <span className="text-slate-400 text-xs italic">Pending Scan</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-slate-500">
                                                {item.check_date ? new Date(item.check_date).toLocaleDateString() : '-'}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                {/* Only show actions if check exists, else maybe link to content to force check */}
                                                <div className="flex justify-end gap-2">
                                                    {item.report_id && (
                                                        <>
                                                            <button
                                                                onClick={() => handleVerify(item.report_id, 'verify')}
                                                                className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded transition"
                                                                title="Mark Verified"
                                                            >
                                                                <CheckCircle size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleVerify(item.report_id, 'escalate')}
                                                                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition"
                                                                title="Escalate Incident"
                                                            >
                                                                <AlertTriangle size={16} />
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Lock/Reject Action */}
                                                    <button
                                                        onClick={async () => {
                                                            const token = localStorage.getItem("adminToken");
                                                            if (!token) return;
                                                            toast.loading("Locking content...");
                                                            await postJSON("/admin/content/action", {
                                                                articleId: item.article_id,
                                                                action: 'reject',
                                                                notes: 'Locked via Plagiarism Monitor'
                                                            }, token);
                                                            toast.success("Content Locked");
                                                            fetchMonitor();
                                                        }}
                                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-600 rounded transition"
                                                        title="Lock Content (Reject)"
                                                    >
                                                        <Lock size={16} />
                                                    </button>
                                                </div>
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
                                {/* Simple pagination */}
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

function SimilarityBadge({ score }: { score: number }) {
    if (score > 40) {
        return <span className="inline-flex items-center px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">{score}% Match</span>
    }
    if (score > 20) {
        return <span className="inline-flex items-center px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs font-bold">{score}% Match</span>
    }
    return <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-bold">{score}% Match</span>
}
