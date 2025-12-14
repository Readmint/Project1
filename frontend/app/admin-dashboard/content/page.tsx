"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getJSON, postJSON } from "@/lib/api";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { FileText, Search, Filter, Eye, AlertTriangle, CheckCircle, XCircle, MoreVertical, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ContentOversightPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(null);

    const fetchContent = async () => {
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
                search: search
            });

            const res = await getJSON(`/admin/content?${query.toString()}`, token);
            if (res.status === "success") {
                setContent(res.data.content);
                setPagination(res.data.pagination);
            } else {
                if (res.status === 401 || res.status === 403) router.push("/admin/login");
                else toast.error("Failed to load content listings");
            }
        } catch (error) {
            console.error(error);
            toast.error("System error fetching content");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, [page, statusFilter]);

    const handleAction = async (articleId: string, action: string) => {
        const toastId = toast.loading("Processing action...");
        try {
            const token = localStorage.getItem("adminToken");
            if (!token) return;

            const res = await postJSON("/admin/content/action", { articleId, action }, token);
            if (res.status === "success") {
                toast.success(`Content ${action} successful`, { id: toastId });
                fetchContent();
            } else {
                toast.error(res.message || "Action failed", { id: toastId });
            }
        } catch (err) {
            toast.error("System error", { id: toastId });
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            <main className="flex-1 p-8 overflow-y-auto">

                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Content Oversight</h1>
                        <p className="text-slate-500 text-sm mt-1">Global content moderation and management.</p>
                    </div>

                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search title or author..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchContent()}
                                className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm w-64 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm outline-none"
                        >
                            <option value="all">All Status</option>
                            <option value="submitted">Submitted</option>
                            <option value="under_review">Under Review</option>
                            <option value="approved">Approved</option>
                            <option value="published">Published</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </header>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4">Author</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Risk Level</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading content...</td></tr>
                                ) : content.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-slate-500">No content found.</td></tr>
                                ) : (
                                    content.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white max-w-xs truncate" title={item.title}>
                                                {item.title}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                {item.author}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={item.status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                {/* Simulated Risk Level based on plagiarism score if available */}
                                                {item.plagiarism_score ? (
                                                    <RiskBadge score={item.plagiarism_score?.score || 0} />
                                                ) : (
                                                    <span className="text-slate-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg outline-none">
                                                        <MoreVertical size={16} className="text-slate-400" />
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Moderation</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        {/* <DropdownMenuItem>
                                                    <Eye size={14} className="mr-2" /> View Content
                                                </DropdownMenuItem> */}
                                                        <DropdownMenuItem onClick={() => handleAction(item.id, 'approve')}>
                                                            <CheckCircle size={14} className="mr-2 text-emerald-500" /> Approve
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleAction(item.id, 'reject')}>
                                                            <XCircle size={14} className="mr-2 text-red-500" /> Reject
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleAction(item.id, 'rescan')}>
                                                            <RefreshCw size={14} className="mr-2" /> Force Re-scan
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600" onClick={() => handleAction(item.id, 'takedown')}>
                                                            <AlertTriangle size={14} className="mr-2" /> Takedown
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
                            {/* Simplified pagination for brevity */}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        published: "bg-emerald-50 text-emerald-700 border-emerald-100",
        approved: "bg-blue-50 text-blue-700 border-blue-100",
        submitted: "bg-slate-50 text-slate-700 border-slate-100",
        under_review: "bg-amber-50 text-amber-700 border-amber-100",
        rejected: "bg-red-50 text-red-700 border-red-100",
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${styles[status] || styles.submitted}`}>
            {status.replace('_', ' ')}
        </span>
    );
}

function RiskBadge({ score }: { score: number }) {
    if (score > 40) {
        return <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">{score}% High</span>
    }
    if (score > 20) {
        return <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">{score}% Med</span>
    }
    return <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{score}% Low</span>
}
